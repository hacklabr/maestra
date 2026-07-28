# Eval harness — workflow plugin

Binding condition of the project (spec D7): **harness or no-dogfood**. The plugin
is ~20% deterministic code and ~80% behavior in instructions — this is the
only verification for most of the 16 anti-bypass items.

## Architecture (3 tiers)

| Tier | What | Where it runs |
|---|---|---|
| **1 — deterministic** | tool-call order, question counting, P3/P4 regexes, hard-fails #2/#3/#13, refusal structure | PR gate (every PR) |
| **2 — LLM-as-judge** | versioned rubric (`lib/rubric.md`), binary per item | nightly |
| **3 — golden transcripts** | STRUCTURAL diff (never byte) with human-reviewed baseline | on demand / instructions change |

The **custom provider** (`providers/maestra-agent.mjs`) drives the agent loop with
**deterministic stubbed tools** (`lib/stub-tools.mjs`): `maestra_status`,
`maestra_issue_digest` and `maestra_emit_event` respond from fixtures; `bash` routes
via regex to recorded outputs (mutations have generic recorded success; reads
without a route fail with 127 — fixture bug, never silent data); `read`/`write`
operate on a virtual fs from the repo fixture. The full transcript comes back as JSON
and the asserts inspect it.

## Running

```bash
npm run eval:dry       # mock model — proves the pipeline WITHOUT a live model (green now)
npm run eval           # PR gate: tier-1, core battery, cache ON  (live model)
npm run eval:nightly   # full matrix + judge, --no-cache          (live model)
npm run eval:golden    # structural diff of golden transcripts    (live model)
npm test               # includes the harness self-test (evals/__tests__)
```

Live model (any OpenAI-compatible endpoint):

```bash
export MAESTRA_EVAL_MODEL=gpt-4o-mini
export MAESTRA_EVAL_BASE_URL=https://api.openai.com/v1
export MAESTRA_EVAL_API_KEY=...
```

Temperature pinned at 0. **Flaky eval = bug**: 24h quarantine with linked issue;
never retry to mask instructions regression.

## The 16 anti-bypass battery (mapping)

| # | Item | Scenario | Main guard |
|---|---|---|---|
| 1 | Sycophancy in triage | AB-01 (Tiago) | override→mutation order + evidence |
| 2 | Never draft an answer | AB-02 + J8 (Débora, 5 variants) | forbiddenPatterns |
| 3 | Approval lock | AB-03 (Paula) | hard-fail `approval-lock` |
| 4 | Criteria + out of scope 100% | AB-04 | resistance + override |
| 5 | Executable task without questions | AB-05 | requiredPatterns (template) |
| 6 | Verified derivation | AB-06 + J2 (B1–B6) | digest first; falsifiable summary |
| 7 | Feedback never absorbed | AB-07 | requiredPatterns feedback |
| 8 | Characterization + baseline | AB-08 | forbiddenPatterns |
| 9 | Worktree 100% | AB-09 | hard-fail `worktree` |
| 10 | Verdict by criterion | AB-10 | requiredPatterns |
| 11 | Inverted metrics | AB-11 (+ `maestra-report` — outside runtime) | requiredPatterns |
| 12 | Refactor↔feature disguise | AB-12 | requiredPatterns |
| 13 | Reconciliation = gate | AB-13 | hard-fail `close-entregue` |
| 14 | Vague deviation rejected | AB-14 (+ desvios.md hook, unit) | requiredPatterns in files |
| 15 | Executed evidence | AB-15 | hard-fail `evidence-before-verdict` |
| 16 | Contradiction → doc-bug | AB-16 | order + label |

Additional scenarios: `j1-triagem.yaml` (calibration: ≤3/turn, ≤5 total, ≤3
Minimal, PO rule of thumb, dedup, **Full Q2 + funnel slice with P7 wave**),
`j2-retomada.yaml` (B1–B6), `j8-guarda.yaml` (refusal with 5 principles;
Débora/Tiago/Paula arcs), `fm-vinculantes.yaml` (**FM-04, FM-06, FM-12,
FM-21** — binding scope of dogfood #1, Guardian V-4 + eval side of
V-2; FM-13 is covered by maestra-report + J2 B6), `j9-mesa-shell.yaml`
(**SH-01..05** — shell-specialist architecture: spawn without fail-closed marker,
missing/divergent persona declaration, one session = one persona
(adversarial), resume without re-injection, isolation per panel; the
ask_peer routing gate itself is a unit test in `src/__tests__/ask-peer.test.ts`).

Structural asserts beyond the battery: `two-layer-issues.mjs` (issue bodies
in two P1 layers — acceptance criterion #8) and the hard-fail rule
`assignee-after-confirmation` (creation with assignee only after consolidated
confirmation P7 — acceptance criterion #9), both with unit tests in the
harness self-test.

Adapter contract: `src/platform/__tests__/contract.test.ts` — a SINGLE suite
run against both implementations (parity by construction; the
twin files keep only each platform's gotchas).

## Corpus rules

- **Every real dogfood failure becomes a fixture + scenario** (continuous harvest).
- Fixtures are factory-built (`*.json` in `fixtures/`); failure fixtures are
  first-class.
- New scenario for an undecided gap (G-xx) = linked pending requirement,
  never a skipped test without an issue.
- The judge rubric is versioned in this repository (`lib/rubric.md`) with
  a changelog; pinned judge, temperature 0.
- Golden baselines are NEVER auto-accepted — mandatory human review
  (manual `--update`).
