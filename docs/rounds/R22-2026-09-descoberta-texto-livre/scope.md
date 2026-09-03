# Scope of round R22 — Descoberta profunda para demandas em texto livre

> Epic: [#59](https://github.com/hacklabr/maestra/issues/59) · Variant: Minimal (modo direto)
> Briefing: rascunho apresentado no chat (com coverage map) e aprovado sem rodadas de aprofundamento em sessão direta em 2026-09-02.
> Origem: [F048](../dogfooding/findings.md) — briefings rasos para demandas nascidas em texto livre, com retrabalho na implementação ("um erro nessa etapa vira uma bola de neve").
> Linhagem (não duplicata): [#20](https://github.com/hacklabr/maestra/issues/20) / R01–R02 definiram a **conduta** da descoberta (conversa → rascunho no chat → arquivo após aprovação); esta round ataca a **profundidade** para a porta de entrada mais carente de contexto. Dedup confirmado pelo humano (2026-09-02): demanda nova.
> **Dupla colisão de numeração (adendo 2026-09-02):** ao nascer, a pasta R20 (epic #58, mesma data) já existia → nasceu como R21 (RF-58–63 tomadas pela R20 → estas começam em **RF-64**); no merge local, a main já continha **R21-2026-09-calibracao-variante-tamanho** (epic #60, sessão paralela) → **renumerada para R22** no ato (regra verify-on-commit; microcopy resecionada §7.15→§7.16; versões j1→v6, kernel→v8, microcopy→v11). Superfície compartilhada com R20: `reference/microcopy.md` — coordenação de merge no design.

## Variant

minimal

## Requirements introduced

- RF-64 — **Magnitude declarada na abertura da descoberta (texto-livre)**: quando a demanda nasce em texto livre, o facilitador classifica a magnitude do escopo por rubrica objetiva (SIMPLE: domínio único, tipo único de usuário, sem superfície de integração, linguagem de adicionar/corrigir; COMPOSITE: 2+ domínios, múltiplos tipos de usuário, ambição de plataforma, ou mecânica nova), **declara em voz alta com a evidência**, e recalibra no meio da descoberta se a conversa revelar complexidade contrária. Evidência mista → COMPOSITE (custo assimétrico: briefing raso de escopo composto contamina tudo a jusante; over-questionar escopo simples é recuperável). SIMPLE → modo lean: ≤5 perguntas de eliciação no total da descoberta, com anti-bias gate ("o briefing fica materialmente errado sem isto? não → não pergunte"). Magnitude é eixo **distinto** da variante: profundidade da descoberta × peso do processo.
- RF-65 — **Âncoras obrigatórias no briefing**: o rascunho de briefing para demanda texto-livre cobre as cinco âncoras — (a) problema e por-que-agora, (b) para-quem e contexto de uso, (c) medida de sucesso, (d) fora-de-escopo com ≥1 item, (e) ancoragem no estado atual do produto. Resposta existente no repo **nunca** vira pergunta humana (derive > confirm > ask preservado — divergência deliberada do Briefing-Writer do Mesa, que proíbe leitura de codebase).
- RF-66 — **Coverage map + menu de aprofundamento**: todo rascunho texto-livre traz tabela de profundidade por âncora (● raso / ●● parcial / ●●● completo) em que célula rasa **nomeia o específico que falta** ("precisa de mais profundidade" é inválido), seguida de menu com ≤3 opções de aprofundamento ranqueadas (cada uma dizendo o que seria explorado). Máximo **1** rodada de aprofundamento por briefing. O fechamento oferece sempre: aprovar como está / aprofundar área / cortar escopo.
- RF-67 — **Procedência texto-livre marcada no nascimento**: a triagem registra a porta de entrada da demanda na camada de execução da epic (ex.: linha "Born from: free text") e encaminha à descoberta profunda; o kernel direto espelha pontualmente na Phase 2 (pointer — a substância vive na jornada, kernel permanece enxuto).
- RF-68 — **Eval de não-regressão da descoberta profunda**: cenário de eval que falha quando a descoberta de demanda texto-livre produz briefing sem magnitude declarada ou sem coverage map (extensão do arcabouço existente de scenarios/asserts — mesmo padrão da R19 e R20).

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Estender a descoberta profunda às demais portas de entrada (captura curada J11, promoção de stage-0) — candidatas naturais, avaliadas após um ciclo de uso real.
- Vendorizar ou importar o prompt do Briefing-Writer do Mesa (referência de método; maestra permanece standalone, zero dependência).
- Matriz nova de evals além do cenário proposto.
- Coverage map como motor de iteração (máx. 1 rodada de aprofundamento por briefing — deliberado).
- Limpeza do `docs/dogfooding/findings.md` duplicado (F023/F024 — demanda separada, já herdada do out-of-scope da R19 e R20).
- Mudanças na classificação de variante do J1 (magnitude não substitui nem alimenta a variante).

## Acceptance criteria (do briefing aprovado)

1. Descoberta de demanda texto-livre abre com magnitude declarada em voz alta, citando a evidência; SIMPLE respeita ≤5 eliciações totais; COMPOSITE percorre as âncoras completas.
2. Rascunho de briefing traz as cinco âncoras + coverage map honesto — célula rasa nomeia o específico que falta.
3. Menu de aprofundamento com ≤3 opções e máx. 1 rodada; aprovar/aprofundar/cortar visíveis no fechamento.
4. As instruções dizem explicitamente: resposta existente no repo nunca vira pergunta humana.
5. Eval de não-regressão pina magnitude + coverage map e falha na regressão a briefing raso.
6. Arquivos de instrução editados com bump de "Module version" (anti-drift) + `dist/` reconstruído (`check:dist` passa).
