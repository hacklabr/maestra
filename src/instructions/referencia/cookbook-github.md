# Cookbook — GitHub (gh CLI + API)

> Source: specification.md D6 · fluxo-de-desenvolvimento.md §4 · jornadas.md P6 · Module version: 1
> Anti-drift: ÚNICO lugar onde comandos `gh`/API GitHub aparecem (ADR-012). Instructions
> referenciam OPERAÇÕES (nomes neutros em `kebab-case`), nunca CLIs. Divergência com a
> fonte é finding, nunca ajuste silencioso.
> Convenções: `<O>/<R>` = owner/repo · `<N>` = número da issue · `<ENC>` = projeto URL-encoded.

## 0. Matriz de capacidades (o que limita / gotchas — degrade, não falhe)

| Capacidade | Situação | Como degradar |
|---|---|---|
| Sub-issues nativas | **POST exige `sub_issue_id` = databaseId, NÃO o número** (o número falha com 422) | Resolver o id antes (`--jq .id`) — ver `vincular-tarefa` |
| Escrita no board (Projects v2) | Exige escopo **`project`** no token; ambiente atual tem `read:project` | P6: narrar a coluna pretendida e seguir — board é touchpoint, não gate |
| Leitura do board | `read:project` basta | — |
| Add-to-board | **NÃO é automático** (exige `item-add` ou workflow do projeto) | Sempre `item-add` ao criar épico/tarefa |
| Labels/repo, comentários, issues, milestones | Escopo `repo` — coberto | — |
| Colaboradores/membros | Escopo `read:org` | P6: mapa parcial de equipe, nunca bloqueia épico |
| GHES (self-hosted) | `gh auth login --hostname <host>`; `--hostname` nos `gh api` ou `GH_HOST` env | Mesmas operações, base `/api/v3` |

**Colunas canônicas do board:** `Não iniciada` → `Em andamento` → `Em revisão` → `Entregue`
(no GitHub: opções do campo single-select **Status** do Projects v2).

## 1. Operações de criação

### criar-epico
```bash
gh issue create --repo <O>/<R> --title "<verbo + objeto, ≤60c>" \
  --body-file epico.md --label "variante-condensado" --assignee <user>
```
Corpo = duas camadas P1 (`## Resumo` + linha de metadados + `---` + `## Detalhes para execução`).

### criar-label
```bash
gh label create <nome> --repo <O>/<R> --color <hex-sem-#> --force   # --force = idempotente
```
Conjunto do fluxo: `variante-completo|condensado|minimo|tecnica`, `etapa-1|2|3`,
`override-registrado`, `bug-documentacao`, `feedback-produto`.

### criar-tarefa (issue-filha)
```bash
gh issue create --repo <O>/<R> --title "<título>" --body-file tarefa.md \
  --label "etapa-1" --assignee <user-confirmado>
```
Depois vincular (operação `vincular-tarefa`) e adicionar ao board (`adicionar-ao-board`).

### criar-milestone
```bash
gh api repos/<O>/<R>/milestones -f title="R02 — exportação de relatórios"
gh issue edit <N> --repo <O>/<R> --milestone "R02 — exportação de relatórios"
```

## 2. Operações de hierarquia (épico → tarefas)

### vincular-tarefa — GOTCHA databaseId
```bash
# 1) resolver o databaseId da FILHA (o NÚMERO não serve no POST)
FILHO_ID=$(gh api repos/<O>/<R>/issues/<N_FILHO> --jq .id)
# 2) vincular
gh api repos/<O>/<R>/issues/<N_EPICO>/sub_issues -f sub_issue_id=$FILHO_ID
```

### desvincular-tarefa
```bash
gh api repos/<O>/<R>/issues/<N_EPICO>/sub_issues -X DELETE -f sub_issue_id=$FILHO_ID
```

### reordenar-tarefas
```bash
gh api repos/<O>/<R>/issues/<N_EPICO>/sub_issues/priority -X PATCH \
  -f sub_issue_id=$FILHO_ID -f after_id=$ID_DA_ANTERIOR   # ou before_id
```

### ler-hierarquia (1 query — usada pelo digest; manual só em depuração)
```bash
gh api repos/<O>/<R>/issues/<N>/sub_issues?per_page=100 \
  --jq '[.[] | {number, title, state, labels: [.labels[].name], assignees: [.assignees[].login]}]'
```
Roll-up de progresso é nativo (campo de sub-issues na UI/API) — **sem tasklist manual**.
> **Paginação:** página única (`per_page=100`). Acima de 100 itens, o digest marca
> `paginacao.filhosTruncados: true` — tratar como sinal, não ler além.

## 3. Operações de leitura

### ler-issue
```bash
gh api repos/<O>/<R>/issues/<N>
```

### ler-comentarios
```bash
gh api repos/<O>/<R>/issues/<N>/comments?per_page=100 \
  --jq '[.[] | select(.body | contains("— facilitador")) | {autor: .user.login, data: .created_at, corpo: .body}]'
```

### ler-carga-aberta (P7 — justificativa de distribuição)
```bash
gh issue list --repo <O>/<R> --assignee <user> --state open \
  --json number,title --jq 'length'
```

### ler-colaboradores (P5 — mapa de equipe)
```bash
gh api repos/<O>/<R>/collaborators --jq '.[].login'
```

