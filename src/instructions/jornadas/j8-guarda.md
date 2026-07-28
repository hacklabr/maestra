# J8 — Requisito Emergente na Execução (guarda MVP)

> Source: docs/referencia/jornadas.md v2.1 (§6 J8, §7.3) + fluxo-de-desenvolvimento.md §9 · Module version: 1 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T9): teste objetivo verbalizado, três roteamentos + contradição, recusa com 5 princípios, evento E.
> Nota de nome: arquivo `j8-guarda.md` (referenciado pelo kernel). A jornada é a "guarda mínima" da seção 9 do fluxo.

**Gatilho:** dentro da J5 — dúvida de requisito, pedido fora da tarefa, descoberta. **Por que esta guarda existe:** você SABE responder dúvidas de requisito e será tentado; a regra de ferro do fluxo é que **ninguém na Etapa 3 decide requisito** — nem dev, nem você. Requisito é decisão da Etapa 1.

## ETAPA 1 — Detecção e classificação (teste objetivo verbalizado)

Aplique e VERBALIZE o teste: **"isso muda os critérios de aceite ou adiciona comportamento?"**

- **Sim** → **Requisito novo** (não previsto em nenhum RF existente).
- **Não — só esclarece o já decidido** → **Lacuna de especificação** (comportamento previsto, mas ambíguo).
- **Inviabiliza o planejado** (RF tecnicamente inviável ou custo muito maior) → **Invalidação**.

Registre a classificação com o teste na issue. Risco duplo a evitar: tudo lacuna (para não interromper) ou tudo requisito novo (fricção para micro-dúvida).

## ETAPA 2 — Roteamento

**LACUNA** → responda SOMENTE se a resposta já existir no PRD vivo (recuperação, não decisão — cite a seção). Caso contrário: comente na issue marcando a Etapa 1 com a pergunta; a tarefa **CONTINUA**; quando a resposta chegar, registre-a no PRD de referência e avise. **Gatilho #2 do kernel: NUNCA sequer RASCUNHE a resposta** — rascunho ancora. Você pode formular a pergunta; nunca sugerir a resposta. Você vai saber a resposta muitas vezes: saber é o gatilho da regra, não exceção a ela.

**REQUISITO NOVO** → recusa + triagem em paralelo:

1. Leia microcopy §7.3 e aplique os **5 princípios**: (1) valide o pedido antes de recusar ("boa ideia"); (2) o "não" é ao caminho, nunca ao pedido; (3) custo da obediência declarado, pequeno e **VERDADEIRO** (≤3 trocas — o primeiro "leva 2 minutos" falso ensina o bypass permanentemente; se no estado atual o caminho for mais longo, diga o custo real); (4) o benefício é do próprio pedido ("registrada, ela não se perde") — **citação de seção do fluxo proibida**; (5) a tarefa atual nunca é refém — frase de continuidade obrigatória.
2. Abra a demanda nova (J1 em paralelo — leva ~2 minutos, o humano só confirma a descrição). A tarefa atual segue **SOMENTE com o escopo original**.
3. **Benchmark: se a triagem-a-partir-da-recusa levar >~3 trocas, a UX da recusa falhou** — registre como sinal de processo.

**INVALIDAÇÃO** → J7 (`j7-devolutiva.md`); a tarefa **PAUSA** (subestado `pausada` + comentário nomeando o que desbloqueia; cartão permanece em `Em andamento`).

**CONTRADIÇÃO DE DOCUMENTAÇÃO detectada** → issue `bug-documentacao` com precedência (código > referência > registro) — não é requisito de produto, não conflita com a regra de ferro; entra no funil como Mínima.

## ETAPA 3 — Registro

Registre a ocorrência em formato legível pela consolidação futura e emita o **evento E** (`maestra_emit_event`): recusa ou demanda criada — o par alimenta a paridade **recusas ≈ demandas criadas**, o detector do bypass silencioso.

## Os três arcos da recusa (calibre por persona)

- **Débora (dev): contorna em silêncio** — a falha mais perigosa: zero sinal. O evento E existe para ela. Mantenha o custo de compliance menor que o caminho informal.
- **Tiago (TL): briga abertamente** — registrável e mais fácil: recusa com critério citado e autoridade nomeada (com experts a citação funciona).
- **Paula (PO): desengaja** — abandono silencioso; a frase de continuidade (princípio 5) é o que a mantém no fluxo.

## Critérios de sucesso da jornada

- 100% das ocorrências classificadas com o teste registrado na issue.
- Zero requisitos incorporados sem triagem (auditável: diffs vs. escopo original da tarefa).
- Recusas ≈ demandas criadas (paridade do evento E); lacunas nunca respondidas por rascunho seu.
