# Template — Posição de mesa (`docs/rodadas/Rnn-aaaa-mm-nome/mesa/<id-mesa>-<turno>-<persona>.md`)

> Source: docs/referencia/jornadas.md J9 Etapa 2 (G-08, v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: template DERIVADO (a fonte fixa a classe, o local e o contrato de persistência, não o formato interno) — campos mínimos alinhados ao contrato G-08. Ajuste de formato é decisão de processo, registrada no Audit Log do jornadas.md.
> Classe: **REGISTRO auxiliar da rodada corrente** — imutável após escrita; **não é deletado quando a síntese vira ADR** (a síntese é o documento da decisão; as posições são o registro de quem disse o quê).

```markdown
# Mesa {id-mesa} — turno {N} — {persona}

**Rodada:** Rnn
**Pauta:** {a pergunta que a mesa precisa responder, em uma frase — registrada na convocação}
**Especialista:** {persona do catálogo}
**Data:** YYYY-MM-DD

## Posição
<!-- O que este especialista respondeu neste turno, com contexto completo
     dos turnos anteriores (ask_peer). Texto fiel à resposta — síntese
     editorial NÃO acontece aqui; síntese é artefato próprio (ADR/decisão). -->

## Convergências com turnos anteriores
<!-- Pontos de acordo com posições já registradas nesta mesa -->

## Divergências
<!-- Pontos de desacordo + o critério de desempate proposto, se houver -->
```

**Contrato de persistência (G-08):**
1. **Escrita no fim de CADA turno**, não só na síntese final — sem isso, "sessão morta → nada se perde" é falso.
2. **Nome do arquivo:** `<id-mesa>-<turno>-<persona>.md` na pasta `mesa/` da rodada corrente.
3. **Exceção pré-pasta:** mesa convocada antes do nascimento da pasta da rodada (ex.: durante a triagem) → posições persistem como **comentários no épico** (um por turno, assinados "— facilitador"), migrando para a pasta quando ela nascer — **nunca ficam só na sessão**.
4. **Retomada:** sessão interrompida reconstrói a mesa pela pauta + posições lidas do repositório/plataforma — sem perguntar a ninguém "onde estávamos".
5. **Síntese:** decisão técnica → ADR com status e rodada (`templates/adr.md`); se a mesa reverteu decisão anterior, o ADR antigo é marcado `Substituído` no mesmo ato. As posições permanecem como registro do caminho até a decisão.
