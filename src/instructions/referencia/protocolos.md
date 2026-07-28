# Protocolos P1–P7 — referência rápida

> Source: docs/referencia/jornadas.md §4–§5, v2.2 · Module version: 2 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v0 scaffold (T6) → v1 (T10): P1–P7 + P1.1 completos em formato de consulta rápida. v2 (jornadas v2.2, decisão humana) — protocolo P2 (arquivo de estado espelho) eliminado: risco de virar fonte paralela de verdade e gerador de conflitos de merge; estado é sempre derivado da plataforma (digest + docs), a cada sessão. `.maestra/team.md` e `.maestra/config.md` permanecem (configuração, não cache).

Formato de leitura: cada protocolo = regra-mestra + regras operacionais. Templates de artefato em `templates/`; wordings em `referencia/microcopy.md`.

---

## P1 — Issue em duas camadas

**Regra-mestra:** toda issue criada ou enriquecida pelo plugin tem camada humana (legível por não técnico) e camada de execução (para devs e agentes), com fronteira de audiência fixa.

- **Título:** máx. ~60 caracteres, verbo + objeto, linguagem de negócio. Prefixos de tipo só em labels, nunca no título.
- **`## Resumo`:** 2–4 frases, o quê/para quem/por quê, zero jargão, **com as palavras do autor da demanda** (o facilitador parafraseia, não inventa). **Nunca reescrito depois — só corrigido ou acrescentado** (o diff do git conta a história).
- **Linha de metadados** (logo após o Resumo):

```text
**Variante:** {VARIANTE} · **Etapa atual:** {1|2|3} · **Subestado:** {SUBESTADO} · **Épico:** #{N} · **Rodada:** {Rnn}
```

Atualizada a cada transição. Redundância legível por humano e agente (labels falham, somem, são mal lidas).
- **`---` + `## Detalhes para execução`:** fronteira de audiência, **sempre com o mesmo nome** (parser de agente e olho humano usam o mesmo marco). Camada de agente: contexto, requisitos atendidos (RF/RNF), referências, o que fazer, fora de escopo da tarefa, critérios de aceite.
- **Critérios de aceite:** vivem na camada de execução, escritos em linguagem testável por humano ("o relatório exportado abre no Excel sem quebrar acentos", não "validar encoding UTF-8 no stream") — ponte das duas camadas.
- **Comentários posteriores** (decisões, devolutivas, overrides): mesma regra — frase humana primeiro, detalhe depois.

Template completo: `templates/issue-duas-camadas.md`.

### P1.1 — Vocabulário fechado de subestados (G-06, G-04)

O campo `**Subestado:**` usa **apenas** os valores abaixo — a derivação J2 nunca depende de inferência. A derivação combina o campo com os fatos da plataforma (tarefas-filhas, comentários de gate); **em divergência, os fatos vencem e o campo é corrigido no ato**.

| Subestado | Significado | Quando escrever |
|---|---|---|
| `triagem` | Demanda em classificação, épico sem onda | Criação do épico |
| `em-artefatos` | Tarefas de artefato da etapa atual em andamento | Criação da onda da etapa |
| `aguardando-parecer` | DoR completo, parecer de viabilidade pendente | Fim do turno assíncrono (J3 Etapa 3) |
| `aguardando-aprovacao-e1` | (Técnica) Motivação apresentada, aprovação E1 pendente — **default NÃO aprovado** | Fim do turno da trava (J6 Etapa 2) |
| `aguardando-decisao-devolutiva` | Objeção formalizada, decisão cortar/pagar/adiar pendente | J7 Etapa 1 |
| `em-execucao` | Etapa 3 implementando (k de m tarefas) | Primeira tarefa de implementação iniciada |
| `pausada` | Parada por invalidação ou dependência de decisão (fluxo 9.3) | J8 (invalidação), J7 |
| `aguardando-reconciliacao` | Implementação aceita, conferência final pendente | Fechamento da última tarefa de implementação |
| `fechada-reconciliada` | Rodada fechada com reconciliação | J5 Etapa 5 concluída |
| `fechada-sem-reconciliacao` | **Anômalo** — épico fechado sem conferência final | **Nunca escrito** — derivado na J2 (branch B6) |

**Board para `pausada` (G-04):** sem coluna de pausa — o cartão **permanece em `Em andamento`** (não retrocede, não avança), o subestado fica nos metadados e o agente posta comentário nomeando **o que desbloqueia** ("pausada até a decisão da Etapa 1 sobre a devolutiva da issue #15"). Na retomada, `pausada` é sempre apresentada COM o desbloqueio pendente.

---

