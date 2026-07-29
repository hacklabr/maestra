# Panel r02-linguagem-acolhedora — Turn 1 — Workflow Architect

> Painel ad-hoc (J9) do R02. Especialista: `product-workflow-architect`.
> Sessão: abertura (primeira posição). Agenda: como refatorar os templates de
> fala do Maestra para que o facilitador produza linguagem natural e acolhedora
> preservando o rigor contratual de derivação de estado, gates e handoffs.

---

[product-workflow-architect]

Lidos os sete arquivos. Vou registrar minha posição como especialista de
abertura, estruturada para que o Prompt Engineer, no próximo turno, possa
converter meus limites de contrato em mecânica de template.

Antes de responder às quatro perguntas, preciso estabelecer o insight central
que reorganiza toda a discussão — porque sem ele, o refactor parece uma troca
entre rigor e acolhimento, quando na verdade é uma correção de um bug que
prejudica ambos.

---

## Insight central: jargão ≠ contrato

A premissa implícita no material atual (e que torna o refactor difícil) é que
**enumerar os campos do fluxo É o contrato** — ou seja, que falar "variante
Condensed, round R02, Stage 1, substate awaiting-assessment, gate pendente" é
o que preserva o rigor.

Isso é falso, e é exatamente o que o dogfooding R02 detectou. Enumerar campos
é **teatro de precisão**, não precisão. O contrato vivo do fluxo não é "o
humano ouviu os nomes dos campos". O contrato é:

