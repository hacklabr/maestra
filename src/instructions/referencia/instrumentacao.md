# Instrumentação — Eventos A–F + Registro de Override

> Source: docs/referencia/jornadas.md §8 (v2.1) + src/tools/emit-event.ts (contrato real) · Module version: 1 — 2026-07-28
> Anti-drift: os formatos abaixo são cópia do schema zod da tool — se a tool mudar, este arquivo muda junto; divergência é finding.
> Changelog: v0 scaffold (T6) → v1 (T10): gatilhos de emissão, payloads exatos do schema, formatos de corpo verbatim da `buildEventBody`, exemplos trabalhados, thresholds do `maestra-report`.

## Contrato (não negociável)

- **Canal único:** `maestra_emit_event`. Nunca escreva linha de evento ou registro de override à mão — a tool constrói o corpo, valida o payload (zod) e **assina "— facilitador" por construção**.
- **Injeção de assinatura rejeitada:** qualquer string de payload contendo "— facilitador" faz a chamada falhar. Nunca inclua a assinatura no payload.
- **Formato é contrato de auditoria:** estas linhas existem PARA as queries futuras do `maestra-report`. Drift de formato = perda silenciosa de dados.
- **Args da tool:** `epic` (número da issue/iid), `type` (`A` | `B` | `C` | `D` | `E` | `F` | `override`), `payload` (record validado por tipo).

---

## Evento A — Contagem de perguntas da triagem

**Gatilho:** ao fim de CADA triagem (J1 Etapa 2 concluída), e imediatamente quando um turno ultrapassar 3 perguntas de elicitação.
**O que detecta:** falha de derivação (>3 num turno); creep de interrogatório. A métrica que importa: **perguntas deriváveis feitas mesmo assim — alvo zero.**

**Payload:**

| Campo | Tipo | Regra |
|---|---|---|
| `perguntas_elicitacao` | int ≥ 0 | Perguntas de elicitação feitas (**confirmações não contam**). |
| `perguntas_derivaveis` | int ≥ 0, **default 0** | Perguntas deriváveis feitas mesmo assim. |

**Corpo (verbatim da tool):**

```text
**Evento A** — triagem: {perguntas_elicitacao} perguntas de elicitação; deriváveis perguntadas: {perguntas_derivaveis} — facilitador
```

**Exemplo:**

```json
{ "type": "A", "payload": { "perguntas_elicitacao": 4, "perguntas_derivaveis": 1 } }
→ **Evento A** — triagem: 4 perguntas de elicitação; deriváveis perguntadas: 1 — facilitador
```

**Contagem procedural:** contam-se como elicitação apenas perguntas cujo objetivo é obter informação nova do humano. Confirmações de critérios derivados ("vou tratar como mudança localizada — me corrija...") NÃO contam. Coleta homogênea em lote (mapeamento de equipe) conta como 1.

---

## Evento B — Rodadas de correção do entendimento

**Gatilho:** ao fim da J1 Etapa 1 (humano confirmou a proposta de entendimento).
**O que detecta:** falha de compreensão (>1 rodada = proxy).

**Payload:**

| Campo | Tipo | Regra |
|---|---|---|
| `rodadas_correcao` | int ≥ 0 | Rodadas de correção até o humano confirmar. |

**Corpo (verbatim):**

```text
**Evento B** — entendimento: {rodadas_correcao} rodada(s) de correção até a confirmação — facilitador
```

**Exemplo:**

```json
{ "type": "B", "payload": { "rodadas_correcao": 0 } }
→ **Evento B** — entendimento: 0 rodada(s) de correção até a confirmação — facilitador
```

---

## Evento C — "Não sei" por critério

**Gatilho:** sempre que o humano responder "não sei" (ou equivalente) a um critério da triagem — um evento POR critério.
**O que detecta:** translation-gap (critério mal traduzido para o mundo observável do PO).

**Payload:**

| Campo | Tipo | Regra |
|---|---|---|
| `criterio` | enum (fechado) | Um dos valores abaixo — exatamente como escrito. |

**Valores válidos de `criterio` (enum zod, verbatim):**

```text
origem-tecnica · iniciativa-grande · estimativa-5-dias · modulos-3-ou-mais
modelo-dados-ou-contrato · decisao-tecnica-duradoura · comportamento-em-uso · demanda-vaga
```

**Corpo (verbatim):**

```text
**Evento C** — "não sei" no critério: {criterio} — facilitador
```

**Exemplo:**

```json
{ "type": "C", "payload": { "criterio": "estimativa-5-dias" } }
→ **Evento C** — "não sei" no critério: estimativa-5-dias — facilitador
```

---

## Evento D — Override com direção + critério contestado

**Gatilho:** junto de todo registro de override (ver `type=override` abaixo). O override é o registro formal P3; o evento D é a linha de calibração dos critérios 3.3 — um sem o outro é presence gap para o `maestra-report`.
**O que detecta:** pressão por rebaixamento de variante; dataset de calibração dos critérios de escala.

**Payload:**

| Campo | Tipo | Regra |
|---|---|---|
| `de` | string não vazia | Valor indicado pelos critérios/estado. |
| `para` | string não vazia | Valor decidido pelo humano. |
| `criterio_contestado` | string não vazia | O critério objetivo disputado (ex.: "estimativa > 5 dias"). |

**Corpo (verbatim):**

```text
**Evento D** — override: {de} → {para}; critério contestado: "{criterio_contestado}" — facilitador
```

**Exemplo:**

```json
{ "type": "D", "payload": { "de": "Condensada", "para": "Mínima", "criterio_contestado": "estimativa > 5 dias" } }
→ **Evento D** — override: Condensada → Mínima; critério contestado: "estimativa > 5 dias" — facilitador
```

---

