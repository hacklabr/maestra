# Panel r02-linguagem-acolhedora — Turn 2 — Prompt Engineer

> Painel ad-hoc (J9) do R02. Especialista: `software-development-prompt-engineer`.
> Sessão: segundo turno, lê a posição do Workflow Architect (turno 1). Agenda:
> como refatorar os templates de fala do Maestra para que o facilitador produza
> linguagem natural e acolhedora preservando o rigor contratual de derivação de
> estado, gates e handoffs.

---

[software-development-prompt-engineer]

Lidos: posição do Workflow Architect (C1–C21, princípio, failure modes F1–F10,
janela de aceitação (b)+(c)), scope, mini-briefing, microcopy completo (§7.1–
§7.11), j2-resume, j3-stage1, protocols P1–P7, findings F001–F016 (com foco em
F009), e a infra de evals existente (scenarios, asserts, `transcript-asserts.mjs`,
`P4_BLACKLIST`).

Antes de responder às quatro perguntas, registro três observações que
reorganizam o problema do lado de engenharia de prompts — análogas ao "insight
central" do arquitecto, mas do meu domínio.

---

## Observações preliminares (do meu lado)

**O1 — O template É a instrução.** O ofensor §7.2 "Derived state" não está
*dizendo ao modelo para enumerar campos*; ele **é a enumeração**, com `{SLOTS}`
no lugar exato onde a fala vai. LLMs tratam templates verbatim como contratos
de forma — o modelo preenche os slots e preserva a estrutura ao redor. Quando
a estrutura é uma lista de campos, a saída é uma lista de campos. A "welcoming
language" que escorrega (F009) não é desobediência; é o modelo seguindo o
template *estruturalmente* e ignorando o adjetivo *semântico* "acolhedor" que
está em outro arquivo. **Conclusão: a naturalização tem que morar na estrutura
do template, não em instruções adjetivais distantes.**

**O2 — A `P4_BLACKLIST` atual não cobre R02.** Verifiquei
`evals/lib/transcript-asserts.mjs:14`:
```
/\b(DoR|ADR|TDD|baseline|characteri[zs]ation|parity|coupling|modules?|API contract|hooks?|as built)\b/i
```
Esta regex alveja **jargão de engenharia** (termos que o PO não deve ouvir).
**NÃO alveja os termos internos do fluxo** (`variante`, `round`, `stage`,
`substate`, `gate`) que o critério de aceitação #1 do scope proíbe enumerar.
Pior: `round`, `gate`, `stage` são termos *permitidos* isoladamente em P4 (são
"English terms" ou "Domain terms" livres). Logo, a asserção que detecta a
regressão de R02 **não existe ainda** — precisa ser construída. É o ponto cego
do Q4.

