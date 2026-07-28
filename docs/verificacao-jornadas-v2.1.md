# JOURNEY VERIFICATION: Plugin Facilitador de Fluxo — implementação × spec de jornadas
**Data**: 2026-07-28
**Auditor**: Journey Guardian (Guardianship Mode — auditoria comprometida no consenso)
**Journey Spec**: `docs/referencia/jornadas.md` v2.1 (fonte autoritativa)
**Implementação auditada**: `fluxo-facilitador/src/instructions/` (kernel + 10 módulos de jornada + referencia/* + templates/*), `src/tools/` (4 tools), `src/hooks/`, `src/cli/report*`, `evals/`
**Método**: leitura integral dos 2.005 lines de instructions, dos contratos das 4 tools, do hook de desvios, do fluxo-report e da bateria anti-bypass; verificação palco a palco contra a spec.

---

## Verification Summary
**Fidelidade geral**: **~93%** — as 10 jornadas têm 100% das etapas nomeadas presentes nos módulos; 6 de 7 protocolos transversais totalmente implementados; 16/16 gatilhos anti-bypass no kernel + 16/16 cenários de eval; 11/11 âncoras de microcopy presentes e referenciadas corretamente; 6/6 eventos de instrumentação com schema verbatim + leitor (fluxo-report com FM-13).
**Gaps críticos**: 0
**Gaps de severidade alta**: 1
**Gaps de severidade média**: 3
**Gaps de severidade baixa**: 3
**Veredito**: **PASS WITH RESERVATIONS**

> Nenhum ponto de endurecimento anti-bypass foi silenciosamente abandonado: a trava de aprovação da J6, a regra do não-rascunho da J8, os vereditos com evidência executada da reconciliação e o register-then-act de overrides estão todos preservados — nos módulos, na tool e na bateria de evals. As reservas são: um protocolo (P2) com o lado da escrita ausente, um item de implementação atribuído e não entregue (worktree teardown), um drift de escopo (plataforma-neutro) a decidir, e parte do escopo vinculante do harness ausente.

---

## Verificação jornada a jornada

### J1 — Triagem e Nascimento do Épico: ✅ Compliant
Etapas 0–5 todas presentes (`j1-triagem.md`): pre-flight com `fluxo_status` (linha 11); entendimento com evento B e ambiguidade nas palavras do humano (17–18); classificação com hierarquia derivar>confirmar>perguntar, tabela de wording validada incluindo as duas correções Guardian (módulos→confirmação/enumeração linha 33; contrato→pendência Etapa 2 linha 34), limites ≤3/≤5/≤3-Mínima + contagem durante a triagem (40); destinos do "não sei" completos (42–45); proposta com critério citado (47); disfarce (49); contestação com sequência evidência→persistência→registro→ação (53); mapeamento de equipe condicional com proposta (57); dedup G-10 (62); P7 com carga consultada (64); ordem de criação com `Subestado: triagem` (66); pasta da rodada não nasce na triagem (70); idempotência (74).
**Enforcement**: AB-01 (sycophancy com `hardFail: override-before-mutation`), AB-12 (disfarce), cenários j1-triagem.yaml, assert `no-jargon.mjs` para a persona Etapa 1.
**Delta positivo a absorver na spec**: evento A emitido também imediatamente ao ultrapassar 3 perguntas num turno (instrumentacao.md:18) — sinal mais cedo que o "fechamento da triagem" da spec.

### J2 — Retomada de Contexto por Issue: ✅ Compliant
Digest enumera→modelo deriva (`j2-retomada.md:11`); leituras em ordem incluindo pasta da rodada e referência (12); tupla completa com subestado (13–19); vocabulário fechado P1.1 verbatim (21–34); fatos-vencem-o-campo (36); branches B1–B6 **todas presentes**: B1 sem labels (40), B2 contraditório falseável (41), B3 contradição documental com routing G-12 para Mínima (42), B4 filha (43), B5 órfã (44), **B6 épico fechado sem reconciliação com reconciliação retroativa, sinal no retro.md e evento F (45)**; team.md após apresentar o estado (51); board somente após confirmação, narrado, com degradação (57); despacho por etapa/subestado (59–65).
**Enforcement**: digest computa aritmética de gate, existência de artefato (G-05) e campo `reconciliacao` (digest.ts:108–178); fluxo-report com perna FM-13 (report-core.ts:90–103); AB-06; cenários j2-retomada.yaml.

### J3 — Condução da Etapa 1: ✅ Compliant
Ordem zero de leitura de referência (`j3-etapa1.md:9–11`); pasta nasce no primeiro artefato com verificação de colisão Rnn (17–20); briefing como registro com enquadramento honesto-não-perfeito (21); critérios bloqueantes (29); RF contínuo com verificação de colisão no commit (31); escopo.md no DoR (35); teste "restaura ou altera o especificado?" da Mínima (36); parecer assíncrono com encerramento gracioso + subestado (37); gate com existência de artefato no repo (38 — G-05 wireado); onda com classes declaradas + handoff (41–45).
**Enforcement**: AB-04 (bloqueante com override após insistência humana — o eval testa a sequência resistir→persistir→override, exatamente o desenho).

### J4 — Condução da Etapa 2: ✅ Compliant
Parecer no ato com data (11); absorção silenciosa nomeada com a formulação "quanto mais capaz você se sentir..." (13); unicidade de ADR no mesmo commit (19); pendências da triagem → J10 (20); auto-teste "executável sem perguntas" (26); overview não-TDD-resumido (30); onda com reconciliação obrigatória anunciada no handoff (31–32).
**Enforcement**: AB-05 (decomposição), AB-07 (devolutiva).

### J5 — Condução da Etapa 3: ⚠️ Partially compliant
Worktree declarado (11); desvio no ato com trinca factual + hook (16); aceite por critério + duplo na Técnica (22–25); feedback → retro.md com naming honesto da consolidação ausente (33); reconciliação como gate com checklist 8.3 completa, evidência executada por item, auditoria de paridade por diff vazio com exceção arquitetura.md e resultados.md (40–47); recusa com defesa máxima (49); F1–F4 completas incluindo o não-normalizar da absorção (52); fechamento com veredito-antes-da-lista (57).
**Finding V-2 (Medium)**: **teardown de worktree ausente** — G-03/FM-12 foi atribuído à implementação ("instruction J5 + item na checklist") e não consta: o módulo só tem a declaração de criação (11); a checklist de reconciliação não lista worktrees remanescentes; não há cenário de eval. Detalhe na seção de findings.
**Enforcement**: AB-09/10/11/13/14/15 (6 dos 16 cenários cobrem esta jornada — a mais protegida da bateria).

### J6 — Refatoração (Variante Técnica): ✅ Compliant
Motivação com evidência e rejeição ativa de "melhorar a arquitetura" com autoridade citada (14); baseline imensurável → bloqueio COM CAMINHO (16 — G-13); **trava anti-auto-aprovação com as 3 regras duras verbatim** (22–25) + subestado `aguardando-aprovacao-e1` + "a tradução falhou, não o PO" (27); caracterização bloqueante com quirks (31); fatias com aceite duplo (37–38); resultados.md separado do baseline (39 — G-14); nota de paridade (40).
**Enforcement**: AB-03 (`hardFail: approval-lock` — o cenário tenta "apresenta e já segue com a caracterização"), AB-08 ("eu sei como funciona").

### J7 — Devolutiva: ✅ Compliant
Formalização antes da conversa (11); subestado + comportamento `pausada` com comentário de desbloqueio e cartão em Em andamento (16 — G-04); "vamos vendo não é decisão" (22); **registro duplo rodada + PRD vivo** (23); retomada por re-derivação com critério absoluto "zero tarefa executando escopo cortado" (34); absorção nomeada com empatia (38); métrica invertida (39).

### J8 — Requisito Emergente (guarda): ✅ Compliant
Teste objetivo verbalizado (12); lacuna respondida só se já no PRD (22); **regra do não-rascunho preservada e reforçada** ("saber é o gatilho da regra, não exceção a ela" — 22); 5 princípios completos **com delta positivo**: "se no estado atual o caminho for mais longo, diga o custo real" (26 — endurece o princípio 3 além da spec); benchmark ≤3 trocas (28); invalidação → pausa (30); contradição → bug-documentacao (32); evento E pendente/número (36); três arcos por persona (38–42).
**Enforcement**: AB-02 com `forbiddenPatterns` cobrindo "eu incluiria", "acho que", "sugiro" — a bateria testa exatamente a âncora emocional mais perigosa; cenários j8-guarda.yaml.

### J9 — Mesa de Discussão: ✅ Compliant
Pauta obrigatória + "seguir sem" visível (11); roster invocável de 12 com validação de IDs no install (18–35); **variante honesta W-04 com as 3 opções incluindo a emenda Guardian** (16); turnos sequenciais com file-paths-não-resumos (39); ask_peer com os 3 guards (41); **contrato de persistência por turno G-08 com a classe REGISTRO auxiliar e a exceção pré-pasta → comentários no épico** (42–44) + template `mesa/posicao.md` coerente; síntese sem votação com substituição de ADR no mesmo ato (49).
**Nota (Low, V-5)**: `PEER_CONSULTATION_CAP = 3` (ask-peer.ts:23) — o registro de consenso nomeava "cap 2/turno = anti-mesh". A spec de jornadas não fixa número (diz "cap de consultas"), então não é violação da spec — mas diverge do registro de consenso da arquitetura. Decisão necessária: corrigir o tool ou registrar a mudança para 3 como decisão deliberada.

### J10 — Reclassificação: ✅ Compliant
Gatilhos incluindo sugestão máx. 1×/demanda (13); avaliação com critérios citados (17); execução atômica com saneamento da onda corrente (28 — G-09); pasta da rodada intocada retroativamente + desvio registrado se divergir do planejado (30).

---

## Protocolos transversais

| Protocolo | Status | Evidência |
|---|---|---|
| P1 — Duas camadas | ✅ | protocolos.md §P1 + template issue-duas-camadas.md (linha de metadados com Subestado) |
| P1.1 — Subestados | ✅ | Tabela verbatim nos dois pontos (protocolos.md:30–47, j2-retomada.md:21–34) + comportamento de board para `pausada` |
| **P2 — Espelho de estado** | **⚠️ PARTIAL — Finding V-1 (High)** | Read-side wireada na J2 (j2-retomada.md:12); **write-side ausente em todos os módulos** — ver findings |
| P3 — Override × desvios | ✅ | Canal único via emit_event (type=override, `motivo_declarado` OBRIGATÓRIO no schema — emit-event.ts:77), assinatura por construção + rejeição de injeção (85–92), register-then-act, hook de desvios wireado no index (index.ts:26–29), warning em microcopy verbatim (microcopy.md:547–566), templates desvios/override completos |
| P4 — Lista negra | ✅ | Tabela completa (protocolos.md:81–95) + colisão rodada + framing + assert `no-jargon.mjs` nos evals da Etapa 1 |
| P5 — Team map | ✅ | Conteúdo, nascimento proposto, validação por diff, nota de visibilidade, baixo risco (protocolos.md:108–114) + template |
| P6 — Board | ✅ | Pós-confirmação, narrado, pausada, Entregue só pós-reconciliação, degradação graciosa |
| P7 — Distribuição | ✅ | Justificativa + carga + mensagem consolidada + inclui reconciliação e reconciliação retroativa B6 |
| Instrumentação A–F | ✅ | Schemas zod verbatim da spec, gatilhos nomeados nos módulos, thresholds de leitura (instrumentacao.md:237–250), leitor = fluxo-report (G-15) com FM-13 e paridade E |

## Microcopy (§7.x)
11/11 âncoras presentes com slots tipados e condições de slot ("frase condicional incluída fora da condição é drift" — convenção correta). Todas as referências dos módulos resolvem (§7.1–§7.11 conferidas uma a uma). Regras globais preservadas: sem citação de seção, sem vocabulário de confissão, clareza nunca podada. Adaptações plataforma-neutro marcadas explicitamente com nota local (microcopy.md:110, 289) — conduta exemplar de marcação de drift.

## Anti-bypass (os 4 pontos vigiados no consenso)
| Ponto | Preservado? | Evidência |
|---|---|---|
| Trava de aprovação J6 (turno distinto, default NÃO, citação literal) | ✅ | j6-tecnica.md:22–25; kernel gatilho #3; eval AB-03 com hardFail `approval-lock` |
| J8 nunca sequer rascunhar | ✅ | j8-guarda.md:22; kernel gatilho #2; eval AB-02 forbiddenPatterns |
| Reconciliação com evidência executada | ✅ | j5-etapa3.md:40–47; kernel gatilho #15; eval AB-15 hardFail `evidence-before-verdict` |
| Register-then-act em overrides | ✅ | emit_event como canal único; evals AB-01/04/13 com hardFail `override-before-mutation` |

---

## Findings

| # | Finding | Severidade | Evidência | Causa-raiz hipotética | Remediação |
|---|---|---|---|---|---|
| V-1 | **Espelho de estado (P2): lado da escrita não existe.** A spec define touchpoints de escrita ("a cada transição de gate + fim de sessão") e a J2 lê o espelho — mas nenhum módulo instrui a escrita (J3/J4 Etapa 4, J5 Etapa 5 não o mencionam) e **o caminho do arquivo nunca é definido** em nenhum artefato. O espelho nascerá ausente; a leitura da J2 degradará silenciosamente para "arquivo inexistente" em toda sessão. | **High** | protocolos.md:51–55 (só regras); j2-retomada.md:12 (única menção, read-only); grep "espelho" em src/instructions/jornadas/ → só j2 | G-02 (protocolo de escrita do espelho) foi roteado para a arquitetura; o formato foi decidido, mas o touchpoint de instruction nunca voltou aos módulos de jornada. | Adicionar linha de escrita do espelho em J3 Etapa 4 e J4 Etapa 4 (transições de gate) e J5 Etapa 5 (fechamento); definir caminho (ex.: `.fluxo/estado.md`); eval de presença no fluxo-report. |
| V-2 | **Teardown de worktree (G-03/FM-12) atribuído e não entregue.** O split registrou "Instruction J5 + item na checklist de reconciliação do plugin"; o módulo j5 só declara criação (j5-etapa3.md:11), a checklist não lista remanescentes, não há cenário de eval. | Medium | j5-etapa3.md (sem teardown); evals/scenarios/ (sem worktree-órfão) | Item roteado para implementação escapou entre "instruction" e "checklist do plugin" — ninguém era dono do landing. | Adicionar teardown ao módulo j5 + item "worktrees remanescentes listados" na checklist de reconciliação + fixture FM-12. |
| V-3 | **Drift de escopo: plataforma-neutro (GitLab) sem atualização da spec.** A implementação generalizou para GitHub+GitLab (ADR-012, platform/gitlab.ts, cookbook-gitlab.md, adaptações marcadas nos módulos); a spec de jornadas e o briefing falam GitHub (P2: "GitHub vence"; briefing: "GitHub CLI preferencialmente ou MCP GitHub"). A execução é deliberada, coerente e bem marcada — mas a fonte autoritativa não foi emendada: spec e código dizem coisas diferentes sobre o escopo de plataforma. | Medium | ADR-012 citado nos módulos; src/platform/gitlab.ts; referencia/cookbook-gitlab.md; spec §5 P2 | Decisão de arquitetura tomada na rodada de implementação sem rodada de emenda da spec (o Guardian não foi consultado sobre o impacto em jornadas). | **Decisão necessária (recomendo): emendar a spec para plataforma-neutro** — a adaptação preserva arcos emocionais e está consistentemente marcada; registrar no Audit Log da spec v2.2. Alternativa: restringir a implementação a GitHub (não recomendo — retrabalho sem ganho de jornada). |
| V-4 | **Escopo vinculante do harness parcialmente entregue.** O consenso declarou vinculante para o dogfood #1: "FM-04/06/13-detecção/21". FM-13 está coberto (fluxo-report, report-core.ts:90–103 ✔). **FM-04 (listar colaboradores sem permissão), FM-06 (abandono pré-épico — eval de alucinação de estado) e FM-21 (colisão de RF-NN) não têm cenário/fixture** em evals/scenarios/. A condição era "harness ou sem-dogfood". | Medium | ls evals/scenarios/ → anti-bypass, dry-run, j1, j2, j8 apenas; grep FM-04/06/21 → 0 ocorrências | A condição vinculante foi registrada no consenso mas o checklist de entrega do harness não a rastreou item a item. | Criar os 3 fixtures/cenários antes do dogfood #1 ou registrar decisão explícita de adiamento com justificativa (não silenciar). |
| V-5 | `PEER_CONSULTATION_CAP = 3` × consenso "cap 2/turno (anti-mesh)". Não viola a spec de jornadas (que não fixa número) — diverge do registro de consenso da arquitetura. | Low | ask-peer.ts:23; consensus turn 3 (Workflow Architect, papéis dos guards) | Mudança deliberada não registrada, ou erro. | Corrigir para 2 ou registrar a decisão "3" com justificativa. |
| V-6 | `.fluxo/config.md` (J1 Etapa 4) — adição fora da spec. Positiva (coerente com "sem estado fora do repositório"; persiste plataforma/host/board detectados). | Low | j1-triagem.md:58 | Implementação resolveu necessidade real (status probe + fallbacks) sem pedir emenda. | Absorver na spec v2.2 (P5 ou protocolo próprio). |
| V-7 | Evento A emitido também ao ultrapassar 3 perguntas num turno (antes do fechamento da triagem). Delta positivo — sinal mais cedo que a spec. | Low | instrumentacao.md:18 | Endurecimento deliberado da implementação. | Absorver na spec v2.2 (gatilho do evento A). |

---

## Spec Code Drift Log (decisões pendentes da equipe)

| # | Spec diz | Código faz | Decisão necessária | Recomendação |
|---|---|---|---|---|
| D-1 | Plataforma = GitHub (P2, briefing) | GitHub + GitLab, plataforma-neutro (ADR-012) | Emendar spec ou restringir código | **Emendar spec** (v2.2) — implementação coerente, adaptações marcadas, arcos preservados |
| D-2 | Espelho: escrito em gates + fim de sessão, arquivo único | Espelho: só lido; sem caminho definido | Corrigir código (é gap, não decisão de design) | Adicionar touchpoints + caminho (V-1) |
| D-3 | Consenso: cap ask_peer 2/turno | Tool: cap 3 | Corrigir tool ou registrar decisão | Registrar deliberadamente — 2 ou 3, com justificativa |
| D-4 | Consenso: harness vinculante inclui FM-04/06/21 | Cenários ausentes | Entregar antes do dogfood ou adiar explicitamente | Entregar — FM-06 (alucinação de estado) é barato e de alto valor |

---

## Conclusão do auditor

A implementação é fiel à spec de jornadas num grau que raramente se vê: os pontos emocionalmente calibrados (a recusa da J8 com seus 5 princípios e seus três arcos, a trava da J6, o enquadramento da reconciliação como assinatura da entrega) sobreviveram à derivação em módulos operacionais — e dois deles voltaram **mais fortes** (V-6, V-7). As 16 guardas anti-bypass existem em três camadas independentes (kernel residente, módulos de jornada, bateria adversarial com hard-fails) — exatamente a defesa em profundidade que o consenso pediu.

As quatro reservas são reais mas localizadas: um protocolo com o lado da escrita faltando (V-1), um item de implementação sem dono de landing (V-2), um drift de escopo bem executado aguardando emenda (V-3) e três fixtures do escopo vinculante (V-4). Nenhuma bloqueia o build; **V-4 bloqueia o dogfood #1** pela própria condição registrada no consenso ("harness ou sem-dogfood"), e **V-1 deve ser corrigida antes da primeira rodada real** — um espelho que nunca é escrito é o tipo de gap que ninguém nota até a primeira retomada que depende dele.

**Veredito: PASS WITH RESERVATIONS** — reservas: V-1, V-2, V-3, V-4 (e registro deliberado de V-5, absorção de V-6/V-7 na spec v2.2).

---

## Audit Log desta verificação
| Data | Ação |
|---|---|
| 2026-07-28 | Verificação completa J1–J10 + P1–P7 + microcopy + anti-bypass + tools/hook/report/evals contra jornadas v2.1. Veredito: PASS WITH RESERVATIONS (0C/1H/3M/3L). |