1. **A derivação aconteceu de verdade** (digest + leitura de docs, anti-bypass
   #6) — isto é interno, verificável pela coerência do que é dito, não pela
   nomeação de campos.
2. **O humano consegue falsificar a derivação** (declaração falsificável +
   "Correct?") — isto requer que o humano ENTENDA o que foi dito.
3. **O humano sabe o que fazer a seguir** (next action concreta com issue).
4. **As contradições são nomeadas, nunca escondidas** (B2, B3).

O modo jargão falha o contrato no ponto 2: quando o PO ouve "substate
awaiting-assessment", ele não tem base nenhuma para dizer "incorreto" — ele
não sabe quais eram as alternativas, nem o que o termo significa. O "Correct?"
vira carimbo de borracha. **O jargão não preserva o contrato; ele apenas parece
preservá-lo enquanto destrói a falsificabilidade que é o coração do contrato.**

Isso significa que a naturalização, feita dentro dos limites que vou definir
abaixo, **fortalece** o workflow — não é um trade-off contra ele. O refactor
não está escolhendo entre rigor e acolhimento; está corrigindo um ponto onde o
rigor aparente minava o rigor real.

Com isso estabelecido, respondo.

---

## Q1 — O contrato load-bearing em cada momento

### A. State derivation on resume (J2 STAGE 2)

**Arquivos:** `j2-resume.md` linhas 47-53 (STAGE 2) + `microcopy.md` §7.2
"Derived state (J2)" linhas 88-110.

O contrato load-bearing — o que DEVE ser verdadeiro/honrado para o workflow
funcionar, independentemente de como é falado:

| # | Peça do contrato | Por que é load-bearing | Anti-bypass / fonte |
|---|---|---|---|
| C1 | **A derivação executou de verdade** (digest + repo reads + state tuple computado) | Toda a premissa de J2 ("zero perguntas sobre estado presente na plataforma") colapsa se o modelo inventar em vez de derivar | #6 (derivation always verified) |
| C2 | **A turn fecha com confirmação falsificável** ("Correct?" ou equivalente) | Sem isto, derivação = verdade assumida, não verdade verificada. É o mecanismo que torna B2 (contradição) operacional | j2 STAGE 2 success criterion |
| C3 | **A next action é concreta, com issue** | O humano precisa poder agir E poder corrigir ("não, a próxima é #17, não #16") | j2 STAGE 1 passo 3 (Next action ← first ordered open daughter) |
| C4 | **A identidade do round é âncora** (número + tema, falados UMA vez) | Tudo depois é "neste round". Sem âncora, referências posteriores são ambíguas. Com PO, o round tem NOME, não número | §7.2 slot {ROUND_ID} + P4 "Round framing" |
| C5 | **O board move DEPOIS da confirmação** (P6) | Mover antes polui o board com estado falso | P6, j2 STAGE 3 |
| C6 | **Contradições nomeadas como declaração falsificável** | Esconder contradição destrói a confiança; nomear é dado de processo | B2, B3, #6 |
| C7 | **Se `paused`: o unblock é sempre falado** | Sem o unblock, o humano não sabe o que está esperando nem o que fazer | P1.1, j2 substate table |

O que NÃO é load-bearing (é rotulagem interna, não contrato):
- A palavra "variante", "stage", "substate", "gate" aparecerem na fala. São
  nomes internos de campos derivados. O humano precisa ouvir a CONSEQUÊNCIA
  ("Engineering está avaliando se é viável"), não o nome do campo
  (`awaiting-assessment`).
- A ordem ou enumeração dos campos na fala.
- A contagem K de M — **parcialmente** load-bearing: é evidência que permite ao
  humano detectar digest stale (C2 depende dela em parte), mas pode ser falada
  naturalmente ("duas de três tarefas fechadas") sem perder o valor.

### B. Stage 1 discovery (J3 STAGE 1) — rascunho + gate de aprovação

**Arquivos:** `j3-stage1.md` linhas 13-23 (STAGE 1) + RF-04 no scope.

| # | Peça do contrato | Por que é load-bearing |
|---|---|---|
| C8 | **A conversa de descoberta acontece ANTES da proposta** (RF-04) | Hoje o j3 pula direto para "You PROPOSE the draft". RF-04 exige perguntas/troca no chat primeiro. Sem isto, a proposta nasce do nada e o "total rewrite by human = proposal failed" (sinal de processo) nunca dispara |
| C9 | **O rascunho é apresentado no CHAT antes do arquivo nascer** | O arquivo de briefing/scope é RECORD — selado no fechamento. Nascer antes da aprovação = o Facilitador decidiu, não o humano. Viola master rule 3 ("the decision is the human's; the record is yours") |
| C10 | **Aprovação é ato explícito em turn distinto** (default NOT approved) | Anti-bypass #3 aplicado por analogia. Silêncio/síntese do Facilitador nunca = aprovação. O arquivo só nasce após o "sim" explícito |
| C11 | **A pasta do round nasce com Rnn = count + 1, collision-checked** | Mecânico, load-bearing para traceabilidade e para a derivação de sessões futuras |
| C12 | **A proposta referencia o estado atual** (STAGE 0: ler docs/reference/ primeiro) | "Every proposal references the documented current state" — sem isto, a proposta é do vácuo, e o gate downstream não tem com que comparar |

O que NÃO é load-bearing:
- Se o Facilitador diz "estou entrando no Stage 1" ou simplesmente começa a
  fazer perguntas de descoberta naturalmente.
- Se usa "briefing" / "scope" ou "vamos escrever o que estamos atacando".

### C. Gate transitions across stages

**Arquivos:** `j3-stage1.md` STAGE 3-4 (linhas 35-47) + `microcopy.md` §7.1
(linhas 32-85) + P1.1/P6.

| # | Peça do contrato | Por que é load-bearing |
|---|---|---|
| C13 | **A aritmética do gate verificada via digest** (k de m fechadas E artifact existe no repo) | "closed artifact task whose declared artifact does NOT exist does not count for the gate". Sem isto, gate falso abre próxima onda | #15 (executed evidence), j2 STAGE 1 passo 2 |
| C14 | **A onda é criada DEPOIS da verificação do gate** (register-then-act para overrides) | P3 atomicidade; criar antes = estado inconsistente |
| C15 | **A transição de metadata acontece no ato** (Current stage, Substate) | Load-bearing para a derivação da próxima sessão (J2 lê esta metadata) |
| C16 | **A distribuição é confirmada antes de criar issues** (P7) | "No issue created before confirmation" — zero tarefa com assignee não-confirmado |
| C17 | **Gate bloqueado diz o que falta, por que importa, o que fazer** | "no with a path, never 'still missing stuff'" — microcopy §7.1 blocked gate |

O que NÃO é load-bearing:
- A palavra "gate". O humano pode ouvir "as três coisas do Stage 1 estão no
  repositório — criei as tarefas de Engineering" em vez de "o gate do Stage 1
  está cumprido".
- A aritmética falada como "3 de 3" a menos que seja relevante (gate bloqueado
  precisa da contagem exata — aí sim é load-bearing na fala).

### D. Handoffs entre stages (baton pass)

**Arquivos:** `microcopy.md` §7.10 (linhas 373-434).

| # | Peça do contrato | Por que é load-bearing |
|---|---|---|
| C18 | **O handoff nomeia ONDE as decisões vivem** (living PRD + round record) | O receptor precisa saber onde procurar |
| C19 | **O handoff nomeia QUEM fala agora e sobre o quê** | "every handoff closes with who talks to me now and about what" — persona/tone change perceptível |
| C20 | **A reconciliação é anunciada desde o handoff** (nunca surpresa no fim) | "Reconciliation is never a surprise at the end" — §7.10 S2→3 |
| C21 | **No co-triage Technical, o switch de persona é explícito** (§7.7) | "if the Tech Lead isn't you, this is the time to bring them in" — sem isto, PO recebe perguntas técnicas (falha de acessibilidade) ou Tech Lead recebe perguntas traduzidas (condescendência) |

O que NÃO é load-bearing:
- As palavras "handoff" / "baton pass".
- "Stage 2" vs. "a parte de Engineering".

---

## Q2 — O que pode ser naturalizado vs. o que DEVE ser surfado

### Pode ser naturalizado (falado como frase sobre consequência/ação)

| Campo interno | Surface form naturalizada | Por que é seguro |
|---|---|---|
| `variant` | Omitir se não for decisão-relevante; senão "estamos fazendo o tratamento completo" / "é uma rápida" | O humano não age sobre o nome da variante; age sobre as consequências (quantos artefatos, qual profundidade) |
| `stage` | "estamos na descoberta" / "Engineering está projetando" / "implementação" | A consequência é o que importa; o número do stage é interno |
| `substate` (geral) | Traduzir para a situação visível: `awaiting-assessment` → "Engineering está olhando se é viável"; `in-execution` → "estamos implementando (2 de 5 prontas)" | O humano entende a situação pela consequência, não pelo rótulo |
| `gate` (met) | "as peças do Stage 1 estão todas no repositório" | O conceito (artefatos presentes + verificados) é honrado sem o jargão |
| `persona` (assumida) | Mostrada via TOM e vocabulário (P4), não nomeada ("assumed persona: PM/PO") | Exceto co-triage Technical (C21), onde o switch deve ser explícito |

### DEVE ser surfado explicitamente (load-bearing na fala)

| Peça | Por que deve aparecer na fala | Forma (ainda natural, mas explícita) |
|---|---|---|
| **Identidade do round** (C4) | Âncora da sessão; tudo refere-se a ela depois | "Esse é o round da exportação (R02)" — uma vez; depois "nesse round". Com PO: nome, não número |
| **Next action + issue** (C3) | O humano precisa agir E verificar | "A próxima é: o registro de decisão de cache está faltando (#16)" |
| **Unblock quando paused** (C7) | Sem isto, humano não sabe o que esperar | "Estamos pausados até a decisão do Stage 1 sobre o feedback da #15" |
| **Contradição** (C6) | Falsificabilidade; nunca escondida | "O label diz Condensed, mas há 2 tarefas do Stage 3 fechadas — pela estrutura, é Stage 3. Corrijo se eu estiver errado" |
| **Confirmação turn-close** (C2) | O gate que torna a derivação verificada | Termina a turn esperando: "está certo?" / "corrija se eu estiver errado" |
| **Contagem de progresso** (parcial, C2) | Evidência para detectar digest stale | "2 de 3 tarefas fechadas" — falado naturalmente, não como campo |
| **Gate bloqueado: o que falta** (C17) | "No com caminho" | "Ainda não dá pra abrir Engineering: faltam os critérios de aceitação (#14) — esses dois não podem ser cortados em nenhuma variante" |
| **Pedido de aprovação explícito no Stage 1** (C10) | Arquivo não nasce antes do sim | Turn distinto: "posso registrar esse rascunho como o briefing do round?" — espera |
| **Risk warning em override** (C14, scaled defense) | Consentimento informado | §7.1/§7.4 já têm o texto; é load-bearing e DEVE ser falado |
| **Reconciliação anunciada** (C20) | Nunca surpresa | "mais a tarefa de revisão final (#27)" no handoff |

### Observação crítica sobre os templates existentes

Os templates de §7.1 (gate moments) e §7.2 "Contradictory labels" / "Issue
without labels" / "Artifact not found" **já falam em consequências** — são o
padrão-alvo. O ofensor é especificamente §7.2 "Derived state (J2)" (linhas
92-97), que enumera `variant {VARIANT}, round {ROUND_ID} ({ROUND_THEME}), Stage
{STAGE} in progress ({K} of {M} tasks closed)` como lista de campos literais.
O refactor deve usar §7.1 e os sub-templates de erro de §7.2 como **modelo**, e
reescrever "Derived state" seguindo esse modelo.

---

## Q3 — A linha: o princípio

**Princípio da Preservação de Contrato:**

> Um campo derivado é **apresentação** (pode ser naturalizado na fala) se e
> somente se TODAS as três condições holds:
> 1. Seu significado é **totalmente reconstruável** a partir da consequência
>    falada ao humano (o humano não perde informação);
> 2. O próximo passo do workflow **não depende** do humano reconhecer o valor
>    literal do campo (nenhum gate downstream checa "o humano viu a palavra
>    'substate: paused'?");
> 3. Remover o nome do campo **não remove** a capacidade do humano de
>    falsificar/corrigir a derivação (a confirmação ainda funciona).
>
> Um campo é **contrato** (deve permanecer um slot tipado, possivelmente
> surfado) se QUALQUER uma destas holds:
> 1. É a **âncora** que referências subsequentes dependem (identidade do round);
> 2. É a **ação** que o humano deve tomar (next action com issue);
> 3. É a **evidência** que permite ao humano falsificar a derivação (contagem,
>    contradição);
> 4. É um **ponto de decisão** que o humano possui (aprovação, override, risk
>    warning);
> 5. É **mecanicamente consumido** por um passo downstream (metadata line,
>    label, register comment — estes são escritos, não falados, mas a fala não
>    pode deturpá-los).

**A linha divisória não é "vocabulário interno vs. externo". É "a correção do
workflow depende do humano ver este valor?".** Se sim → contrato. Se o valor é
apenas um rótulo interno para uma situação que o humano já apreende pela
consequência → apresentação.

Equivalentemente: **o Facilitador fala em CONSEQUÊNCIAS e AÇÕES; pensa em
CAMPOS.** Os campos são sempre derivados (#6). A fala converte campos →
consequências + ações. A conversão é **lossless** com respeito ao que o humano
precisa para decidir/verificar; é **lossy** apenas com respeito à nomeação
interna — e essa perda é o objetivo, não um defeito.

---

## Q4 — Failure modes

### Over-naturalização (esconde um campo que o workflow precisa)

| # | Failure mode | Severidade | O que quebra no workflow | Onde |
|---|---|---|---|---|
| F1 | **Contradição escondida** — template naturaliza "parece que continuamos" em vez da declaração falsificável | **Crítica** | O humano não consegue pegar derivação errada. Downstream: persona errada, gate errado, tarefas erradas criadas. É exatamente o que #6 e B2 existem para prevenir | j2 B2/B3, #6 |
| F2 | **Gate de aprovação perdido no Stage 1** — proposta naturalizada em "deixa eu anotar isso" sem turn-close de aprovação | **Crítica** | Arquivo nasce sem aprovação. RF-04 violado. Briefing vira rascunho do Facilitador, não decisão do humano. Sinal "total rewrite = proposal failed" perdido | j3 STAGE 1, RF-04 |
| F3 | **Risk warning em override naturalizado** — scaled defense perdida | **Crítica** | Humano pula gate/reconciliação sem consentimento informado. #13 (reconciliation) existe porque isto é o skip mais perigoso | §7.4, #13 |
| F4 | **Âncora de round perdida** — round identity não falada | **Alta** | "Neste round" depois não tem referente. Humano perde orientação entre sessões. Erros de reconciliation (escopo/deviations errados aplicados) | §7.2 {ROUND_ID}, P4 framing |
| F5 | **Unblock perdido quando paused** — "estamos em pausa" sem a condição | **Alta** | Humano não sabe o que espera nem o que decidir. Round estagnado | P1.1, j2 substate table |
| F6 | **Next-action sem issue** — ação falada sem referência concreta | **Alta** | Humano não consegue agir nem verificar se a derivação apontou a tarefa certa | j2 STAGE 1 passo 3 |

### Under-naturalização (mantém o jargão — o bug atual, R02)

| # | Failure mode | Severidade | O que quebra no workflow | Onde |
|---|---|---|---|---|
| F7 | **Falha de acessibilidade** — PO ouve "variante, round, stage, substate, gate" | **Alta** (problema R02 documentado) | Humano se afasta. O flow perde seu parceiro humano. Métrica de sucesso do mini-briefing falha | RF-03/05, RNF-01 |
| F8 | **Teatro de precisão / falsificabilidade perdida** — enumeração dá ilusão de rigor mas o humano não consegue verificar nada | **Alta** (insight central) | "Substate: awaiting-assessment" — o PO não sabe quais eram as alternativas. "Correct?" vira carimbo. **O contrato é enfraquecido, não preservado.** O jargão e o contrato NÃO são a mesma coisa | j2 STAGE 2, #6 |
| F9 | **Formulário, não conversa** — enumeração de campos É um formulário | **Média** | Kernel: "conversational journey ≠ form". O humano trata o Facilitador como reporter de status, não como guia. Valor de J2 ("guide the human THROUGH the flow") perdido | kernel Role |
| F10 | **Confession vocabulary creep** — modo enumeração tende a adicionar meta-comentário proibido ("infelizmente o gate está bloqueado") | **Média-Baixa** | §7.3/§7.11 proíbem. O shift para naturalização também afasta deste failure | §7.3, §7.11 global rules |

**O failure mode mais profundo:** F8 não é apenas acessibilidade — é **falha de
contrato também**. O modo jargão e o modo contrato NÃO são a mesma coisa. A
enumeração de campos parece preservar o contrato enquanto destrói o mecanismo
(falsificabilidade) que o torna operacional. Este é o argumento central para o
refactor: **naturalização dentro dos limites de contrato que defini FORTALECE o
workflow**, porque torna a confirmação significativa.

---

## Orientação concreta para o Prompt Engineer (próximo turno)

Baseado nos limites acima, o que o mecanismo (c) + (a) deve fazer, e o que NÃO
deve fazer:

### Deve fazer

1. **Reescrever §7.2 "Derived state (J2)"** (linhas 92-97) — o pior ofensor.
   Substituir a enumeração `variant {VARIANT}, round {ROUND_ID}, Stage {STAGE}...`
   por uma moldura de linguagem natural que TECE os pedaços de contrato (C4
   âncora de round, C3 next action, C7 unblock-se-paused, C2 confirmação) numa
   frase. Manter os slots tipados (o Facilitador ainda deriva tudo), mas mudar
   a **surface form** — o template mostra COMO converter campo → fala. Usar
   §7.1 (gate met) e §7.2 sub-templates de erro como padrão de referência.

2. **Manter os slots tipados internamente.** O contrato é o slot preenchido por
   derivação verificada. A naturalização é na surface form do template, não na
   eliminação do slot. O Facilitador deriva `substate = awaiting-assessment`; o
   template converte para "Engineering está avaliando se é viável".

3. **Adicionar explícito ao j3-stage1.md STAGE 1** o passo de
   descoberta-conversa-antes-da-proposta (RF-04 / C8) e tornar o gate de
   aprovação um turn-close explícito (C10). Hoje o texto pula para "You PROPOSE"
   e a aprovação é implícita.

4. **Imperativo curto (mecanismo a) no ponto de uso** — uma linha no header de
   j2 STAGE 2 e no header de microcopy §7.2: "Fale a consequência e a próxima
   ação; os nomes dos campos ficam internos a menos que o humano pergunte ou a
   decisão exija." Complementa o template, não substitui.

5. **Preservar literalmente** os templates que JÁ falam em consequências: §7.1
   (todos), §7.2 "Contradictory labels", "Issue without labels", "Artifact not
   found", "Documentation contradiction", §7.3 (J8 refusal — já é conversa),
   §7.7 (persona switch — load-bearing explícito), §7.10 (handoffs — já nomeiam
   consequência), §7.11 (deviation — já é ensino conversacional). Estes são o
   padrão-alvo, não precisam de refactor.

### NÃO deve fazer

1. **Não eliminar slots tipados.** O contrato depende da derivação verificada
   preenchendo campos. Eliminar o slot = eliminar a derivação = violar #6.
2. **Não naturalizar a declaração falsificável** (C6/F1). A contradição nomeada
   é load-bearing. O template de "Contradictory labels" (§7.2 linhas 128-138) é
   o modelo — já é natural E falsificável.
3. **Não naturalizar o pedido de aprovação** (C10/F2). O "posso registrar?" deve
   ser turn distinto, explícito. Não pode virar implicitude.
4. **Não naturalizar risk warnings** (C14/F3). Scaled defense é conteúdo
   contratualmente requerido.
5. **Não tocar nos campos que são mecanicamente consumidos** (metadata line,
   labels, register comments). Estes são escritos no formato P1, não falados. A
   fala não deve deturpá-los, mas eles não são alvo de naturalização de fala —
   já são máquina.

### O teste de aceitação do refactor (do meu lado de contrato)

Depois do refactor, para cada template de fala destinado a persona não-técnica,
o seguinte deve holds:
- (a) Os sete pedaços de contrato C1-C7 (resume) / C8-C12 (Stage 1) / C13-C17
  (gates) / C18-C21 (handoffs) permanecem deriváveis e honrados.
- (b) Uma terceira pessoa lendo a fala não encontra
  "variante/round/stage/substate/gate" enumerados como campos (critério 1 do
  scope).
- (c) Uma terceira pessoa AINDA consegue dizer, lendo a fala, qual é a next
  action e qual é a contradição (se houver) — ou seja, a falsificabilidade foi
  preservada, não perdida.

Se (b) passa mas (c) falha, o refactor over-naturalizou e quebrou o contrato.
Se (c) passa mas (b) falha, under-naturalizou e manteve o bug. Os dois critérios
juntos definem a janela correta.

---

Posição registrada. Aguardo o Prompt Engineer para converter estes limites na
mecânica de template. Se houver dúvida sobre se um pedaço específico é contrato
ou apresentação em um caso de borda que não cobri acima, posso precisar — mas
cubri os momentos load-bearing do escopo R02 (J2 STAGE 2, J3 STAGE 1, microcopy
§7.2, e o princípio geral).
