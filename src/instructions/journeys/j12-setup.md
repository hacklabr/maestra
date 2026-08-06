# J12 — Project Setup (guided onboarding)

> Source: round R12 scope (issue #44) + fluxo-de-desenvolvimento.md §3 (first-triage artifact birth, absorbed here as an explicit route) · Module version: 1 — 2026-08-06
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 (R12, issue #44) — initial version: setup entry door, label/column mapping with proposed defaults (`Produto`/`Engenharia`/`Entrega`), `.maestra/labels.md` persistence (ADR-002), `docs/reference/` bootstrap, legacy-code documentation via delegated specialists, board reorganization as proposal-only.

**Trigger:** setup intent routed by the kernel entry router ("faz o setup", "configura o projeto/maestra", "onboarding do projeto"), or a **partial sub-intent** ("reconfigura as labels" → STAGE 1 only; "reorganiza o board" → STAGE 5 only). **Outcome:** the repository leaves the session ready to run the flow — labels and column mapping persisted, `docs/reference/` born, legacy code documented (when present), board reorganization proposed. The full route runs **once per repository**; the stages are individually invocable afterward.

**Master rule — idempotency:** everything that already exists is reused, never recreated. STAGE 0 inventories before any question or creation. Asking the human to configure what is already configured is a derivation failure (same doctrine as J1: never ask what you can read).

## STAGE 0 — Detection and inventory

`maestra_status` fresh (skip if already run this session and nothing changed). Then inventory, reading — never asking:

- `.maestra/config.md` and `.maestra/team.md` — exist? valid?
- `.maestra/labels.md` — exists? complete (all stages + all columns mapped)?
- `docs/reference/` — exists? which documents?
- Pre-existing code — source directories, manifests, commit history: is there a codebase to document, or a greenfield repo?
- Open issues on the platform — how many, any existing epic grouping?

Announce the inventory in one message ("what already exists: X; what we will create: Y") — the human sees the plan before any question.

## STAGE 1 — Stage labels and board columns

**One consolidated message** (one human decision per turn — the collection is homogeneous, batch it). You PROPOSE, the human corrects — never ask them to build from scratch:

1. **Stage labels** — proposed defaults, in the flow's language: stage 1 → `Produto`, stage 2 → `Engenharia`, stage 3 → `Entrega`. The human confirms or renames.
2. **Board columns** — read the REAL board first (P6: the column options are queried live via the platform cookbook, never from `config.md`). Propose the mapping of the four flow situations — not-started, in-progress, in-review, delivered — to what the platform actually offers (column options of the board field, or column labels, per the platform's model — the operation is in the cookbook). The human confirms or adjusts.

**Missing labels:** any confirmed label that does not exist on the platform is created via the `create-label` operation of the cookbook (idempotent — 409/already-exists means proceed). Board column fields that cannot be created via API: deliver the exact manual step to the human, never leave it implicit.

**Persistence:** the confirmed mapping lands in `.maestra/labels.md` (template in `templates/labels.md`), versioned in the repository. **Never** in `.maestra/config.md` — its parser accepts only the four ADR-014 keys and silently ignores the rest (ADR-002).

## STAGE 2 — Team and configuration

If `.maestra/team.md` or `.maestra/config.md` are missing or outdated, run the J1 STAGE 4 behavior here (microcopy §7.5, protocols §P5): proposed roles in one message, human corrects, visibility note included, file committed. Valid map → skip in silence. This stage **references** J1 STAGE 4 — it never restates it.

## STAGE 3 — `docs/reference/` bootstrap

Create the living-document skeleton (REFERENCE class — how the product is today, edited in place forever after):

- `docs/reference/prd.md` — living PRD (RF/RNF structure, acceptance criteria, out of scope).
- `docs/reference/jornadas.md` — the product's user journeys.
- `docs/reference/architecture.md` — internal architecture.
- `docs/decisions/adr/` — technical decision records (the ADR uniqueness checkpoint of J4 applies from birth).

Greenfield repo → skeletons are born near-empty, marked as living documents filled by the rounds. Pre-existing code → STAGE 4 fills them.

## STAGE 4 — Legacy code documentation (conditional: pre-existing code)

The facilitator does not write the documentation (Role rule 4): **delegate the codebase analysis to specialists** from the catalog via the host's subagent tool — architecture reading, domain mapping, evident lasting decisions. The specialists return distilled drafts; the facilitator assembles the PRD/ADRs proposal and presents it for **explicit human approval before committing** — generated documentation about code the human owns is never committed unreviewed. ADRs only for decisions with evident lasting consequence (ADR by habit = empty ceremony, J4).

## STAGE 5 — Board reorganization proposal

Read the open issues (search operation in the cookbook). Group by coherent region of change — the coupling test applies: do not separate the inseparable. Present the proposed epic grouping in **ONE consolidated message** with visible justification per group. The human confirms, edits or discards.

**Nothing is applied inside J12.** Each confirmed group enters the normal flow as its own demand (J1), where the epic is born with variant, layers and wave. Creating or relinking issues here would bypass triage — trigger #17 applies.

## STAGE 6 — Closing

Commit the created artifacts (REFERENCE class) — mechanics delegated per the tools contract. Close with the summary: what exists now, what was skipped as already-existing, what awaits human action (board groups to triage, manual column steps if any). Announce that the full setup is done once per repository and that each stage answers to its own sub-intent from now on.

## Partial invocations

| Sub-intent | Runs |
|---|---|
| "reconfigura as labels" / "remap as colunas" | STAGE 0 → STAGE 1 → STAGE 6 |
| "reorganiza o board" | STAGE 0 → STAGE 5 → STAGE 6 |
| "documenta o código legado" | STAGE 0 → STAGE 4 → STAGE 6 |

Partial runs obey the same idempotency and the same no-application rule of STAGE 5.

## Journey success criteria

- Zero recreation of existing artifacts (idempotency held); zero questions about what was readable.
- `.maestra/labels.md` persisted with all stages and columns mapped; missing labels created on the platform.
- `docs/reference/` born with the three living documents + ADR folder.
- Legacy documentation (when applicable) approved by the human before commit.
- Board reorganization presented as proposal; zero issues created/relinked inside J12.
