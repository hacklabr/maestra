# Scope of round R17 — Instrução sem prompt de leitura

> Epic: [#52](https://github.com/hacklabr/maestra/issues/52) · Variant: Minimal (modo direto)
> Briefing: a própria issue #52 (Minimal — a issue é o briefing), aprovado em sessão direta em 2026-08-28.
> Origem: dogfooding finding [F039](../../dogfooding/findings.md) (ergonomic-friction) — aprovação manual de leitura fora do workspace a cada sessão.
> Nota: R16 está reivindicado na metadata da issue #34 (pasta ainda não nascida); re-lista antes do nascimento confirmou máximo R15 → R17.

## Variant

minimal

## Requirements introduced

- RF-45 — Nova tool do plugin (`src/tools/`, registrada no mapa de tools de `src/index.ts`, no padrão das existentes) devolve o **conteúdo integral de UM arquivo** da árvore `instructions/` (kernel/, journeys/, reference/, templates/ **e catalog/**) a partir do diretório instalado do plugin, identificado por **caminho relativo** à árvore. Um arquivo por chamada — a tool não possui modo de despejar a árvore inteira (lazy loading preservado). Nome de exibição a definir no desenho técnico (proposta: `read_instructions`). *(Correção in-round, 2026-08-28: incluído `catalog/` — na instalação de usuário o catálogo também vive fora do workspace, mesma dor; a árvore instalada o contém.)*
- RF-46 — A tool é restrita à árvore `instructions/` do diretório instalado do plugin (allowlist rígida): caminhos absolutos, `..`, symlinks para fora e qualquer escape do diretório são **rejeitados com erro explícito** (fail closed, nunca silencioso). Arquivo inexistente dentro da árvore → erro claro nomeando o caminho pedido.
- RF-47 — As instruções do plugin passam a instruir o agente a **chamar a tool** em vez de `read` para carregar kernel, jornadas, reference e templates (mesma semântica de lazy loading por gatilho de fase), **incluindo os bootstrap pointers dos agentes** (`src/agents/*` — o ponteiro enxuto que hoje manda "ler o kernel em `<caminho>`" é a primeira leitura fora do workspace de cada sessão; F027). Sem isso a tool existe e o atrito permanece — a mudança de comportamento das instruções é parte do requisito, não apêndice. *(Correção in-round, 2026-08-28: bootstrap pointers incluídos explicitamente.)*
- RNF-02 — Sessão nova do agente maestra em **qualquer repo** percorre o entry gate completo (`maestra_status` → kernel → jornada) e os carregamentos tardios seguintes **sem nenhum prompt de permissão de leitura** do host (métrica de sucesso do briefing).
- RNF-03 — Suíte de garantias no padrão do repo: testes unit + integração (stub de fs), evals de não-regressão cobrindo o novo comportamento (guard de dogfooding, spec D7), `npm run ci` verde (inclui `check:vocab`, `check:dist`, smoke, eval:dry).

## Requirements changed

(nenhum)

## Requirements discontinued

(nenhum)

## Out of scope for this round

- Configuração de permissões do host (allowlist em `opencode.json`) — alternativa considerada e descartada em favor da tool.
- Branch órfã `__maestra_config__` (config.md/team.md/workflow.md) — já servida pelo CLI `maestra-config`.
- Arquivos `agents/*.md` — injetados pelo host no system prompt; o agente não os lê por iniciativa própria.
- Catálogo de personas (submódulo in-workspace; leitura sem atrito).
- Mudança no layout de instalação das instruções ou no mecanismo de build/cópia (`tsc` → `dist/`).

## Acceptance criteria (do briefing aprovado)

1. Sessão nova do agente maestra em repo qualquer percorre o entry gate completo (`maestra_status` → kernel → jornada) sem nenhum prompt de permissão de leitura do host.
2. A nova tool devolve o conteúdo integral de um arquivo da árvore `instructions/` por caminho relativo (ex.: `kernel/maestra-kernel.md`); exatamente um arquivo por chamada.
3. Caminho absoluto, `..` ou qualquer tentativa de sair da árvore é rejeitada com erro explícito; arquivo inexistente dentro da árvore retorna erro nomeando o caminho.
4. Nenhuma instrução do plugin (kernel/jornadas/reference) manda mais o agente fazer `read` de arquivo da árvore `instructions/` — verificação por busca no repo (grep) na reconciliação.
5. `npm run ci` verde: build, typecheck, testes unit + integração, evals de não-regressão, checks de vocabulário e higiene do dist, smoke.