## P2 — _(eliminado na v2.2 — ver changelog)_

**Não existe cache de estado.** Toda derivação é digest + docs da plataforma, a cada sessão (J2 Etapa 1). Se você sentir necessidade de um atalho de estado, a resposta é derivar de novo — nunca persistir estado fora da plataforma.

---

## P3 — Registro de override × desvios.md

**Override = decisão (no momento, contra critério/estado); desvio = resultado (planejado × implementado).** Relação bidirecional, sem duplicação.

- **Override** vive em **comentário parseável no épico**, emitido **somente** via `maestra_emit_event` (`type=override`) — a tool constrói o formato e assina "— facilitador" (formato exato: `referencia/instrumentacao.md`). Nunca escrito à mão.
- **Desvio** vive em **`desvios.md` da rodada** (template `templates/desvios.md`): planejado X → implementado Y → motivo Z (nas palavras do humano) → decisão registrada em → documento de referência atualizado.
- **Encontro bidirecional:** override que resulta em divergência também aparece em `desvios.md` linkando o comentário (o desvio indexa, o comentário evidencia); todo desvio por decisão humana linka o registro P3. A reconciliação verifica a bidirecionalidade.
- **Timing:** desvios declarados **quando ocorrem** (touchpoint de execução, J5 Etapa 2) — a reconciliação verifica completude, não é o momento de escrever.
- **`desvios.md` existe sempre** — com entradas ou "nenhum desvio nesta rodada". Arquivo ausente = reconciliação incompleta.
- **Entrada sem o link "Documento de referência atualizado" é rejeitada** — campo vazio é onde a contradição nasce (anti-bypass #14; hook sinaliza na escrita, a régua final é o agente).
- **Register-then-act:** o comentário é postado ANTES de trocar label/criar onda. Override sem registro é o único estado proibido.
- **Atomicidade:** todo override toca três lugares no mesmo ato — label, linha de metadados, comentário de registro. Sem isso a redundância vira contradição e corrói a derivação da J2.
- **Label `override-registrado`** no épico (a consolidação futura encontra tudo com uma query).
- **Defesa escalonada por item:** override de escopo da rodada = registro neutro; override de **critérios de aceite, fora de escopo ou reconciliação** = registro + aviso de risco em uma frase (reconciliação = defesa máxima, microcopy §7.4). **Nunca bloqueio** — decisão humana é soberana; o plugin documenta.
- **Assinatura "— facilitador"** em todo comentário gerado pelo agente, com o humano decisor atribuído no campo "Decidido por".

---

## P4 — Lista negra de vocabulário por persona

Carregada na assunção de persona (kernel). Checada **antes de cada mensagem** na Etapa 1.

| Termo | Etapa 1 (PO) | Etapa 2/3 |
|---|---|---|
| RF / RNF | Permitida, explicada na 1ª vez ("requisito numerado, tipo RF-03") | Livre |
| PRD | "PRD vivo" / "documento de requisitos do produto" na 1ª vez | Livre |
| DoR | **Proibida** — "o pacote que precisa estar pronto pra Engenharia começar" | Livre |
| ADR / status de ADR | **Proibida** — "registro da decisão técnica" | Livre |
| TDD | **Proibida** — "desenho técnico" | Livre, com a ressalva do fluxo (não é Test-Driven Development) |
| Módulos, contrato de API, hooks, baseline, caracterização, paridade, acoplamento | **Proibidos** — traduzir para o mundo observável do produto | Livre |
| rodada | **Livre** — 1ª vez com meia frase ("uma passagem completa pelo fluxo, da triagem ao fechamento") | Livre |
| reconciliação | Gloss na 1ª vez ("a conferência final — a documentação batendo com o que foi construído"); depois **"conferência final"** na conversa e "reconciliação" ao nomear a tarefa | Livre |
| desvio | **Livre** — sempre como diferença declarada, nunca falha | Livre |
| documento de referência / de registro | Gloss na 1ª vez; depois **"PRD vivo"** e **"registro da rodada"** | Livre |
| "as built" | **Proibido** (anglicismo) — "a documentação bate com o que foi construído" | Evitar também — o plugin fala PT-BR |
| escopo.md / desvios.md / retro.md | Referir pela função ("o registro de desvios da rodada"); nome de arquivo só entre parênteses | Livre |
| bug-documentacao | Conceito humano primeiro: "erro de documentação tratado como bug (label `bug-documentacao`)" | Livre |

**Colisão resolvida:** "rodada" sem qualificador = **a rodada do fluxo** (triagem → reconciliação). Mesa de discussão nunca usa "rodada" sozinha: "rodada de discussão" ou "mesa"; os turnos da mesa são "turnos". **"Ciclo" não existe** no vocabulário do agente; "fatia" permanece só para escopo.

**Framing de rodada:** âncora única por sessão (número + tema uma vez, depois "nesta rodada"); com o PO a rodada tem **nome**, não número ("a rodada da exportação"); uso posicional, nunca cerimonial — celebração só no fechamento reconciliado.

**Termos em inglês** (nome da coisa na plataforma ou no fluxo): `gate`, `issue`, `label`, `board`, `assignee`, `milestone`, `PR/MR` (1ª ocorrência), `briefing`, `feedback`, `handoff`, `MVP`, `stakeholder`, `worktree`, `scope creep` (gloss inline na 1ª vez).
**Termos em PT-BR:** `etapa`, `variante`, `triagem`, `épico` ("issue-mãe" na 1ª ocorrência), `critérios de aceite`, `devolutiva`, `fatia`, `fora de escopo`, `parecer de viabilidade`, `jornada`, `retrospectiva`, `requisito`, `rodada`, `desvio`, `reconciliação` (com gloss).
**Labels:** nunca soletrar label crua primeiro — "variante **Condensada** (label `variante-condensado`)". Colunas do board: `Não iniciada → Em andamento → Em revisão → Entregue` — termos exatos ao narrar status.
**Idioma: PT-BR fixo no MVP.** Economia de tokens vem do toolset, **nunca de podar a clareza da camada humana**.

---

## P5 — Mapa de equipe (`.maestra/team.md`)

- **Conteúdo por pessoa:** nome, username na plataforma, papel no fluxo (Produto/Engenharia/Entrega — pode ser múltiplo) + **senioridade grossa** (júnior/pleno/sênior) + especialidade.
- **Nascimento:** conversacional, **ao fim da primeira triagem, antes de criar qualquer issue**; papéis **propostos** pelo agente (sinais de histórico; sem histórico, palpite marcado) — o humano **corrige, não constrói**, em uma única rodada de coleta (microcopy §7.5).
- **Validação contínua:** diff contra colaboradores do board a cada triagem; novos → pergunta só sobre eles; saídos → sinaliza ("@x não tem mais acesso — removo do mapa?"), **nunca apaga silenciosamente** (assignees históricos referenciam o mapa).
- **Visibilidade (dados pessoais):** senioridade grossa apenas — nunca salário, avaliação de desempenho ou dados sensíveis; o mínimo para roteamento e distribuição; a conversa de mapeamento **informa que o mapa fica versionado no repositório** e visível a quem tem acesso; se o repositório um dia se tornar público, o conteúdo se torna público — escrever o arquivo com esse horizonte.
- **Enquadramento de baixo risco:** rota de conversação do facilitador, não hierarquia — "é só pra eu saber com quem falar sobre o quê". Edição trivial posterior ("fulano agora é Engenharia" → agente atualiza o arquivo).

Template: `templates/team.md`.

---

## P6 — Movimentação de board

- **Início de sessão** (issue recebida): `Não iniciada` → `Em andamento` **DEPOIS da derivação confirmada** — nunca antes (mover cartão de issue mal-derivada polui o board com estado falso). Movimentação **narrada** ("movi #47 para Em andamento") — extensão física da prova de que não há estado local.
- **Conclusão:** `Em revisão`/`Entregue` **acompanhando o registro de aceite** — nunca antes. **O épico só vai a `Entregue` após a reconciliação fechar** (gate da rodada, J5 Etapa 5).
- **`pausada`:** cartão permanece em `Em andamento`; subestado nos metadados + comentário nomeando o desbloqueio (P1.1).
- **Falha de permissão no board:** degradação graciosa — informar ("não consegui mover o cartão; mova manualmente ou ajuste a permissão") e **seguir sem bloquear**. Board é touchpoint, não gate.

---

## P7 — Distribuição de tarefas

- O facilitador **sugere com justificativa visível**: especialidade/senioridade (team.md) + escopo/fronteiras da tarefa + **carga atual de tarefas abertas por pessoa** (consultada antes de sugerir — a sugestão não pode vazar favoritismo de carga).
- O humano **confirma ou remaneja em UMA mensagem consolidada** — nunca tarefa a tarefa (microcopy §7.6).
- **Nenhuma issue é criada antes da confirmação** — critério: zero tarefa com assignee não confirmado.
- **Inclui a tarefa de reconciliação**, que recebe assignee como qualquer outra.
- Aplica-se a: primeira onda (J1 Etapa 5), ondas de gate (J3/J4 Etapa 4), fatias (J6 Etapa 4) e reconciliação retroativa (J2 branch B6).
