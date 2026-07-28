# Cookbook — GitLab (glab CLI + API v4)

> Source: specification.md D6 (ADR-010/011/013/014) · fluxo-de-desenvolvimento.md §4 · jornadas.md P6 · Module version: 1
> Anti-drift: ÚNICO lugar onde comandos `glab`/API GitLab aparecem (ADR-012). Instructions
> referenciam OPERAÇÕES (nomes neutros em `kebab-case`), nunca CLIs. Divergência com a
> fonte é finding, nunca ajuste silencioso.
> Convenções: `<ENC>` = projeto URL-encoded (`grupo/loja` → `grupo%2Floja`) · `<I>` = iid da
> issue · sem gotcha de databaseId (tudo usa iid).

## 0. Matriz de capacidades (o que NÃO existe — degrade, não falhe)

| Capacidade | Situação | Como degradar |
|---|---|---|
| Sub-issues nativas | **Não existe** (épicos = Premium + deprecated; work-items = experimental, proibido) | **ADR-011:** épico-como-issue + links `relates_to` + tasklist no corpo (roll-up `task_completion_status`) |
| Board por assignee/iteration/milestone | Premium apenas | Listas por label scopado `status::*` (Free) |
| Campos customizados de card | Não existe | Não usado pelo fluxo (zero perda) |
| Árvore da hierarquia em 1 query | Não existe | 2–3 REST (o digest absorve) |
| `glab epic` / `glab board` alto nível | Não existe | `glab api` cru (abaixo, tudo pinado) |
| Escrita (notes, labels, links) | PAT escopo **`api`**; `read_api` = somente leitura | P6 sabor `read_api`: narrar e seguir |

**Colunas canônicas do board:** `Não iniciada` → `Em andamento` → `Em revisão` → `Entregue`
(no GitLab: labels scopados `status::nao-iniciada` `status::em-andamento` `status::em-revisao` `status::entregue`).

**Inversões favoráveis × GitHub:** mover cartão = **1 PUT**; add-to-board = **implícito**
(atribuir a label `status::*` já faz a issue aparecer na lista correspondente).

## 1. Operações de criação

### criar-epico
```bash
glab issue create --title "<verbo + objeto, ≤60c>" --description "$(cat epico.md)" \
  --label "variante-condensado" --assignee <user>
```
Corpo = duas camadas P1 (`## Resumo` + linha de metadados + `---` + `## Detalhes para execução`).
Fora do diretório do repo: adicionar `--repo <grupo/loja>` ou usar `glab api` (abaixo).

### criar-label
```bash
glab api projects/<ENC>/labels -X POST -f name="<nome>" -f "color=#8A2BE2"
# idempotente: 409 "already exists" = ok, seguir
```
Conjunto do fluxo: `variante-*`, `etapa-1|2|3`, `override-registrado`, `bug-documentacao`,
`feedback-produto`, e os 4 `status::*` das colunas.

### criar-tarefa (issue-filha)
```bash
glab api projects/<ENC>/issues -X POST \
  -f "title=<título>" -f "description=$(cat tarefa.md)" \
  -f "labels=etapa-1" -f "assignee_ids=<USER_ID>"
```
`USER_ID`: `glab api "users?username=<user>" --jq '.[0].id'`. Depois `vincular-tarefa` +
`manter-tasklist` + `rotular` com a coluna inicial.

### criar-milestone
```bash
glab api projects/<ENC>/milestones -X POST -f "title=R02 — exportação de relatórios"
# atribuir:
glab api projects/<ENC>/milestones --jq '.[] | select(.title | startswith("R02")) | .id'
glab api projects/<ENC>/issues/<I> -X PUT -f milestone_id=<ID>
```

## 2. Operações de hierarquia (ADR-011: links + tasklist)

### vincular-tarefa
```bash
# 1) link relates_to (bidirecional; exige permissão nas DUAS issues)
glab api "projects/<ENC>/issues/<I_EPICO>/links?target_project_id=<ENC>&target_issue_iid=<I_FILHO>" -X POST
# 2) manter-tasklist (roll-up)
```