**O3 — Existe um padrão-alvo vivo no próprio microcopy.** O arquitecto apontou:
§7.1 (gate met/blocked), os sub-templates de erro de §7.2 ("Contradictory
labels", "Artifact not found"), §7.3, §7.10, §7.11 **já falam em
consequências**. São a prova de que a conversão campo→fala é factível dentro do
próprio arquivo. O refactor não inventa um padrão novo — **generaliza o padrão
que já funciona em 80% do microcopy** para os 20% que ainda enumeram
(basicamente: o bloco "Derived state" de §7.2 e o header de j2 STAGE 2).

Com isso, respondo.

---

## Q1 — Mecânica concreta de template para (c): o rewrite de §7.2 "Derived state"

### BEFORE (linhas 92–97 atuais — o ofensor)

```text
I read the demand state from the issue platform: epic {EPIC}, variant {VARIANT},
round {ROUND_ID} ({ROUND_THEME}), Stage {STAGE} in progress ({K} of {M}
tasks closed). We continue from where it stopped: {NEXT_ACTION}. {BOARD_CLAUSE}
Correct?
```

**Diagnóstico prompt-engineering:** isto é um template de *substituição direta*.
O modelo lê "variant {VARIANT}, round {ROUND_ID}, Stage {STAGE}" e produz
"variant Condensed, round R02, Stage 1" — field enumeration literal, exatamente
o que RF-03 proíbe. O "Correct?" no fim (C2) está correto estruturalmente, mas
chega *depois* de uma sequência que o humano não consegue falsificar — vira
carimbo (F8 do arquitecto).

### Padrões candidatos (análise comparativa)

| Padrão | Descrição | Drift-resistance | Custo | Veredito |
|---|---|---|---|---|
| **(P1) Slot-binding + instrução de transformação** | Mantém slots tipados; instrução diz "converta para fala natural" | Média — instrução abstrata, modelo pode ignorar | Baixo | Necessário, insuficiente isolado |
| **(P2) Few-shot examples** | 3–4 pares input→output mostrando a fala-alvo | **Alta** — concreto supera abstrato em LLMs | Médio | Âncora forte |
| **(P3) Structural two-phase block** | Bloco `<derivation>` (slots internos) + bloco `<speech>` (fala a emitir); modelo emite só o segundo | **Muito alta** — fronteira de tag é cue duro | Médio | **Núcleo da proposta** |
| **(P4) Sub-templates por substate** | 10 templates (um por substate de P1.1) | Média — mas explode superfície de manutenção, aumenta ambiguidade (F009) | Alto | **Rejeitado** |

### Recomendação primária: **(P3) bloco bifásico + (P1) diretiva de transformação + (P2) few-shot ancorado**

Justificativa: a pergunta central é *robustez contra drift* (F009). A literatura
e minha experiência convergem em três achados:

1. **Separação estrutural vinge instrução adjetival.** Uma tag `<speech>` que
   abre e fecha é um cue posicional duro — o modelo sabe "depois de
   `</derivation>`, mudo de registro". Instrução pura ("seja natural") é cue
   semântico mole — escorrega (F009 comprova).
2. **Few-shot vinge instrução abstrata para transformação de estilo.** Modelos
   são muito melhores em *pattern-matching* de exemplos concretos do que em
   seguir regras de transformação ("converta campos em consequências"). Mas
   few-shot isolado não documenta o contrato — por isso é âncora, não núcleo.
3. **Negação pura ("do NOT enumerate") falha de dois modos:** (a) o modelo às
   vezes inverte a negação; (b) mesmo quando seguida, deixa um buraco sem
   substituto. Sempre parear negação com **substituto positivo explícito**
   ("emit ONE sentence weaving...").

**Por que não (P4) sub-templates por substate:** o arquitecto definiu que o que
varia é *quais slots disparam* (C7 só se `paused`, `{BOARD_CLAUSE}` só se move
executada), não *a estrutura do template*. Multiplicar templates por 10
aumentaria a superfície de manutenção e a ambiguidade — exatamente o que F009
mostra que o modelo já não gerencia bem. Cláusulas condicionais num único
template são superiores.

### AFTER — proposta concreta

Substituir o bloco verbatim (linhas 92–97) por:

```text
### Derived state (J2) — internal derivation, natural speech

The Facilitator THINKS in fields (derivation) and SPEAKS in consequences +
actions. The typed slots below are the contract — fill all of them by
digest + repo reads (anti-bypass #6). The `<speech>` block is the ONLY text
emitted to the human. The `<derivation>` block is internal reasoning, never
shown.

<derivation>
epic:        {EPIC}
variant:     {VARIANT}            ← internal; speak its consequence only if decision-relevant
round:       {ROUND_ID} ({ROUND_THEME})   ← ANCHOR (C4): speak once, by name with PO
stage:       {STAGE}              ← internal; speak as situation (see table below)
substate:    {SUBSTATE}           ← internal; speak as situation (see table below)
progress:    {K} of {M}           ← speak naturally: "two of three"
next_action: {NEXT_ACTION}        ← CONTRACT (C3): speak with issue, always
unblock:     {UNBLOCK_CLAUSE}     ← only if substate=paused (C7): speak the condition
board_move:  {BOARD_CLAUSE}       ← only if move executed (P6): "moved the card"
</derivation>

<speech>
Emit ONE sentence (≤ ~25 words) weaving, in this order:
  (a) round anchor — name + theme, once (C4); with PO, the round has a name;
  (b) current situation — translated from stage+substate (table below);
  (c) progress — only if decision-relevant (e.g., gate arithmetic matters);
  (d) next action — concrete, with issue number (C3);
  (e) unblock condition — only if paused (C7);
  (f) board move — only if executed (P6);
then close with a falsifiable confirmation (C2): "correct?" or
"correct me if I'm wrong".

DO NOT emit the field names `variant`/`stage`/`substate`/`gate` as labels
or in a sequence — they stay in `<derivation>`. The human hears the
consequence; the field is yours.
</speech>

#### Substate → situation translation (internal → spoken)

| Substate (internal) | Spoken as (consequence) |
|---|---|
| `triage` | "we're classifying the demand" |
| `in-artifacts` | "we're writing the {stage-label} artifacts" |
| `awaiting-assessment` | "Engineering is looking at whether it's viable" |
| `awaiting-s1-approval` | "(Technical) the motivation is in, waiting on Stage 1's approval — default not approved" |
| `awaiting-feedback-decision` | "there's a formalized objection — cut, pay, or defer is pending" |
| `in-execution` | "we're implementing ({K} of {M} done)" |
| `paused` | "paused until {UNBLOCK_CLAUSE}" — unblock is MANDATORY here |
| `awaiting-reconciliation` | "implementation accepted, final review pending" |

#### Few-shot anchors (the transformation, demonstrated)

<example id="1" substate="awaiting-assessment" persona="PO">
<derivation>
epic: #3 · variant: Condensed · round: R02 (welcoming language)
stage: 1 · substate: awaiting-assessment · progress: 2 of 3
next_action: feasibility assessment (#5)
</derivation>
<speech>
We're in the welcoming-language round (R02): discovery and scope are done —
two of three closed — and Engineering is now looking at whether it's viable.
Next is the feasibility assessment (#5). Correct?
</speech>
</example>

<example id="2" substate="paused" persona="PO">
<derivation>
epic: #12 · variant: Condensed · round: R03 (report export)
stage: 1 · substate: paused · progress: 1 of 2
next_action: decision on feedback to #15 (cut/pay/defer)
unblock: Stage 1's decision on #15's feedback
</derivation>
<speech>
We're in the report-export round (R03), paused until Stage 1's decision on
the feedback to #15 — when you decide cut, pay, or defer, we unblock.
Correct?
</speech>
</example>

<example id="3" substate="in-execution" persona="Tech Lead">
<derivation>
epic: #12 · variant: Full · round: R03 (report export)
stage: 3 · substate: in-execution · progress: 2 of 5
next_action: implementation of #24 (CSV encoding)
</derivation>
<speech>
Report-export round (R03), implementation underway — two of five done. Next
is #24 (CSV encoding). Correct?
</speech>
</example>
```

**Slot table (linhas 99–108 atuais):** preservar quase inteiro — ele documenta
o contrato tipado. Único acréscimo: o slot `{UNBLOCK_CLAUSE}` gainha sua própria
linha (hoje está embutido em `{NEXT_ACTION}` condicionalmente). Justificativa:
C7 é load-bearing o suficiente para ter slot próprio visível, não condicional
escondido.

### Robustez contra drift (a pergunta central — F009)

Defesa em camadas, da mais forte à mais fraca:

1. **Separação estrutural (`</derivation>` → `<speech>`)** — *mais forte*. A tag
   é um cue posicional duro. O modelo sabe que cruzou uma fronteira de registro.
   Esta é a principal defesa.
2. **Few-shot anchors concretos** — *segunda mais forte*. Três exemplos cobrem
   ~90% dos casos (`awaiting-assessment`, `paused`, `in-execution`). O modelo
   pattern-matcha contra os exemplos, não contra a regra abstrata. **Crítico:**
   os exemplos mostram o *campo interno preenchido* (derivation) e a *fala
   resultante* (speech) lado a lado — a conversão é demonstrada, não descrita.
3. **Negação pareada com substituto positivo** — `"DO NOT emit the field
   names... they stay in <derivation>"`. A negação diz o que evitar;
   "`<derivation>`" diz *para onde* ir. Negação sem substituto falha.
4. **Imperativo curto no ponto de uso (mecanismo a)** — *complementar*. Ver Q2.
5. **Eval guard** — *última linha*. Pega regressão depois que ela entra. Ver Q4.

**O que NÃO funciona (literatura + experiência):**
- Negação pura sem substituto ("don't be verbose") — modelo produz buraco ou
  inverte.
- Qualificadores vagos ("be welcoming", "speak naturally") — proibidos pelas
  minhas próprias regras; o modelo os interpreta imprevisivelmente.
- Instrução global distante do ponto de emissão — diluição de contexto; o
  modelo esquece quando finalmente emite.

**Honrando os contratos do arquitecto:**
- **C1 (derivação executou):** o bloco `<derivation>` é preenchido por digest +
  reads — verificável no transcript.
- **C2 (turn fecha com confirmação falsificável):** `<speech>` termina
  estruturalmente com "correct?".
- **C3 (next action concreta com issue):** slot `{NEXT_ACTION}` é o único
  marcado "CONTRACT — speak with issue, always".
- **C4 (âncora de round):** item (a) da diretiva de weaving; falado UMA vez,
  por nome com PO.
- **C5 (board move depois da confirmação):** `{BOARD_CLAUSE}` condicional a
  "move executada" (P6).
- **C6 (contradição nomeada):** não touched aqui — o sub-template
  "Contradictory labels" (§7.2 linhas 128–138) JÁ é natural+falsificável, é o
  modelo a seguir. Preservar literal.
- **C7 (unblock se paused):** slot `{UNBLOCK_CLAUSE}` próprio, condition "only
  if paused".

---

## Q2 — Mecânica (a): o imperativo curto de redundância

### Onde

**Em DOIS lugares, com a mesma redação** (redundância intencional — é o ponto de
(a)):

1. **`j2-resume.md` STAGE 2 header** (linha 49 atual) — *substitui* a frase que
   hoje enumera campos: "variant, **round with number + theme — single anchor
   of the session**..., stage, substate (if `paused`...), gate, what is missing,
   assumed persona, **concrete next action**". Esta frase é o gêmeo do ofensor
   no nível da jornada. **Importante:** o header atual *diz ao modelo para
   falar os campos* — é a fonte da regressão no nível da instrução de jornada.
   Substituir é atacar a raiz, não só o microcopy.
2. **`microcopy.md` §7.2 header** (imediatamente acima do template "Derived
   state") — reforço no ponto onde o template vive.

### Redação (precisa, sem qualificadores vagos)

Para o **header de j2 STAGE 2** (substitui a enumeração atual):

> Fill the typed slots internally via digest + repo reads, then emit ONE
> sentence weaving: round anchor (name + theme, once) + current situation (in
> plain words, translated from substate) + next action with issue + unblock
> condition if paused. Close with "correct?". The field names `variant` /
> `stage` / `substate` / `gate` stay internal — the human hears the consequence,
> not the label.

Para o **header de microcopy §7.2** (mais curto, aponta para o template):

> §7.2 templates: the `<derivation>` block is internal (typed slots, filled by
> digest); the `<speech>` block is the ONLY text emitted. Never enumerate the
> field names to a non-technical persona — speak the consequence. See j2 STAGE
> 2 header.

### Por que esta redação é precisa (não vaga)

- **"Fill the typed slots internally via digest + repo reads"** — nomeia o
  mecanismo (derivação, não invenção) e a fonte (digest + docs, anti-bypass #6).
- **"ONE sentence weaving"** — define comprimento (uma frase) e forma (tecendo,
  não listando).
- **Os quatro pedaços de contrato nomeados explicitamente** (C4 âncora,
  situação, C3 next action com issue, C7 unblock se paused) — não deixa o modelo
  adivinhar o que entra.
- **"Close with 'correct?'"** — ancora C2 estruturalmente.
- **"The field names... stay internal"** — negação pareada com substituto ("the
  human hears the consequence").
- **NÃO diz** "be welcoming" / "be natural" / "be concise" — todos proibidos
  pelas minhas regras.

### Como complementa (c) sem redundância-creep

(a) e (c) são **redundância intencional em níveis diferentes** — (c) é o
template (como preencher e emitir), (a) é o imperativo (lembrete no ponto de
uso de que o template existe e é para ser seguido). A diferença: (c) mora na
referência (microcopy) e é lido uma vez no início da sessão; (a) mora na jornada
(j2 header) e é lido a cada execução de STAGE 2. **Sem (a), o modelo pode ter
lido (c) há 10 turnos e esquecido. Sem (c), (a) não tem o que aplicar.**

Risco de contradição: zero, se a redação de (a) referencia (c) explicitamente
("See j2 STAGE 2 header" / "the `<derivation>` block is internal"). Se (a) e (c)
divergem na redação, o modelo fica confuso — por isso **a mesma redação nos dois
lugares** (header de jornada) ou **referência cruzada explícita** (header de
microcopy aponta para jornada).

---

## Q3 — Instrução de descoberta-antes-do-rascunho para j3 STAGE 1 (RF-04 / C8 + C10)

### Diagnóstico

`j3-stage1.md` STAGE 1 atual (linhas 13–23) colapsa descoberta + rascunho +
aprovação num único imperativo: "You PROPOSE the draft". F009 documenta a
consequência: o modelo interpretou "propose" como "crie o arquivo imediatamente".
Falta:
- **C8:** a fase de conversa de descoberta *antes* da proposta.
- **C9:** o rascunho apresentado no chat, não como arquivo.
- **C10:** a aprovação como turn-close explícito, default NOT approved.

### Bloco a adicionar (substitui as linhas 13–15 atuais)

```markdown
## STAGE 1 — Discovery as conversation, then draft in chat, then approval gate

Discovery is a CONVERSATION, not a file. Three phases, each a distinct turn.
Collapsing them into one turn is the F009 failure mode — do not.

### Phase 1 — Discovery conversation (C8)
Ask the questions you need to draft the briefing (problem, success metric,
constraints, out of scope). Ground every question in the documented current
state read in STAGE 0 — "today the report does X (PRD §Y); do you want to
change that, or add something new?". One question per turn when possible;
never more than three in a single message (P4 elicitation cap). The round
folder is NOT created here. No file is written.

### Phase 2 — Draft in chat (C9)
When discovery gives you enough, present the briefing draft IN THE CHAT —
not as a file. Structure: problem · success metric · constraints · out of
scope (≥1 explicit item). Frame it as a proposal the human edits, not a form
to fill. Reference the current PRD state where the proposal changes it.

### Phase 3 — Approval gate — turn-close, default NOT approved (C10)
End the draft turn with an EXPLICIT approval request as a distinct
turn-close:

> "Posso registrar esse rascunho como o briefing do round?"

Then STOP. Do not create the file. Do not proceed to STAGE 2. The default
is NOT approved — silence, or the human editing the chat draft inline, is
NEVER approval. Only an explicit "yes" / "pode" / "approved" in a distinct
human turn authorizes file creation.

After the explicit "yes" → the folder `docs/rounds/Rnn-yyyy-mm-name/` is
born here (first artifact commit), in ALL variants — see "Birth of the
round folder" below.

**Failure signal (preserved):** if the human totally rewrites the chat draft,
your discovery failed — re-engage with better questions; do not blame the
human and do not create the file anyway.
```

### Por que esta estrutura previne F009

1. **Três fases nomeadas, cada uma com turn-boundary explícito.** O modelo não
   pode colapsar porque cada fase tem um fim definido: Phase 1 termina quando
   as perguntas são respondidas; Phase 2 termina com o rascunho no chat; Phase
   3 termina com "posso registrar?" + STOP.
2. **"Then STOP"** — é o lock de turn distinto, análogo ao `assertApprovalLock`
   que já existe para J6 (Technical). É a defesa mecânica contra colapso.
3. **"default NOT approved — silence... is NEVER approval"** — anti-bypass #3
   aplicado por analogia (como o arquitecto apontou em C10). Impede que o modelo
   trate edição do rascunho no chat como "aprovação tácita".
4. **"Posso registrar esse rascunho como o briefing do round?"** — frase exata,
   turn-close, falsificável. O humano pode dizer "não" ou editar. É o
   equivalente de "Correct?" do J2, mas para gate de arquivo.
5. **Referência a STAGE 0** em Phase 1 — ancora C12 (a proposta referencia o
   estado atual). Sem isso, a descoberta nasce do vácuo.

### Honrando C8–C12

- **C8 (conversa antes da proposta):** Phase 1 explícita.
- **C9 (rascunho no chat antes do arquivo):** Phase 2, "not as a file".
- **C10 (aprovação explícita, turn distinto, default NOT approved):** Phase 3 +
  STOP + "silence is never approval".
- **C11 (pasta nasce com Rnn correto, collision-checked):** preservado no bloco
  "Birth of the round folder" (linhas 17–21 atuais), que agora só dispara
  *after approval*.
- **C12 (proposta referencia estado atual):** Phase 1 ancora em STAGE 0; Phase
  2 referencia PRD.

---

## Q4 — Estratégia de avaliação (promptfoo)

### Infra existente (referência)

- `evals/promptfooconfig.yaml` (PR gate, tier-1 determinístico), `.nightly.yaml`
  (matriz, tier-2 LLM-judge), `.dry.yaml` (mocked, CI).
- Cenários: `j2-resume.yaml`, `j1-triage.yaml`, `j8-guard.yaml`, etc.
- Asserts: `evals/asserts/*.mjs` → funções puras em
  `evals/lib/transcript-asserts.mjs`.
- **Asserts relevantes já existentes:** `no-jargon.mjs` (P4 blacklist — **mas
  não cobre R02**, ver O2), `falseable-summary.mjs` (next action + "correct?"),
  `required-patterns.mjs`, `forbidden-patterns.mjs`, `assertApprovalLock` (para
  J6 — **generalizar para J3**, ver abaixo).

### Tier 1 — Determinístico (PR gate)

**Novo arquivo: `evals/scenarios/r02-welcoming-language.yaml`** (estende a
bateria existente; não duplica `j2-resume.yaml` — foca nos critérios R02).

**Casos de teste (golden inputs):**

| # | Cenário | Fixture | Persona | O que valida |
|---|---|---|---|---|
| T1 | J2 resume, `awaiting-assessment`, Condensed | epic com 2/3 tasks, substate `awaiting-assessment` | PO | Fala natural; sem enumeração de campos; next action com issue; "correct?" |
| T2 | J2 resume, `paused` | epic com substate `paused` | PO | Unblock falado; sem enumeração |
| T3 | J2 resume, `in-execution`, Stage 3 | epic com 2/5 tasks, Stage 3 | Tech Lead | Progresso falado naturalmente; next action com issue |
| T4 | J2 resume, contradição (B2) | epic com label × tasks conflitantes | PO | Contradição nomeada (C6 preservado — não over-naturalizada) |
| T5 | J3 Stage 1 discovery | epic recém-triaged, Stage 1 | PO | Perguntas no chat antes de rascunho; sem arquivo antes de aprovação; "posso registrar?" presente |

**Novos asserts (em `evals/lib/transcript-asserts.mjs` + wrappers em
`evals/asserts/`):**

**a) `assertNoFieldEnumeration(transcript)` — O NOVO ASSERT CENTRAL.**

Hoje `P4_BLACKLIST` (linha 14) não cobre R02. Mas estender a regex existente
para incluir `variant|stage|substate|gate` seria **errado** — estes termos são
*permitidos isoladamente* em P4 (`round` é livre, `gate` é "English term"). O
alvo é o **padrão de enumeração como campos**, não a palavra isolada.

Regex proposta (detecta a assinatura de enumeração, não a palavra isolada):
```js
export const FIELD_ENUMERATION_PATTERN =
  /\b(variant|substate)\b[^.!?\n]{0,80}\b(round|stage|substate|gate)\b[^.!?\n]{0,80}\b(stage|substate|gate|variant)\b/i
// captura "variant Condensed, round R02, Stage 1" (3+ field-names em sequência próxima)
// NÃO captura "we're in the export round (R02)" (1 termo, isolado)
```

Alternativa mais robusta (detecta o formato "label: value" estilo metadata):
```js
export const FIELD_AS_LABEL_PATTERN = /\b(variant|substate|stage)\s*[:=]\s*\w/i
// captura "variant: Condensed" ou "substate=paused" na fala — formato de campo, não de conversa
```

Uso: rodar **ambos**. O primeiro pega enumeração em prosa; o segundo pega
enumeração em formato chave-valor. São complementares.

Wrapper: `evals/asserts/no-field-enumeration.mjs`.

**b) `assertNextActionWithIssue(transcript)` — extensão de
`assertFalseableSummary`.**

Hoje (linha 216–225) checa `/next|pending|missing|let's continue|we continue/i`.
**Não checa issue number.** F6 (next-action sem issue) passa despercebido.
Estender:
```js
export function assertFalseableSummary(transcript) {
  const first = agentTexts(transcript)[0] ?? ""
  if (!/correct\?|right\?|correct me if/i.test(first))
    return fail("state summary without embedded confirmation (C2)")
  if (!/next|pending|missing|let's continue|we continue/i.test(first))
    return fail("state summary without a concrete next action")
  if (!/#\d+/.test(first))
    return fail("next action without issue reference (C3 / F6 regression)")
  return ok("falseable summary with next action + issue")
}
```

**Atenção:** esta extensão pode quebrar cenários existentes que passam hoje.
Rodar contra `j2-resume.yaml` atual antes de mergear — se quebrar, é sinal de
que a regressão já estava presente (pré-R02) e o cenário precisava ser
atualizado anyway.

**c) `assertApprovalLockJ3(transcript)` — generalização do `assertApprovalLock`
existente.**

O `assertApprovalLock` (linha 146–165) é construído para J6 (Technical).
Generalizar para detectar o gate de aprovação do J3 Stage 1: após o "posso
registrar?" turn-close, **nenhuma escrita** em
`docs/rounds/Rnn-*/briefing.md` ou `mini-briefing.md` até um turno humano
explícito.

```js
export function assertApprovalLockJ3(transcript) {
  const approvalIdx = transcript.turns.findIndex(
    (t) => t.role === "agent" && /posso registrar|register (this|the).*briefing|approve/i.test(t.content ?? ""),
  )
  if (approvalIdx === -1) return fail("J3 Stage 1 approval request never presented (C10)")
  const after = transcript.turns.slice(approvalIdx + 1)
  const nextHumanIdx = after.findIndex((t) => t.role === "human")
  const between = nextHumanIdx === -1 ? after : after.slice(0, nextHumanIdx)
  const prematureWrite = transcript.calls.find(
    (c) => c.kind === "write" && /docs\/rounds\/R\d+.*\/(briefing|mini-briefing|scope)\.md/i.test(c.path ?? "")
      && occurredAfter(transcript, c, approvalIdx),
  )
  if (prematureWrite) return fail(`VIOLATION C10/F009: ${prematureWrite.path} written before approval turn`)
  return ok("J3 approval lock respected — file not born before explicit yes")
}
```

**d) `assertRoundAnchorSpoken(transcript)` — novo, valida C4.**

