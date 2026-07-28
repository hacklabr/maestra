# Roadmap — maestra

> Everything that was left **out of the MVP**, with the **objective trigger** that takes each item out of the drawer and the **origin** of the decision (spec or specialist consensus). A roadmap without a trigger is where feedback goes to die — no item here is "we'll see one day".
>
> References: specification (`.mesa/sessions/202607262135_05fe_plugin-fluxo-desenvolvimento/specification.md`, section "Roadmap" + D1 "Phase 2" + D7) and `docs/reference/journeys.md` v2.1.

---

## 1. Phase 2 — items with a written trigger

Items already analyzed and deferred with a trigger defined in the specification. When the trigger fires, the item enters the next cycle — no new scope discussion.

| Item | What it is | Objective trigger | Origin |
|---|---|---|---|
| `move_board_card` | Dedicated tool for moving a card on the board (today: operation via instructions + CLI, with graceful degradation P6) | **Environment with board write scope.** Today the GitHub token has `read:project` → the tool would fail-open and generate false confidence. Only enters when the dogfood environment has confirmed write scope | Spec D1 (phase 2) + Risks |
| `reconciliation_evidence` | Tool that runs and attaches reconciliation evidence (diffs, greps) to round closure | **First round closure in dogfooding.** Low marginal cost: `validateDesvios` already exists (hook); the rest are verifications the agent currently runs via instructions | Spec D1 (phase 2) |
| `record_override` standalone | Autonomous override-registration tool (today: **folded** into `maestra_emit_event` with `type=override`) | **Event D showing ordering violations** (override applied before registration, or registration without the three atomic places). As long as the fold respects the register-then-act order, there's nothing to extract | Spec D1 (rejected with rationale) + Roadmap |
| Event C clustering + A–F trend analytics | Aggregated analysis of instrumentation events: grouping of "I don't know" by criterion (event C) to recalibrate triage, and A–F event trends across rounds | **Minimum data mass: ≥5 closed and reconciled rounds with A–F events emitted** (below that, trend is statistical noise) | Journey workshop consensus (section 7 — instrumentation) + spec D7 (instrumented dogfooding) |

---

## 2. Larger roadmap — structural items

| Item | What it is | Objective trigger | Origin |
|---|---|---|---|
| Cross-round feedback consolidation | The sub-stage of section 10 of the workflow: Stage 1 owner reviewing, each cycle (biweekly), `product-feedback` issues + round retros and turning recurrences into PRD adjustment, templates, triage criteria or process. **Already in the MVP:** `retro.md` per round (mandatory in reconciliation) + event emission. What's missing is the consolidation between rounds | **≥3 rounds with `retro.md` filled in** — before that there's no recurrence to consolidate | Briefing (non-MVP scope) + workflow section 10 + spec Roadmap |
| ~~Complete catalog as subagents~~ | **RESOLVED BY DESIGN (design A, human decision):** ONE shell subagent (`maestra/specialist`, non-hidden, nearly empty) replaces the curated subset — the persona is injected on demand in the delegation prompt from the greppable catalog. Cost: 1 line in the enum (~60 tokens/msg) instead of 12+. Requires no change in Mimo | — (resolved) | Human decision + feasibility research (OC `describeTask` `registry.ts:260` doesn't filter hidden; Mimo `actor` enum filters `!hidden`) |
| Persona via `experimental.chat.system.transform` | Today the persona travels as the first user message of the shell session (works on both hosts). Upgrade: append to system prompt via hook keyed on `sessionID` (present on both hosts on the regular path — OC `session/llm/request.ts:70`, Mimo `session/llm.ts:291`) | **Dogfood evidence that the persona in user-message is disobeyed or diluted** in the panel | Feasibility research (Q3/Q4) |
| Catalog search tool (`maestra_catalog_search`) | Today: grep/glob recipe over `instructions/catalog/` (substrate installed by the installer). No tool — toolset discipline | **Dogfood showing wrong/slow persona selection ≥2× due to lack of structured search** (instrumentation event or retro finding) | Design A (no search tool) + Mesa `list_specialists` pattern as reference |
| Native GitLab Premium epics | Hierarchy via native GitLab epics instead of the canonical mapping (epic-as-issue + `relates_to` links + tasklist) | **Real adoption of the plugin in an organization with GitLab Premium.** The adapter capability probe already prepares the ground — never require Premium | ADR-011 + spec Roadmap |

---

## 3. Known technical debt

Consciously accepted limitations in the MVP. Not a product roadmap — engineering pendings with scheduled verification.

| Debt | Description | When to fix |
|---|---|---|
| Pagination >100 | Adapter listings (`listChildren`, `listComments`) truncate at 100 items per page | When a real epic exceeds the limit (the digest should signal truncation until then) |
| Unverified `glab` flags | The GitLab CLI commands and flags used by the adapter/cookbook were written against documentation, not against a real authenticated `glab` | **First real GitLab pilot** (after P1 of dogfooding — spec D6: GL "unverified" until pilot) |
| GH `/parent` endpoint | The REST endpoint for reading the parent of a sub-issue on GitHub needs confirmation against the real API | First smoke/dogfood run with real sub-issues on GitHub |
| `external_directory` on real host | The smoke test verifies the generated frontmatter structure, but effective honoring of `external_directory` by the host is only confirmed on a real install | First install on real OpenCode and first on real Mimo Code (4-cell smoke: 2 hosts × 2 platforms) |

---

## 4. The validation path (from here to 1.0)

1. **Evals with real model before any dogfooding** — binding condition of the specification (D7): *harness or no-dogfood*. Green 16 anti-bypass battery in 3 passes, tier-1 in CI on every instructions change.
2. **Progressive dogfooding** — P0: J1+J2 · P1: Minimal/Condensed with reconciliation since the first dogfood · P2: J5+J8 · P3: Technical/Full. Initial projects: WordPress, Mapas Culturais, bug fixes. Primary dogfood on GitHub; GitLab validation via CI contract + first real pilot after P1.
3. **"Validated in use" variant only after 3 real reconciled cycles** each — a cycle only counts as real if it closes **with reconciliation** (round delivered without reconciliation is round not delivered).
4. **Version 1.0 when the entire company's operation migrates to the plugin** (success criterion #1 of the briefing) — at that point, candidate for distribution as free software.

---

## 5. What does NOT enter (closed decisions)

To avoid recurring reopening:

- **Formal consensus vote in the panel** — the facilitator synthesizes; briefing decision.
- **Multiple agents per persona** — single facilitator agent; briefing decision.
- **`ask_peer` for the facilitator** — structurally closed by caller-identity (spec D8.2).
- **Local state outside the repository** — the issue platform is the memory; mirror is deletable cache.
- **GitLab work-items as dependency** — experimental; forbidden (ADR-011).