### manter-tasklist — 1 escrita extra por tarefa (custo declarado ADR-011)
```bash
# 1) ler o corpo atual do épico
glab api projects/<ENC>/issues/<I_EPICO> --jq .description > /tmp/epico.md
# 2) editar localmente: adicionar "- [ ] #<I_FILHO>" (ou marcar "- [x]" ao fechar)
# 3) devolver
glab api projects/<ENC>/issues/<I_EPICO> -X PUT -f "description=$(cat /tmp/epico.md)"
```
**Fatos vencem o campo:** o estado real é o da issue; divergência checkbox×issue é
reportada pelo digest (`hierarquia.dessincronia`) e cobrada na reconciliação.

### desvincular-tarefa
```bash
glab api "projects/<ENC>/issues/<I_EPICO>/links?link_type=relates_to" -X DELETE -f issue_link_id=<LINK_ID>
# LINK_ID vem de ler-hierarquia (campo issue_link_id); remover também da tasklist
```

### ler-hierarquia
```bash
glab api "projects/<ENC>/issues/<I>/links?per_page=100" \
  --jq '[.[] | {numero: .iid, titulo: .title, estado: .state, labels, link: .issue_link_id}]'
# roll-up: glab api projects/<ENC>/issues/<I> --jq .task_completion_status
```
Filhos são identificados também pela linha P1 (`**Épico:** #N`) — referência cruzada canônica.
> **Paginação:** página única (`per_page=100`). Acima de 100 itens, o digest marca
> `paginacao.filhosTruncados: true` — tratar como sinal, não ler além.

## 3. Operações de leitura

### ler-issue
```bash
glab api projects/<ENC>/issues/<I>
```

### ler-comentarios (notes — filtrar `system: false`)
```bash
glab api "projects/<ENC>/issues/<I>/notes?per_page=100" \
  --jq '[.[] | select(.system == false and (.body | contains("— facilitador"))) | {autor: .author.username, data: .created_at, corpo: .body}]'
```

### ler-carga-aberta (P7)
```bash
glab api "projects/<ENC>/issues?assignee_username=<user>&state=opened&per_page=100" --jq 'length'
```

### ler-membros (P5 — mapa de equipe)
```bash
glab api "projects/<ENC>/members/all?per_page=100" --jq '.[].username'
# /members/all inclui herdados do grupo; /members só diretos
```

### ler-mrs-mergeados (reconciliação)
```bash
glab api "projects/<ENC>/merge_requests?state=merged&updated_after=<AAAA-MM-DD>T00:00:00Z&per_page=100" \
  --jq '[.[] | {numero: .iid, titulo: .title, mergedAt: .merged_at}]'
```

## 4. Operações de escrita

### comentar (gates, overrides P3, eventos A–F, aceites)
```bash
glab issue note <I> -m "<texto>"
# variante API (a usada pelo adapter; corpo com quebras via -f):
glab api projects/<ENC>/issues/<I>/notes -X POST -f "body=<texto>"
```

### editar-corpo (linha de metadados P1 — reescrever só a linha)
```bash
glab api projects/<ENC>/issues/<I> --jq .description > /tmp/corpo.md
# editar só a linha de metadados, depois:
glab api projects/<ENC>/issues/<I> -X PUT -f "description=$(cat /tmp/corpo.md)"
```
Nunca reescrever o `## Resumo` — só corrigir/adicionar (P1).

### rotular = mover-cartao (1 PUT — board é projeção das labels)
```bash
glab api projects/<ENC>/issues/<I> -X PUT \
  -f "add_labels=status::em-andamento" -f "remove_labels=status::nao-iniciada"
```
Regras P6: `em-andamento` só **após** derivação confirmada, narrado; `entregue` só com a
tarefa de reconciliação fechada (gate da rodada); falha de permissão → narrar e seguir.
Reclassificação J10 usa a mesma forma com labels de variante.