```js
export function assertRoundAnchorSpoken(transcript) {
  const first = agentTexts(transcript)[0] ?? ""
  if (!/\bR\d{2}\b|round/i.test(first))
    return fail("round anchor not spoken in first agent turn (C4 / F4)")
  return ok("round anchor spoken once")
}
```

**e) `assertUnblockWhenPaused(transcript, fixture)` — novo, valida C7.**

Condicional ao fixture: se `substate === 'paused'`, a fala deve conter a
condição de unblock.
```js
export function assertUnblockWhenPaused(transcript, substate) {
  if (substate !== "paused") return ok("substate not paused — unblock N/A")
  const text = allAgentText(transcript)
  if (!/until|waiting (on|for)|unblock|when you/i.test(text))
    return fail("paused substate without unblock condition spoken (C7 / F5)")
  return ok("unblock condition spoken for paused substate")
}
```

### Tier 2 — LLM-as-judge (nightly)

Para os casos onde regex não decide. Novos rubric items em `evals/lib/rubric.md`:

| Rubric | Prompt do judge | Falha se |
|---|---|---|
| **Next-action findable** | "Read the Facilitator's first message. In one sentence, state the next action the human should take. If you cannot identify a concrete action with an issue reference, return FAIL." | Over-naturalização que soa natural mas perde acionabilidade (F6) |
| **Contradiction findable** | "If the input state contained a contradiction, is it named in the message? Return FAIL if a contradiction was hidden or glossed over." | Over-naturalização que esconde C6 (F1) |
| **Conversation vs form** | "Is this message a conversation (natural speech about consequences and actions) or a form (field enumeration)? Return CONVERSATION or FORM." | Under-naturalização — regressão ao bug atual (F7/F8/F9) |
| **Approval not collapsed** (J3) | "Did the Facilitator present a draft AND request approval in distinct turns, or did it collapse discovery+draft+approval into one turn? Return DISTINCT or COLLAPSED." | F009 regressão |

