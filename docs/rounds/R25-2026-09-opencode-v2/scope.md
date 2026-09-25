# Scope of round R25 — Suporte ao OpenCode V2 (entrypoint duplo V1/V2)

> Epic: (sem epic — demanda de texto livre aprovada em sessão direta em 2026-09-24)
> Variant: Minimal (modo direto)
> Origem: o OpenCode V2 quebra deliberadamente a API de plugins V1 ("V1 plugin
> implementations do not run in V2" — doc de migração oficial). O Maestra é
> carregado como plugin V1 e precisa de uma segunda geração de adapter mantendo
> V1 (≥ 1.18.29) vivo. Decisão da mesma sessão: **Mimo Code é deprecado** (sem
> investimento de teste; remoção futura via ROADMAP).

## Variant

minimal

## Requirements introduced

- RF-75 — **Entrypoint duplo**: `dist/index.js` exporta por default um objeto
  com `id: "maestra"`, `setup(ctx)` (V2) e `server(input)` (V1 ≥ 1.18.29).
  `Plugin.define` é identidade pura — o entrypoint usa **import type-only** de
  `@opencode/plugin` (devDependency): nenhuma dependência runtime nova além de
  `zod-to-json-schema`.
- RF-76 — **Tools V2 via `ctx.tool.transform`**: as 5 ferramentas
  (`maestra_status`, `maestra_issue_digest`, `ask_peer`, `maestra_emit_event`,
  `maestra_read_instructions`) são registradas com JSON Schema derivado do zod
  (fonte única do contrato, spec D1) e resultado `{content, metadata}`
  (`Tool.Result.content` aceita `string`). Nomes exatos preservados — os
  markdowns de agent e as instruções os referenciam; sem `editor.namespace()`.
- RF-77 — **Hooks V2**: `ctx.tool.hook("execute.before")` (persona-expansion,
  mutando `event.input`), `ctx.tool.hook("execute.after")` (peer-tracker +
  desvios, mutando `event.result` por substituição) e banner via
  `ctx.session.hook("context", …)` — apenas `"context"` (decisão: equivalente
  ao `experimental.chat.system.transform` V1, sem custo em title/generate).
  A união de ferramentas de spawn passa a casar `task | actor | subagent` ×
  `subagent_type | agent` (no V2 o spawn é `subagent`; `task` é alias
  deprecado — verificado no OpenAPI V2).
- RF-78 — **ask_peer V2 (PeerSessionApi)**: seam host-agnômico com uma
  implementação por geração. V2: `ctx.session.prompt` → `wait` → `context()`
  para coletar a resposta do peer (o `prompt` V2 retorna admissão, não
  resposta); busy-check heurístico via `session.get()` comparando
  `time.idle < time.updated`. O `PromptInput` V2 **não** aceita mapa de tools
  (verificado nos tipos) — a proibição de delegação durante a resposta vira
  instrução textual no prompt de consulta (válida também no V1, onde
  `tools: {task:false, …}` continua sendo aplicada mecanicamente).
- RF-79 — **Installer**: para o host opencode em dev checkout, além da chave
  legacy `plugin` (mantida para V1 — o V2 a rejeita com WARN cosmético
  "must be a directory"), o installer grava o **shim de discovery**
  `<config>/plugins/maestra.js` re-exportando o entrypoint duplo — forma
  nativa de carga do V2, validada ao vivo (F054). Dedup lê as chaves
  `plugin` **e** `plugins`; instalações npm seguem com o nome do pacote.
  `--host mimocode` emite aviso de deprecação.

## Requirements changed

- `src/index.ts` — deixa de ser função V1; vira o objeto duplo (RF-75). O corpo
  atual migra para `src/v1-entry.ts` (`buildV1Hooks`) sem mudança de
  comportamento.
- `src/tools/ask-peer.ts` — o client SDK V1 vira implementação default de
  `PeerSessionApi` (`setSdkClient` preservado — seam usada pelos testes);
  novo `setPeerApi` usado pelo entry V2. Gates 1–4 e limits inalterados.
- `src/hooks/peer-tracker.ts` e `src/hooks/persona-expansion.ts` — matching de
  spawn extraído para helper compartilhado (união RF-77); extração de
  session-id aceita `sessionId | actor_id | sessionID`.

## Requirements discontinued

- (nenhum — Mimo segue best-effort, deprecado, sem remoção nesta round)

## Out of scope for this round

- Remoção efetiva do suporte a Mimo Code (ROADMAP, com gatilho).
- `ctx.storage` para estado de peers (a semântica é de sessão, não durável).
- Hooks V1 tipados mas não usados (`permission.ask`, `tool.definition`).
- Verificação automatizada da matriz V1×V2 em CI (checklist manual no README;
  automatizar é candidato a round futura).
- RPC/CLI plugins V2 (`./rpc`, TUI).

## Acceptance criteria (do briefing aprovado)

1. `npm run ci` verde (build, typecheck, test, vocab, dist-hygiene, smoke,
   eval:dry).
2. O default export carrega nos dois shapes: objeto com `id`/`setup`/`server`
   (unit + perna V2 do smoke sobre `dist/`).
3. Unit: setup V2 com ctx mockado registra 5 tools com JSON Schema válidos
   (required corretos) + 2 hooks de tool + banner em `context`; adaptação de
   resultado preserva `metadata`; `ask_peer` V2 coleta a resposta via
   wait+context e busy-check responde `idle < updated`.
4. Compat V1 preservada: testes existentes de ask-peer (via `setSdkClient`),
   persona-expansion e desvios permanecem verdes sem reescrita.
5. smoke: perna V2 valida registro, mutação de `event.result` (append desvios)
   e banner sobre o build real.
6. Docs atualizadas: CHANGELOG 1.6.0, README (seção V2 + deprecação Mimo),
   ROADMAP (gatilho de remoção Mimo), AGENTS.md.