### atribuir (assignee confirmado)
```bash
glab api projects/<ENC>/issues/<I> -X PUT -f "assignee_ids=<USER_ID>"
```

### fechar-issue (aceite com veredito por critério)
```bash
glab api projects/<ENC>/issues/<I>/notes -X POST -f "body=<veredito critério a critério — facilitador>"
glab api projects/<ENC>/issues/<I> -X PUT -f "state_event=close"
```

### criar-release (Etapa 3.4)
```bash
glab release create v<X.Y.Z>   # no diretório do repo
```

## 5. Setup do board (1× por projeto; persistir id em `.fluxo/config.md` → `board:`)

```bash
# 1) criar o board (se não existir)
glab api projects/<ENC>/boards -X POST -f "name=Fluxo"
# 2) ids das labels de coluna
glab api projects/<ENC>/labels --jq '[.[] | select(.name | startswith("status::")) | {name, id}]'
# 3) criar as 4 listas (uma por label, na ordem canônica)
glab api projects/<ENC>/boards/<BOARD_ID>/lists -X POST -f label_id=<LABEL_ID>
```
Boards já existentes: `glab api projects/<ENC>/boards --jq '.[] | {id, name}'` — reutilizar.

## 6. Auth e self-hosted

```bash
glab auth status                       # usuário + hosts
glab auth status --hostname <host>     # self-hosted
```
| Item | Valor |
|---|---|
| PAT necessário | escopo **`api`** (notes, labels, links, boards, issues, releases) |
| `read_api` | leitura apenas → P6 em todas as escritas |
| Self-hosted | `GITLAB_HOST=https://gitlab.empresa.com` env · ou `--hostname <host>` por chamada · ou `glab config set host` |
| Probe de instância | `GET https://<host>/api/v4/version` → 401/200 = viva (usado por `fluxo_status`) |

### 6.1 Status de verificação das flags (T12)

| Forma | Status |
|---|---|
| `glab issue note -m` | ✅ verificada (docs oficiais, T4) |
| `glab issue create --label` | ✅ verificada (docs oficiais, T4) |
| Endpoints REST (issues, links, notes, boards, labels, milestones, members, merge_requests) | ✅ verificados contra gitlab.com/api/v4 + docs (T4) |
| `glab api` (`-f`, `-X`, `--jq`, `--hostname`) | ⚠️ assumida (espelha `gh api`; coberta por stub no smoke — confirmar no 1º piloto) |
| `glab issue create --assignee`, `glab label create` (forma CLI) | ⚠️ não verificada — usar a forma `glab api` pinada acima até o piloto |

## 7. Degradação P6 por operação (sabor `read_api` / sem permissão)

| Operação | Falha típica | Comportamento |
|---|---|---|
| `rotular`/`mover-cartao`, `comentar`, `vincular-tarefa` | 403 (`read_api`) | Narrar a ação pretendida em 1 frase + seguir; **nunca bloqueia** |
| `criar-label` | 409 already exists | Idempotente — seguir |
| `vincular-tarefa` | 404 (iid errado) / 403 (sem permissão na filha) | Relatar exato; retomada idempotente (digest relê links) |
| `manter-tasklist` | dessincronia checkbox×issue | **Não esconder**: digest reporta; reconciliação cobra |
| `ler-membros` | 403 | Mapa parcial de equipe (P5 mínimo para a onda); nunca bloqueia épico |
| tudo (glab ausente/sem auth) | `glab auth status` falha | MCP GitLab (se configurado) ou comandos prontos para o humano; **nunca épico pela metade** |

## 8. Paridade MCP (fallback declarativo — NÃO VERIFICADO até o primeiro piloto GitLab)

O GitLab tem MCP server oficial próprio (docs/user/model_context_protocol/mcp_server).
`fluxo_status` reporta "configured" quando presente; a tabela de equivalências será
pinada após o piloto — até lá, preferir `glab api` e tratar MCP como experimental.