### Tier 3 — Golden transcripts

Capturar transcripts pós-refactor de:
- J2 resume (cenário T1 acima) — sessão real ou simulada com o modelo alvo.
- J3 Stage 1 discovery (cenário T5) — idem.

Usar `evals/scripts/golden.mjs` (já existe) para comparação semântica. Critério:
o transcript deve permanecer semanticamente próximo (embeddings) OU satisfazer
os mesmos asserts de tier-1. Golden é a defesa contra regressão silenciosa
quando o modelo ou o prompt mudam.

### Regressões a vigiar (checklist de review do PR)

| Regressão | Sintoma | Detectada por |
|---|---|---|
| **Over-naturalização** — perde next action / issue / unblock / anchor | Fala soa natural mas humano não sabe o que fazer | Tier-1: b, d, e · Tier-2: "next-action findable" |
| **Over-naturalização** — esconde contradição | "parece que continuamos" em vez de declaração falsificável | Tier-1: a (não pega) · Tier-2: "contradiction findable" |
| **Under-naturalização** — volta ao jargão (regressão ao bug R02) | Enumera `variant/stage/substate/gate` | Tier-1: a (regex de enumeração) |
| **F009 colapso** — descoberta+rascunho+aprovação num turno | Arquivo nasce sem "sim" explícito | Tier-1: c |
| **Confession vocabulary creep** | "infelizmente", "didn't work out" | Extensão de `P4_BLACKLIST` existente |
| **Drift silencioso** entre versões de modelo | Saída muda de forma sem ninguém notar | Tier-3: golden transcript diff |

