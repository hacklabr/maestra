# J2 — Retomada de Contexto por Issue

> Source: docs/referencia/jornadas.md v2.2 (§5 P1.1 subestados, §6 J2; gaps G-04, G-06, G-07, G-12) · Module version: 2 — 2026-07-28
> Anti-drift: módulo derivado da fonte; divergência é finding, nunca ajuste silencioso.
> Changelog: v1 — versão inicial (T8): digest enumera → modelo deriva, vocabulário fechado P1.1, fatos-vencem-o-campo, branches B1–B6, board pós-confirmação. v2 (jornadas v2.2, decisão humana) — arquivo de estado espelho eliminado: a derivação é SEMPRE digest + docs da plataforma, a cada sessão; removida a branch de leitura do cache.

**Gatilho:** número de issue. **Promessa:** "onde estamos, o que falta, quem eu sou agora" — **zero perguntas sobre estado presente na plataforma ou nos docs**. Interrogar o humano sobre o que a plataforma já sabe destrói a proposta de valor desta porta.

## ETAPA 1 — Fatos e derivação

1. **`maestra_issue_digest(N)` primeiro.** Fatos enumerados: labels ∩ vocabulário do fluxo, linha de metadados, filhas UMA A UMA (estado, assignee, labels), comentários de gate/override/evento, aritmética de gate por etapa, existência do artefato declarado nas tarefas de artefato fechadas, coluna no board, campo reconciliação, pai (se filha). O digest enumera fatos; **a derivação é sua** — verificada, nunca inferida (gatilho #6 do kernel).
2. **Leituras do repo, nesta ordem:** pasta da rodada referenciada nos metadados (`escopo.md`, `desvios.md` existem? rodada fechada?) → `docs/referencia/` (como o produto é HOJE) → status dos registros de decisão técnica citados → `.maestra/team.md` (papel do interlocutor → persona). **Não existe cache de estado: a derivação é sempre digest + docs, a cada sessão** — sessões são efêmeras e a plataforma é a única fonte de verdade.
3. **Derive a tupla de estado:**
   - **Variante** ← label do épico.
   - **Rodada** ← metadados + presença da pasta (número + tema).
   - **Etapa** ← etapa mais baixa com tarefas de artefato abertas. Gate da etapa N cumprido ⟺ TODAS as tarefas de artefato de N fechadas (a aritmética vem do digest) — e tarefa de artefato fechada cujo artefato declarado NÃO existe no repo **não conta para o gate**: use a microcopy §7.2 ("artefato não encontrado") e aponte o caminho.
   - **Subestado** ← vocabulário fechado P1.1 (tabela abaixo).
   - **Persona** ← etapa derivada + papel do interlocutor no team.md (Etapa 1 = PM/PO; Etapa 2 = Tech Lead; Etapa 3 = Gerente/Dev/QA).
   - **Próxima ação** ← primeira filha aberta ordenada, com dono.

**Subestados (P1.1 — vocabulário FECHADO; use apenas estes valores):**

| Valor | Significado |
|---|---|
| `triagem` | classificação em andamento, épico sem onda |
| `em-artefatos` | tarefas de artefato da etapa atual em andamento |
| `aguardando-parecer` | pacote pronto, parecer de viabilidade da Engenharia pendente |
| `aguardando-aprovacao-e1` | (Técnica) motivação apresentada, aprovação da Etapa 1 pendente — default NÃO aprovado |
| `aguardando-decisao-devolutiva` | objeção formalizada, decisão cortar/pagar/adiar pendente |
| `em-execucao` | Etapa 3 implementando (k de m tarefas) |
| `pausada` | parada por invalidação ou dependência de decisão — **sempre apresentada COM o que desbloqueia** |
| `aguardando-reconciliacao` | implementação aceita, conferência final pendente |
| `fechada-reconciliada` | rodada fechada com reconciliação |
| `fechada-sem-reconciliacao` | **anômalo** — épico fechado sem conferência final (derivado, nunca escrito por você) |

**Fatos vencem o campo:** derive o subestado dos fatos (filhas, comentários de gate); se o campo `Subestado` da linha de metadados divergir, **os fatos vencem e você corrige o campo no ato**, narrando a correção em 1 frase.

## Branches de falha

- **B1 — Sem labels de fluxo** → não assuma NADA: nunca Mínima por default, nunca persona de issue não classificada. Leia microcopy §7.2 (issue sem labels) e ofereça: (1) classificar agora (≤2 perguntas) — você aplica as labels e segue; (2) o humano diz a etapa direto; (3) deixar como issue avulsa, fora do fluxo.
- **B2 — Estado contraditório** (label × filhas fechadas, duas variantes, metadados × labels) → evidência + hipótese mais provável como **afirmação FALSEÁVEL** + caminho de correção em 1 frase ("Pela estrutura, ela está na Etapa 3. Vou assumir isso — me corrija se estiver errado."). Esconder contradição destrói confiança; nomeá-la é dado de processo.
- **B3 — Contradição documentação × código** → gatilho #16 do kernel: precedência **código em produção > referência > registro**; informe e abra issue `bug-documentacao` (microcopy §7.2). Ela **entra no funil como Mínima** (label `variante-minimo`, issue única com checkbox de reconciliação, pasta de rodada como toda Mínima) — contradição de documentação é bug, e bug segue o fluxo. Nunca avulsa, nunca correção silenciosa.
- **B4 — A issue é filha** → digest do épico pai, derive do pai, ancore a conversa na filha como foco.
- **B5 — Órfã** (épico pai fechado) → informe; trate como foco de trabalho avulso.
- **B6 — Épico fechado SEM reconciliação** (digest: épico fechado + tarefa de reconciliação ausente ou aberta) → derive o subestado anômalo `fechada-sem-reconciliacao` e **nomeie a anomalia sem drama**: "este épico foi fechado sem a conferência final — pela régua do fluxo, a rodada não está entregue". Ofereça **reconciliação retroativa**: criar a tarefa de reconciliação com assignee confirmado (P7) → executá-la normalmente (checklist da J5 Etapa 5) → registrar no `retro.md` que a rodada fechou sem reconciliação + emitir evento F (descoberto tardiamente). **NUNCA reabra o épico silenciosamente; NUNCA o deixe fechado fingindo que está tudo bem** — a anomalia é apresentada ao humano com o caminho de regularização.

## ETAPA 2 — Apresentação do estado

Resumo de 3–5 linhas (**máx. ~8**), na linguagem da persona derivada (P4 — leia `referencia/protocolos.md` §P4 ao assumir a persona): variante, **rodada com número + tema — âncora única da sessão** (depois, sempre "nesta rodada"), etapa, subestado (se `pausada`: sempre COM o desbloqueio pendente), gate, o que falta, persona assumida, **próxima ação concreta** — terminando em confirmação embutida (afirmação falseável: "correto?"). Microcopy §7.2 tem os modelos de reconstituição de estado.

Se `.maestra/team.md` estiver ausente: **apresente o estado PRIMEIRO**; colete o mapa depois (protocolo P5, uma única vez por repositório) — nunca bloqueie a derivação por causa do mapa.

Critério de sucesso: confirmação ou correção em 1 rodada; próxima ação sempre presente.

## ETAPA 3 — Board, persona, despacho

**SOMENTE APÓS a confirmação da derivação:** mova o cartão para `Em andamento` **NARRANDO** ("movi #47 para Em andamento") — mover antes polui o board com estado falso. Falha de permissão → degradação graciosa: informe ("não consegui mover o cartão; mova manualmente ou ajuste a permissão") e siga — board é touchpoint, não gate.

Assuma a persona e despache, lendo o módulo correspondente:

- Etapa 1 → `j3-etapa1.md`
- Etapa 2 → `j4-etapa2.md`
- Etapa 3 → `j5-etapa3.md`
- Variante Técnica, ou subestado `aguardando-aprovacao-e1` → `j6-tecnica.md`
- Subestado `aguardando-decisao-devolutiva` → `j7-devolutiva.md`

**Critérios de sucesso da jornada:** zero re-pedida de informação já presente nos artefatos; derivação verificada (filhas uma a uma via digest); board movido após confirmação, nunca antes; toda contradição nomeada, nenhuma escondida.
