# Retrospective of round R05 — modo direto

## What went well

- **Direct mode design** — the kernel specialization pattern (lean bootstrap
  pointing to a variant kernel that reuses existing journeys) kept the
  implementation surface small: 1 new instruction file + 1 new function + 4
  file touches. No duplication of flow logic.
- **Single-session flow** — collapsing async gate boundaries into synchronous
  turn boundaries is a clean conceptual model that preserves all anti-bypass
  triggers without ceremony overhead.

## Process signals

- **Tool retry (dogfooding):** `maestra_emit_event` payload field names in
  `reference/instrumentation.md` diverge from the actual zod schema
  (`type` vs `override_type`, `contested_criterion` vs `disputed_criterion`,
  `stated_reason` vs `declared_reason`). Required 2 attempts to register the
  override. Trigger #16 — doc×code contradiction. Should be filed as doc-bug.
- **Uncommitted working copy state:** the main repo working directory had
  uncommitted changes (F027 fix in `maestra-agent.ts` + corresponding tests)
  that were invisible to the worktree. The worktree was created from the
  committed state (c161282), which has the older version. Not a blocker for
  this round (the additions are purely additive), but worth noting for the
  merge.
- **Specialist delegation:** clean handoff — the specialist read the existing
  code, followed patterns, and produced additive changes. Build + tests passed
  on first run.

## Assumptions to validate in dogfooding

- The direct kernel instruction (`maestra-direct-kernel.md`) has not been
  tested with a real session yet — the anti-bypass triggers are inherited
  verbatim but the collapsing of gates into turn boundaries is novel.
- The installer correctly generates `maestra-direct.md` on both hosts — verified
  by build + unit tests, but not yet exercised in the 4-cell smoke test.