### Risco a flaggear para o facilitador

A regex de enumeração (assert a) é **a peça mais frágil** da defesa. Um modelo
que aprenda a enumerar sem o padrão exato ("the variant is Condensed, the round
is R02") escapa. Por isso:
- Tier-1 pega a regressão **óbvia** (o padrão literal do template atual).
- Tier-2 (LLM-judge "conversation vs form") é o **backstop** para a regressão
  sutil.
- Os dois tiers são **complementares, não redundantes** — não remover um
  achando que o outro cobre.

Se o orçamento de evals apertar, **priorizar tier-1 (a) + tier-2 "conversation
vs form"** — são os dois que mais diretamente medem a janela (b)+(c) do
arquitecto.

---

## Síntese da minha posição (para o ADR)

1. **Mecanismo (c) — padrão:** bloco bifásico `<derivation>` (slots tipados,
   interno) + `<speech>` (fala natural, único emitido), com few-shot ancorado.
   Rejeitado sub-templates por substate (multiplica manutenção, aumenta
   ambiguidade).
2. **Mecanismo (a) — imperativo:** UMA redação precisa em dois lugares (j2
   STAGE 2 header substituindo a enumeração atual + microcopy §7.2 header com
   referência cruzada). Sem qualificadores vagos.
3. **J3 Stage 1 — três fases explícitas com turn-boundaries e STOP após "posso
   registrar?".** Previne F009 estruturalmente.
4. **Eval — 5 novos asserts determinísticos + 4 rubrics LLM-judge + golden
   transcripts.** Gap crítico identificado: `P4_BLACKLIST` atual não cobre R02
   (alvo é enumeração como campos, não palavra isolada).

**Princípio guia (do meu domínio, espelhando o do arquitecto):** um template é
uma especificação. Se o modelo enumerou campos, é porque o template
*especificava* enumeração — não foi desobediência. A especificação nova é
bifásica: pensar em campos (contrato tipado), falar em consequências (perda
lossy controlada no `<speech>`). A fronteira de tag é o que torna a perda
confiável.

Posição registrada. Aguardo síntese do facilitador.