### ler-prs-mergeados (reconciliação — escopo × implementado)
```bash
gh pr list --repo <O>/<R> --state merged --search "merged:>=<AAAA-MM-DD>" \
  --json number,title,mergedAt
```

## 4. Operações de escrita

### comentar (gates, overrides P3, eventos A–F, aceites)
```bash
gh issue comment <N> --repo <O>/<R> --body-file comentario.md
# variante GHES-safe (a usada pelo adapter):
gh api repos/<O>/<R>/issues/<N>/comments -f body="<texto>"
```

### editar-corpo (linha de metadados P1 — reescrever só a linha)
```bash
gh issue edit <N> --repo <O>/<R> --body-file corpo-atualizado.md
```
Nunca reescrever o `## Resumo` — só corrigir/adicionar (P1).

### rotular (add/remove — reclassificação J10, override)
```bash
gh issue edit <N> --repo <O>/<R> --add-label "override-registrado"
gh issue edit <N> --repo <O/R> --remove-label "variante-minimo" --add-label "variante-condensado"
```

### atribuir (assignee confirmado — toda tarefa nasce com um)
```bash
gh issue edit <N> --repo <O>/<R> --add-assignee <user>
```

### fechar-issue (aceite com veredito por critério)
```bash
gh issue close <N> --repo <O>/<R> --comment "<veredito critério a critério — facilitador>"
```

### criar-release (Etapa 3.4)
```bash
gh release create v<X.Y.Z> --repo <O>/<R> --generate-notes
```

## 5. Operações de board (Projects v2 — 3 a 4 chamadas com IDs)

### adicionar-ao-board
```bash
gh project item-add <NUM_PROJETO> --owner <ORG-ou-@me> \
  --url https://github.com/<O>/<R>/issues/<N> --format json --jq .id
```

### descobrir-ids (1× por projeto; cachear em `.fluxo/config.md` → `board:`)
```bash
# project id (PVT_…)
gh project view <NUM_PROJETO> --owner <ORG> --format json --jq .id
# field id + option ids do campo Status (PVTSSF_… + opções)
gh project field-list <NUM_PROJETO> --owner <ORG> --format json \
  --jq '.fields[] | select(.name=="Status") | {fieldId: .id, options: [.options[] | {name, id}]}'
```

### mover-cartao
```bash
# 1) item id (PVTI_…) da issue no projeto
ITEM=$(gh project item-list <NUM_PROJETO> --owner <ORG> --format json \
  --jq '.items[] | select(.content.number==<N>) | .id')
# 2) mover
gh project item-edit --project-id <PVT_> --id $ITEM \
  --field-id <PVTSSF_> --single-select-option-id <OPT_ID>
```
Regras P6: `Em andamento` só **após** derivação confirmada, narrado; `Entregue` só com a
tarefa de reconciliação fechada (gate da rodada); falha de permissão → narrar e seguir.

## 6. Auth e escopos

```bash
gh auth status          # mostra usuário, hosts e SCOPES do token
```
| Escopo | Necessário para | Ambiente atual |
|---|---|---|
| `repo` | issues, labels, comentários, milestones, releases | ✓ |
| `project` | **escrita** no board (mover cartão) | ✗ — só `read:project` → P6 |
| `read:project` | leitura do board | ✓ |
| `read:org` | colaboradores/membros (P5) | ✓ |

### 6.1 Status de verificação (T12)

Todos os padrões `gh` verificados contra gh 2.96.0 real + docs oficiais (T1/T4) e exercitados
no smoke de 4 células com stub. Exceção: o endpoint `/parent` (sub-issues REST) é assumido
da API documentada — confirmar no primeiro uso com repo real.

## 7. Degradação P6 por operação (sabor `read:project` / sem escopo)

| Operação | Falha típica | Comportamento |
|---|---|---|
| `mover-cartao`, `adicionar-ao-board` | `INSUFFICIENT_SCOPES` / 403 | Narrar a coluna pretendida em 1 frase + seguir; **nunca bloqueia** |
| `vincular-tarefa` | 422 (id errado — número no lugar de databaseId) | Refazer com `--jq .id`; relatar exato |
| qualquer write | 403/404 | Relatar o que foi criado e o que falta; retomada idempotente (digest relê o que existe) |
| `ler-colaboradores` | 403 | Mapa parcial de equipe (P5 mínimo para a onda); nunca bloqueia épico |
| tudo (gh ausente/sem auth) | `gh auth status` falha | MCP GitHub (se configurado) ou comandos prontos para o humano; **nunca épico pela metade** |

## 8. Paridade MCP (fallback declarativo — só se `fluxo_status` reportar MCP GitHub "configured")

| Operação | gh | MCP (nomes típicos*) |
|---|---|---|
| criar-epico/tarefa | `gh issue create` | `github_issue_write` (create) |
| comentar | `gh issue comment` | `github_add_issue_comment` |
| vincular-tarefa | `gh api …/sub_issues` | `github_sub_issue_write` (add) |
| rotular | `gh issue edit --add-label` | `github_label_write` / `github_issue_write` (labels) |
| mover-cartao | `gh project item-edit` | `github_projects_write` (update_project_item) |
| ler-hierarquia/issue | `gh api` | `github_issue_read` (get_sub_issues) |
| ler-carga | `gh issue list` | `github_list_issues` / `github_search_issues` |

\* Nomes variam conforme o servidor MCP instalado — conferir o toolset real disponível na sessão.
