# ADR-001 — Linguagem natural nos templates de fala, com contrato bifásico derivation/speech

**Status:** Current
**Date:** 2026-07-28
**Round:** R02

## Context

O dogfooding do R02 (findings F009 e a própria origem do round) mostrou que o
Facilitador enuncia os campos internos do fluxo (`variante`, `round`, `stage`,
`substate`, `gate`) ao falar com humanos — especialmente na triagem e no Stage
1, onde a pessoa pode não ser técnica. O efeito é afastar quem chegou para
resolver um problema.

A raiz é irônica: as instruções **já dizem** para usar linguagem acolhedora
(kernel: "conversational journey ≠ form"; P4 blacklist; limites de perguntas
do J1). O problema não é falta de regra — é que o próprio material contratual
(templates de microcopy §7.2 "Derived state" e o header de j2 STAGE 2)
**especifica a enumeração dos campos**, com `{SLOTS}` no lugar exato onde a
fala vai. LLMs tratam templates verbatim como contratos de forma: o modelo
preenche os slots e preserva a estrutura ao redor. Quando a estrutura é uma
lista de campos, a saída é uma lista de campos. A "welcoming language" que
escorrega (F009) não é desobediência — é o modelo seguindo o template
*estruturalmente* e ignorando o adjetivo *semântico* "acolhedor" que mora em
outro arquivo.

### O insight que reorganiza o problema

Enumerar campos é **teatro de precisão**, não precisão. O contrato vivo do
fluxo não é "o humano ouviu os nomes dos campos". O contrato é:

1. A derivação aconteceu de verdade (digest + leitura de docs, anti-bypass #6).
2. O humano consegue **falsificar** a derivação (declaração falsificável +
   "Correct?") — o que requer que o humano **entenda** o que foi dito.
3. O humano sabe o que fazer a seguir (next action concreta com issue).
4. As contradições são nomeadas, nunca escondidas (B2, B3).

O modo jargão falha o contrato no ponto 2: quando o PO ouve "substate
awaiting-assessment", ele não tem base para dizer "incorreto" — não sabe quais
eram as alternativas, nem o que o termo significa. O "Correct?" vira carimbo
de borracha. **O jargão não preserva o contrato; ele apenas parece preservá-lo
enquanto destrói a falsificabilidade que é o coração do contrato.**

Logo, a naturalização dentro dos limites de contrato **fortalece** o workflow
— não é um trade-off contra ele. O refactor não escolhe entre rigor e
acolhimento; corrige um ponto onde o rigor aparente minava o rigor real.

### Mecanismo selado na avaliação de viabilidade (#5)

- **(c) Ajuste nos templates — primário:** ataca a raiz (o template
  especifica enumeração).
- **(a) Imperativo curto de redundância — secundário:** complemento no ponto
  de uso.
- **(b) Gatilho anti-bypass — descartado:** triggers cobrem *ações*, não *tom*;
  sem verificação mecânica.

### O painel de especialistas (J9)

Painel ad-hoc convocado antes deste ADR (issue #6, critério de aceite). Dois
especialistas, turnos sequenciais:

1. **Workflow Architect** (`product-workflow-architect`) — estabeleceu o mapa
   de contrato: o que é load-bearing (deve permanecer como slot tipado,
   possivelmente surfado na fala) vs. o que é apresentação (pode ser
   naturalizado). Definiu o princípio da preservação de contrato e a janela de
   aceitação (b)+(c).
2. **Prompt Engineer** (`software-development-prompt-engineer`) — converteu os
   limites de contrato em mecânica de template concreta: o padrão bifásico, o
   imperativo curto, a instrução de três fases para J3 Stage 1, e a estratégia
   de avaliação.

Posições registradas em
`docs/rounds/R02-2026-07-linguagem-acolhedora/panel/r02-linguagem-acolhedora-{1-product-workflow-architect,2-software-development-prompt-engineer}.md`.

## Decision

Adotar **cinco mudanças coordenadas** que operam em camadas complementares.
A direção é unânime no painel; os pontos de escopo (A/B/C abaixo) foram
decididos pelo mantenedor na síntese.

### Princípio guia

> **O Facilitador pensa em campos (derivação tipada); fala em consequências e
> ações.** Os campos são sempre derivados (anti-bypass #6). A fala converte
> campos → consequências + ações. A conversão é *lossless* com respeito ao que
> o humano precisa para decidir/verificar; é *lossy* apenas com respeito à
> nomeação interna — e essa perda é o objetivo, não um defeito.

A linha divisória não é "vocabulário interno vs. externo". É: **a correção do
workflow depende do humano ver este valor?** Se sim → contrato (permanece
slot tipado, possivelmente surfado). Se o valor é apenas um rótulo interno
para uma situação que o humano já apreende pela consequência → apresentação.

### MUDANÇA 1 — Template bifásico `<derivation>` + `<speech>` (mecanismo c, primário)

Reescrever o bloco "Derived state (J2)" de `microcopy.md` §7.2 (linhas ~92–97)
substituindo o template de substituição-direta por um template bifásico:

- **`<derivation>`** — slots tipados preenchidos por digest + repo reads
  (anti-bypass #6). Interno, nunca emitido ao humano. Documenta o contrato.
- **`<speech>`** — a única frase emitida. Tece, em ordem: (a) âncora de round
  (nome + tema, uma vez — C4); (b) situação atual (traduzida de stage+substate
  via tabela de conversão); (c) progresso (só se decisão-relevante); (d) next
  action concreta com issue (C3); (e) condição de unblock (só se paused — C7);
  (f) board move (só se executada — P6). Fecha com confirmação falsificável
  (C2): "correct?".

O template inclui:

- **Tabela "Substate → situation translation"** — mapeia cada valor de
  substate da closed vocabulary P1.1 para a frase falada correspondente.
- **Few-shot anchors (3 exemplos)** — demonstram a conversão campo→fala para
  `awaiting-assessment` (PO), `paused` (PO) e `in-execution` (Tech Lead). Os
  exemplos mostram o `<derivation>` preenchido e o `<speech>` resultante lado a
  lado — a conversão é demonstrada, não descrita.

**Slot table** (linhas ~99–108 atuais): preservada — documenta o contrato
tipado. Acréscimo: `{UNBLOCK_CLAUSE}` ganha linha própria (hoje embutido em
`{NEXT_ACTION}` condicionalmente), porque C7 é load-bearing.

**Rejeitado:** sub-templates por substate (10 templates). Multiplicaria a
superfície de manutenção e a ambiguidade — exatamente o que F009 mostra que o
modelo já não gerencia bem. O que varia é *quais slots disparam*, não *a
estrutura do template*. Cláusulas condicionais num único template são
superiores.

### MUDANÇA 2 — Imperativo curto em dois pontos (mecanismo a, secundário) — PONTO DE ESCOPO A: ENTRA

Substituir o header atual de **`j2-resume.md` STAGE 2** (linha ~49), que hoje
enumera campos ("variant, round with number + theme..., stage, substate..., 
gate, what is missing, assumed persona, concrete next action"), por:

> Fill the typed slots internally via digest + repo reads, then emit ONE
> sentence weaving: round anchor (name + theme, once) + current situation (in
> plain words, translated from substate) + next action with issue + unblock
> condition if paused. Close with "correct?". The field names `variant` /
> `stage` / `substate` / `gate` stay internal — the human hears the
> consequence, not the label.

Acrescentar header em **`microcopy.md` §7.2** (imediatamente acima do template
"Derived state"), com referência cruzada:

> §7.2 templates: the `<derivation>` block is internal (typed slots, filled by
> digest); the `<speech>` block is the ONLY text emitted. Never enumerate the
> field names to a non-technical persona — speak the consequence. See j2
> STAGE 2 header.

**Justificativa do escopo A:** o header de j2 STAGE 2 *hoje enumera campos* —
é gêmeo do ofensor no nível da jornada. Não substituí-lo deixaria a fonte da
regressão intacta no nível da instrução de jornada. A redação é precisa (sem
qualificadores vagos como "be welcoming" — proibidos). (a) e (c) são
redundância intencional em níveis diferentes: (c) mora na referência (lido uma
vez por sessão); (a) mora na jornada (lido a cada execução de STAGE 2). Sem
(a), o modelo pode ter lido (c) há 10 turnos e esquecido.

### MUDANÇA 3 — J3 Stage 1 em três fases com turn-boundaries (RF-04 / C8 + C9 + C10)

Substituir o imperativo colapsado "You PROPOSE the draft" (j3-stage1.md STAGE
1, linhas ~13–15) por três fases explícitas, cada uma um turno distinto:

- **Phase 1 — Discovery conversation (C8):** perguntas de descoberta no chat
  (problema, métrica de sucesso, restrições, fora de escopo), ancoradas no
  estado atual lido em STAGE 0. Uma pergunta por turno quando possível; nunca
  mais de três numa mensagem (P4). Nenhum arquivo nasce aqui.
- **Phase 2 — Draft in chat (C9):** quando a descoberta dá informação
  suficiente, apresentar o rascunho **no chat**, não como arquivo. Estrutura:
  problema · métrica · restrições · fora de escopo (≥1 item explícito).
- **Phase 3 — Approval gate, turn-close, default NOT approved (C10):** encerrar
  com pedido explícito de aprovação como turn-close distinto:
  > "Posso registrar esse rascunho como o briefing do round?"

  Então **STOP**. Não criar o arquivo. Não prosseguir para STAGE 2. O default
  é NOT approved — silêncio, ou o humano editando o rascunho inline no chat,
  **nunca** é aprovação. Apenas um "sim"/"pode"/"approved" explícito num
  turno humano distinto autoriza a criação do arquivo. A pasta do round nasce
  aqui (primeiro commit de artefato), em todas as variantes.

  **Sinal de processo preservado:** se o humano reescreve completamente o
  rascunho no chat, a descoberta falhou — re-engajar com perguntas melhores.

**Por que previne F009:** três fases nomeadas com turn-boundaries explícitas; o
"Then STOP" é o lock mecânico (análogo ao `assertApprovalLock` do J6);
"silence is never approval" aplica anti-bypass #3 por analogia.

### MUDANÇA 4 — Manutenção seletiva (não refactor de tudo)

Preservar **literalmente** os templates que já falam em consequências — são o
padrão-alvo, não precisam de refactor:

- `microcopy.md` §7.1 (gate met/blocked — já fala em consequência)
- `microcopy.md` §7.2 sub-templates de erro ("Contradictory labels", "Issue
  without labels", "Artifact not found", "Documentation contradiction") — já
  são naturais E falsificáveis
- `microcopy.md` §7.3 (J8 refusal — já é conversa)
- `microcopy.md` §7.7 (persona switch — load-bearing explícito)
- `microcopy.md` §7.10 (handoffs — já nomeiam consequência)
- `microcopy.md` §7.11 (deviation — já é ensino conversacional)

Estes cobrem ~80% do microcopy. O refactor atinge os 20% que ainda enumeram
(bloco "Derived state" de §7.2 + header de j2 STAGE 2 + j3 STAGE 1).

### MUDANÇA 5 — Evals: fechar o gap do P4_BLACKLIST (PONTO DE ESCOPO B: AMBOS OS TIERS) — PONTO DE ESCOPO C: RODAR ANTES DE MERGEAR

**Gap crítico detectado:** a `P4_BLACKLIST` atual
(`evals/lib/transcript-asserts.mjs:14`) alveja **jargão de engenharia** (DoR,
ADR, TDD, baseline...). **NÃO alveja** os termos internos do fluxo
(`variante`, `round`, `stage`, `substate`, `gate`) que o critério de aceitação
#1 do scope proíbe enumerar. Pior: `round`, `gate`, `stage` são permitidos
isoladamente em P4. Logo, a asserção que detecta a regressão de R02 **não
existe ainda**.

Estender a regex seria **errado** — o alvo é o **padrão de enumeração como
campos**, não a palavra isolada. Adicionar:

**Tier 1 — Determinístico (PR gate):**

| Assert | Função | O que valida |
|---|---|---|
| `assertNoFieldEnumeration` | regex de enumeração (3+ field-names em sequência próxima) + regex de formato "label: value" | Under-naturalização (regressão ao bug R02) |
| `assertNextActionWithIssue` (extensão de `assertFalseableSummary`) | exige `#\d+` na fala | Over-naturalização que perde acionabilidade (F6) |
| `assertApprovalLockJ3` (generalização do `assertApprovalLock` do J6) | nenhuma escrita em `docs/rounds/Rnn-*/briefing.md` antes do "sim" explícito | F009 colapso |
| `assertRoundAnchorSpoken` | âncora de round na primeira turn do agente | C4 preservado |
| `assertUnblockWhenPaused` | se `substate=paused`, condição de unblock na fala | C7 preservado |

**PONTO DE ESCOPO C:** a extensão de `assertFalseableSummary` para exigir
issue-number pode quebrar cenários existentes que passam hoje. **Rodar contra
`j2-resume.yaml` atual antes de mergear** — se quebrar, é sinal de regressão
pré-R02 e o cenário precisa ser atualizado anyway.

Novo arquivo de cenários: `evals/scenarios/r02-welcoming-language.yaml` com 5
golden inputs (T1: J2 awaiting-assessment PO; T2: J2 paused PO; T3: J2
in-execution Tech Lead; T4: J2 contradição B2 PO; T5: J3 Stage 1 discovery PO).

**Tier 2 — LLM-as-judge (nightly):** 4 rubrics — "next-action findable",
"contradiction findable", "conversation vs form", "approval not collapsed (J3)".

**PONTO DE ESCOPO B:** ambos os tiers entram. A regex de enumeração (tier 1) é
a peça mais frágil — um modelo pode enumerar sem o padrão exato. O LLM-judge
"conversation vs form" (tier 2) é o backstop. São complementares, não
redundantes. Se o orçamento apertar, priorizar tier-1 (regex) + tier-2
("conversation vs form").

**Tier 3 — Golden transcripts:** capturar transcripts pós-refactor de J2 resume
e J3 Stage 1 discovery para defesa contra drift silencioso entre versões de
modelo.

### Onda de Stage 3 (decomposição — tasks paralelas, sem sobreposição de arquivos)

1. **`microcopy.md`** §7.2 "Derived state" → template bifásico + few-shot +
   tabela substate→situação (RF-05, a área mais extensa).
2. **`j2-resume.md`** STAGE 2 header → imperativo curto substituindo enumeração
   (RF-03 + mecanismo a).
3. **`j3-stage1.md`** STAGE 1 → três fases com turn-boundaries (RF-04).
4. **`protocols.md`** P4 + imperativo curto nos pontos de uso (RNF-01).
5. **Evals** — 5 novos asserts + cenário R02 + rubrics (garantia de não-regressão).
6. **Reconciliação** — tarefa de revisão final (P7, assignee confirmado).

A onda nasce como tasks filhas da epic #3, criadas na triagem do Stage 2.

## Consequences

### Positivas

- **Acessibilidade:** pessoa não-técnica entende em uma leitura o que está
  acontecendo e o que se espera dela — métrica de sucesso do mini-briefing
  atendida.
- **Falsificabilidade real:** o "Correct?" deixa de ser carimbo — o humano
  agora pode contestar porque entende o que foi dito. O contrato é
  **fortalecido**, não enfraquecido.
- **Drift-resistance estrutural:** a fronteira de tag `<derivation>`/`<speech>`
  é um cue posicional duro — robustez contra a regressão que F009 documentou.
- **Bug fonte corrigido:** o template deixa de *especificar* enumeração; o
  header da jornada deixa de *mandar* enumerar.
- **Garantia mensurável:** evals cobrem o gap crítico do P4_BLACKLIST e
  detectam both over-naturalização (tier 2) e under-naturalização (tier 1).

### Negativas / custos

- **Superfície de template maior:** o bloco bifásico + few-shot + tabela é mais
  verboso que o template atual de 6 linhas. Custo de tokens por sessão
  ligeiramente maior (lido uma vez no início). Aceito: a verbosidade documenta
  o contrato e demonstra a conversão.
- **Curva de manutenção:** mudar a closed vocabulary P1.1 de substates agora
  exige atualizar também a tabela "Substate → situation translation". Custo
  baixo, mas real — é um novo touchpoint acoplado a P1.1.
- **Risco de over-naturalização:** se o refactor esconde next-action, unblock,
  contradição ou âncora de round, o contrato quebra. Mitigado pelos evals
  tier-1 (b, d, e) + tier-2 ("next-action findable", "contradiction findable").
- **Risco de regressão sutil:** modelo pode enumerar sem o padrão exato da
  regex. Mitigado pelo tier-2 ("conversation vs form") como backstop.

### Neutras / observações

- **Decisão de mecanismo selada em #5** (c + a, b descartado) — não reaberta
  por este ADR.
- **Painel convocado por exigência do critério de aceite da #6** — a decisão
  toca múltiplos domínios (contrato de workflow + engenharia de prompts).
- **Templates preservados literalmente** (§7.1, §7.2 erros, §7.3, §7.7, §7.10,
  §7.11) são o padrão-alvo — provam que a conversão campo→fala é factível
  dentro do próprio microcopy. O refactor generaliza o padrão que já funciona
  em 80% do arquivo para os 20% que ainda enumeram.

### Critério de aceitação do refactor (janela (b)+(c) do Workflow Architect)

Para cada template de fala destinado a persona não-técnica, após o refactor:

- (a) Os pedaços de contrato C1–C7 (resume) / C8–C12 (Stage 1) / C13–C17
  (gates) / C18–C21 (handoffs) permanecem deriváveis e honrados.
- (b) Uma terceira pessoa lendo a fala não encontra
  "variante/round/stage/substate/gate" enumerados como campos.
- (c) Uma terceira pessoa ainda consegue dizer, lendo a fala, qual é a next
  action e qual é a contradição (se houver) — a falsificabilidade foi
  preservada.

Se (b) passa mas (c) falha: over-naturalizou, quebrou o contrato. Se (c) passa
mas (b) falha: under-naturalizou, manteve o bug. Os dois critérios juntos
definem a janela correta.

---

## Adendo datado — 2026-09-02 (R20, issue #58): extensão da doutrina para clareza de conteúdo, toda persona

A R20 (origem: F047 — textos mentalmente custosos, IDs internos sem
explicação, jargão não traduzido, frases densas) estende esta ADR do **tom**
para a **clareza do conteúdo**, agora para **toda persona, inclusive
técnica**: microcopy §7.15 nasce com quatro imperativos verificáveis —
(1) referência interna glossada na primeira ocorrência; (2) inglês só como
nome próprio da coisa; (3) curto sem omitir o relevante (o que aconteceu, o
que significa, o que vem depois); (4) toda persona, sem exceção.
Não-regressão por eval (cenário `r20-clear-writing`).

A mesma janela de falsificabilidade do contrato bifásico aplica à clareza:
(a) a mensagem natural deve ser legível sem decifrar códigos internos; (b) o
registro preciso mantém a referência exata onde vive (findings.md, issue);
(c) uma terceira pessoa, lendo a fala, ainda consegue dizer o que aconteceu
e qual é a próxima ação. Simplificar até perder a referência quebra (b);
jargão que obriga o leitor a decifrar quebra (a).