## Evento E — Recusa J8 × demanda criada

**Gatilho:** em CADA recusa de requisito novo na Etapa 3 (microcopy §7.3) — no ato da recusa (`"pendente"`) e novamente quando a demanda for aberta (com o número).
**O que detecta:** **bypass silencioso** — recusas ≫ demandas criadas = dev contornando o agente (arco da Débora).

**Payload:**

| Campo | Tipo | Regra |
|---|---|---|
| `demanda_criada` | int positivo **ou** literal `"pendente"` | Número da issue aberta a partir da recusa, ou `"pendente"` no ato da recusa. |

**Corpo (verbatim):**

```text
**Evento E** — recusa J8 (requisito novo); demanda criada: {pendente | #N} — facilitador
```

**Exemplos:**

```json
{ "type": "E", "payload": { "demanda_criada": "pendente" } }
→ **Evento E** — recusa J8 (requisito novo); demanda criada: pendente — facilitador

{ "type": "E", "payload": { "demanda_criada": 52 } }
→ **Evento E** — recusa J8 (requisito novo); demanda criada: #52 — facilitador
```

---

## Evento F — Desvios: durante × na reconciliação

**Gatilho:** (a) ao fechar a reconciliação da rodada (contagem final); (b) ao detectar fechamento sem reconciliação tardiamente (J2 branch B6 — `fechada-sem-reconciliacao`).
**O que detecta:** **declaração tardia** — desvios que só apareceram na conferência final (ou depois) = governança degradada. Sinal mais direto de saúde da governança.

**Payload:**

| Campo | Tipo | Regra |
|---|---|---|
| `rodada` | string não vazia | Id da rodada (ex.: `R02`). |
| `durante` | int ≥ 0 | Desvios declarados durante a execução. |
| `na_reconciliacao` | int ≥ 0 | Desvios descobertos na conferência final (ou tardiamente). |

**Corpo (verbatim):**

```text
**Evento F** — rodada {rodada}: desvios durante={durante}, na-reconciliacao={na_reconciliacao} — facilitador
```

**Exemplo:**

```json
{ "type": "F", "payload": { "rodada": "R02", "durante": 2, "na_reconciliacao": 1 } }
→ **Evento F** — rodada R02: desvios durante=2, na-reconciliação=1 — facilitador
```

---

## type=override — Registro P3 de override

**Gatilho:** TODA decisão humana contra critério objetivo ou estado (variante, gate, triagem) — **register-then-act**: emitido ANTES de trocar label/metadados/criar onda. Atomicidade P3: label + metadados + comentário no mesmo ato + label `override-registrado` no épico.

**Payload:**

| Campo | Tipo | Regra |
|---|---|---|
| `tipo` | enum: `variante` \| `gate` \| `triagem` | |
| `de` | string não vazia | Valor indicado pelos critérios/estado. |
| `para` | string não vazia | Valor decidido pelo humano. |
| `criterio_contestado` | string não vazia | Critério objetivo contestado. |
| `motivo_declarado` | string não vazia — **OBRIGATÓRIO** | O motivo **nas palavras do humano** (é o payload da decisão). |
| `decidido_por` | string não vazia | Handle na plataforma (com ou sem `@` — a tool normaliza). |
| `data` | string não vazia | Data da decisão, YYYY-MM-DD. |

**Corpo (verbatim, multilinha):**

```text
**Registro de override** — facilitador
- Tipo: {tipo}
- De: {de} → Para: {para}
- Critério objetivo contestado: {criterio_contestado}
- Motivo declarado: {motivo_declarado}
- Decidido por: @{handle} em {data}
```

**Exemplo:**

```json
{ "type": "override", "payload": {
  "tipo": "variante", "de": "Condensada", "para": "Mínima",
  "criterio_contestado": "estimativa > 5 dias",
  "motivo_declarado": "escopo já está fechado com o cliente, não há o que detalhar em PRD",
  "decidido_por": "rafael", "data": "2026-07-28" } }
```

```text
**Registro de override** — facilitador
- Tipo: variante
- De: Condensada → Para: Mínima
- Critério objetivo contestado: estimativa > 5 dias
- Motivo declarado: escopo já está fechado com o cliente, não há o que detalhar em PRD
- Decidido por: @rafael em 2026-07-28
```

---

## Thresholds e leitura (`maestra-report`)

O agente não audita a si mesmo — o leitor dos sinais é o **`maestra-report` (CLI)**, rodado sob demanda/CI (G-15). Referência para interpretação na revisão de dogfooding:

| Sinal | Threshold | Leitura |
|---|---|---|
| A | >3 perguntas de elicitação num único turno | Falha de derivação — investigar o que devia ter sido derivado |
| A | `perguntas_derivaveis` > 0 | Alvo zero — cada unidade é um critério mal derivado |
| B | >1 rodada de correção | Falha de compreensão da proposta inicial |
| C | recorrência no mesmo `criterio` | Translation-gap: o wording daquele critério precisa de revisão |
| D | direção dominante "desce variante" | Pressão por rebaixamento — calibrar critérios 3.3 na retrospectiva |
| E | recusas ≫ demandas criadas | **Bypass silencioso** em curso — a UX da recusa está perdendo para o caminho informal |
| F | `na_reconciliacao` > 0 recorrente | Declaração tardia — desvios não estão sendo declarados no ato |
| Todos | **zero eventos em 3 meses** | Suspeita de absorção, não perfeição (métricas de saúde invertidas, anti-bypass #11) |

Requisitos associados (fonte §8): visibilidade do team.md (P5); distribuição em mensagem única (P7); variante "validada em uso" após **3 ciclos reais — ciclo só conta se fechar COM reconciliação**; roadmap com seção "assunções a validar no dogfooding" herdada dos ledgers [A*].
