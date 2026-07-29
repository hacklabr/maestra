# Deviations — R02: conversa mais acolhedora e direta no fluxo

> Factual triple: **planned X → implemented Y → reason Z** (reason in the human's
> words). Confession vocabulary forbidden; the only cited consequence is
> "the documentation starts to lie". Reference document updated on every entry.

## D1 — Escopo A (header do J2 STAGE 2): previsto como "substituir" → implementado como "substituir + referência cruzada ao template bifásico"
- **Planned:** ADR-001 MUDANÇA 2 previa substituir o header de `j2-resume.md` STAGE 2 (enumeração de campos) pelo imperativo curto.
- **Implemented:** O imperativo curto foi adicionado **e** uma linha de referência cruzada ao template bifásico do microcopy §7.2 ("Microcopy §7.2 has the two-phase template — fill the slots there and emit only `<speech>`") foi acrescentada.
- **Reason:** "o header precisa apontar para onde o template vive, senão o imperativo fica sem o quê aplicar" — síntese do painel (Prompt Engineer, Q2: "(a) e (c) são redundância intencional em níveis diferentes; sem (c), (a) não tem o que aplicar").
- **Decision link:** ADR-001 MUDANÇA 2 (PONTO DE ESCOPO A: ENTRA).
- **Reference document updated:** `src/instructions/journeys/j2-resume.md` STAGE 2 (linhas 49–61).

## D2 — Onda de Stage 3: prevista como 6 tasks paralelas → implementada como 3 tasks acopladas
- **Planned:** ADR-001 §"Onda de Stage 3" enumerou 6 tasks (uma por arquivo: microcopy §7.2, j2 header, j3 três-fases, protocols P4, evals, reconciliação) presumindo paralelização.
- **Implemented:** 3 tasks (#7 implementação do refactor, #8 evals de não-regressão, #9 reconciliação), todas atribuídas ao mesmo responsável.
- **Reason:** "É necessário mesmo criar tanta issue separada? Não poderia ser uma única issue, porque não é um trabalho assim tão monumental? Não faz sentido executar uma delas e não executar a outra." — as mudanças são acopladas (o imperativo bifásico e o template só funcionam juntos; os evals testam a implementação); o teste de acoplamento ("faz sentido executar uma sem a outra?") falha para todas. Granularidade de variante Completa (time grande, mudanças independentes) aplicada ao Condensed acoplado.
- **Decision link:** F017 (dogfooding finding); correção aplicada na decomposição do Stage 2→3.
- **Reference document updated:** nenhum documento de referência alterado (decisão de granularidade de decomposição, não de comportamento). Lição registrada em `retro.md`.

## D3 — Evals: previsto Tier 1 (5 asserts) + Tier 2 (4 rubrics) + Tier 3 (golden transcripts) → implementado Tier 1 completo (5 asserts + cenário)
- **Planned:** ADR-001 MUDANÇA 5 previa três tiers de avaliação.
- **Implemented:** Tier 1 completo: 5 novos asserts determinísticos (`assertNoFieldEnumeration`, `assertApprovalLockJ3`, `assertRoundAnchorSpoken`, `assertUnblockWhenPaused` + extensão de `assertFalseableSummary` com issue-number), cenário `r02-welcoming-language.yaml` com 5 golden inputs (T1–T5). Tier 2 (LLM-judge rubrics) e Tier 3 (golden transcripts) não implementados nesta rodada.
- **Reason:** priorização — o ADR previu explicitamente: "Se o orçamento de evals apertar, priorizar tier-1 (a) + tier-2 ('conversation vs form')". O tier-1 cobre o PR gate; os tiers 2 e 3 são defesa contra drift sutil entre versões de modelo e ficam como follow-up (ROADMAP).
- **Decision link:** ADR-001 MUDANÇA 5 (PONTO DE ESCOPO B: "ambos os tiers entram" — a priorização de tier-1 primeiro é uma escolha de execução dentro do mesmo ADR, não uma contradição).
- **Reference document updated:** nenhum; gap de tier-2/tier-3 registrado como item de follow-up.
