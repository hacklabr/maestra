# AGENTS.md — maestra

> Plugin para **OpenCode** e **Mimo Code** que facilita o fluxo de
> desenvolvimento (triagem → três estágios → reconciliação, com gates e quatro
> variantes de profundidade). O plugin é a **disciplina**; a plataforma de
> issues (GitHub/GitLab) é a **memória** — nunca há estado local à sessão.
>
> Este projeto é **dogfooded**: o Maestra facilita o desenvolvimento do
> próprio Maestra. Por isso a seção [Dogfooding](#dogfooding--registro-de-falhas-do-fluxo)
> abaixo é parte inegociável deste arquivo.

## Stack

- **Linguagem:** TypeScript (Node.js)
- **Build:** `tsc` → `dist/`
- **Testes:** vitest (unit + integração contra stubs de `gh`/`glab`)
- **Evals:** promptfoo (tier determinístico + LLM-as-judge + golden
  transcripts) — condição de guarda para qualquer dogfooding (spec D7)
- **CLI scripts:** `scripts/check-*.sh`, `scripts/smoke.sh`
- **Instalação:** `install.sh` detecta host (opencode/mimocode/both) e copia
  instruções para `<host-config>/maestra/`

## Comandos

| Comando | O que faz |
|---|---|
| `npm install` | Instala dependências |
| `npm run build` | `tsc` + copia instruções para `dist/` |
| `npm test` | vitest (unit + integração contra stubs `gh`/`glab`) |
| `npm run smoke` | Smoke 4 células: 2 hosts × 2 plataformas |
| `npm run eval:dry` | Evals com modelo mockado (CI) |
| `npm run eval` | Evals com modelo real |
| `npm run eval:nightly` | Matriz completa, sem cache |
| `npm run eval:golden` | Golden transcripts |
| `npm run ci` | build + typecheck + test + check:vocab + check:dist + smoke + eval:dry |
| `npm run check:vocab` | `scripts/check-neutral-vocab.sh` — vocabulário neutro plataforma |
| `npm run check:dist` | `scripts/check-dist-hygiene.sh` — higiene do `dist/` |

## Estrutura do projeto

```
src/
├── host.ts                    # Heurística de host (opencode/mimocode)
├── adapter.ts                 # Adapter da plataforma de issues (GH/GL)
├── tools/                     # Ferramentas expostas: status, issue_digest,
│                              # emit_event, ask_peer
├── hooks/                     # Hooks pós-escrita (ex: validate-desvios)
├── cli/                       # maestra-report (audit de presença) +
│                              # maestra-config (config na branch órfã
│                              # __maestra_config__ — ADR-003)
├── instructions/
│   ├── kernel/                # L0 — sempre residente (~2.5k tokens)
│   ├── journeys/              # L1/L2 — J1..J10 (loaded on demand)
│   ├── reference/             # L3/L4 — microcopy, protocols, cookbooks GH/GL
│   ├── templates/             # Templates: scope, retro, deviations, etc.
│   └── catalog/               # Catálogo greppable de personas (submódulo)
docs/
├── dogfooding/findings.md     # ← Falhas do fluxo observadas em uso (ver abaixo)
└── rounds/Rnn-yyyy-mm-<slug>/ # Pastas de round (scope.md, retro.md, etc.)
__maestra_config__ (branch órfã — ADR-003; NÃO é pasta na árvore)
├── config.md                  #   Plataforma/host/board detectados
├── team.md                    #   Mapa de facilitadores (seniority coarse)
├── labels.md                  #   Mapeamento labels/colunas (ADR-002)
└── workflow.md                #   Fluxo pós-aceitação do PR + topologia de
                              #   PR/MR (ADR-004/ADR-006)
                              # (ler/gravar: maestra-config read|write <file>)
scripts/                       # check-*.sh, smoke.sh
ROADMAP.md                     # Tudo que ficou fora do MVP, com gatilho
README.md                      # Visão geral + instalação
```

## Convenções

### Idioma
- **Código:** inglês (identifiers, comentários, commits).
- **Docs de processo/fluxo (este projeto):** inglês com política adaptativa
  (commit `38def52`); docs de rounds/scope podem misturar PT-BR quando o
  contexto humano exige — siga o padrão do diretório onde está editando.

### Commits
Estilo observado no `git log`:
```
fix(emit-event): normalize payload when host serializes object as JSON string
feat: shell-specialist completion — persona-expansion hook, caller-identity
docs(rounds): birth R01 — scope.md (entry gate adherence)
chore(triage): add partial team map (.maestra/team.md)
```
- Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
- Escopo entre parênteses quando útil (`fix(emit-event):`).
- Sujeito no imperativo, inglês, sem ponto final.

### Rounds
- Cada round = pasta `docs/rounds/Rnn-yyyy-mm-<slug>/` com `scope.md`
  (RECORD — selado no fechamento), `retro.md`, `deviations.md` conforme
  aplicável.
- Correções posteriores = adendo datado, **nunca** reescrita do scope.

### Anti-bypass
O kernel define 19 triggers anti-bypass (um-linha cada). Qualquer instrução
editada neste projeto deve ser cotejada contra eles — não introduzir brechas
que permitam pular gates.

## Dogfooding — registro de falhas do fluxo

Este projeto é **dogfooded**: usamos o Maestra para desenvolver o Maestra.
Toda falha do fluxo observada em uso é insumo para uma futura round. **Não há
conserto silencioso.**

### Quando registrar (automático, obrigatório)

Ao detectar **qualquer** das situações abaixo durante uma sessão, registre
**antes de prosseguir** em [`docs/dogfooding/findings.md`](docs/dogfooding/findings.md):

| Categoria | Registrar quando |
|---|---|
| `tool-retry` | Ferramenta (`maestra_status`, `maestra_issue_digest`, `maestra_emit_event`, `ask_peer`) falhou ou exigiu ≥2 tentativas |
| `board-state` | Card/label/variante/etapa divergente do esperado pelo fluxo |
| `instruction-ambiguous` | Facilitador desobedeceu ou interpretou errado instrução do kernel/jornada/cookbook |
| `doc-contradiction` | Comportamento real do plugin divergente de `fluxo-de-desenvolvimento.md` / `jornadas.md` / `README.md` |
| `ergonomic-friction` | Funciona, mas é custoso/lento/confuso (melhoria de UX, não bug estrito) |

### Onde e como
- **Arquivo:** `docs/dogfooding/findings.md` (append-only).
- **ID incremental:** próximo ID livre indicado no cabeçalho do arquivo.
- **Template:** ver cabeçalho do próprio arquivo (Data, Categoria, Origem,
  Sintoma, Tentativas/workaround, Status).

### Distinção crítica (não confundir)
- **`doc-bug` (label):** contradição **documentação × código do produto**
  (trigger #16, entra no funil como Minimal). É um bug do produto.
- **Dogfooding finding:** falha do **próprio fluxo/plugin Maestra** (ferramenta
  que falhou, instrução ambígua, board divergente, atrito). Vira scope de uma
  futura round do Maestra sobre si mesmo.

### Ciclo
Na próxima triagem do Maestra sobre o próprio Maestra, entradas
`Status: open` em `findings.md` são candidatos a scope
(`docs/rounds/Rnn-…/scope.md`). Ao virar scope, marcar `Status: triaged→Rnn`.

## Referências
- **[README.md](README.md)** — visão geral, instalação, arquitetura L0–L4.
- **[ROADMAP.md](ROADMAP.md)** — fora do MVP, com gatilho objetivo por item.
- **`../fluxo-de-desenvolvimento.md`** — processo normativo (fonte de verdade).
- **`docs/rounds/`** — rounds anteriores como exemplo de scope/retro.
- **Branch `__maestra_config__`** — plataforma/host/board detectados para este
  repo (`config.md`, `team.md`, `labels.md`, `workflow.md`; ADR-003/ADR-004 —
  ler com `maestra-config read config.md`).
