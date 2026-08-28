# J12 — Project Setup (guided onboarding)

> Source: round R12 scope (issue #44) + round R13 scope (issue #46) + fluxo-de-desenvolvimento.md §3 (first-triage artifact birth, absorbed here as an explicit route) · Module version: 2 — 2026-08-11
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 (R12, issue #44) — initial version: setup entry door, label/column mapping with proposed defaults (`Produto`/`Engenharia`/`Entrega`), `.maestra/labels.md` persistence (ADR-002), `docs/reference/` bootstrap, legacy-code documentation via delegated specialists, board reorganization as proposal-only. v2 (R13, issue #46) — STAGE 5 "Agentic organization" added (agent-guidance layer: AGENTS.md router, skills catalog, architecture INDEX, ADR template, conventions; legacy refactor with diff checkpoint; pattern-based candidate skills, experimental; continuous-evolution rule); former STAGEs 5–6 renumbered to 6–7; STAGE 0 inventory extended with stack-manifest reading and existing agent configs. v3 (R15, issue #49) — STAGE 0 inventory + STAGE 1 item 3: post-PR/MR workflow (`close | qa`, default `close`; QA Specialty reference + approval column confirmed from the real board) persisted in `workflow.md` on branch `__maestra_config__` via `maestra-config write workflow.md` (ADR-004/ADR-003), never in `config.md`, never in the working tree; partial invocation "reconfigura o workflow pós-PR/MR" added. v4 (R18, issue #54) — STAGE 0 inventory + STAGE 1 item 3 extended to the PR/MR topology (`pr-topology: epic-branch | direct`, default `epic-branch` — ADR-006; opt-out `direct` confirmed in the same act when the team prefers direct PRs/MRs); same file, same vehicle.

**Trigger:** setup intent routed by the kernel entry router ("faz o setup", "configura o projeto/maestra", "onboarding do projeto"), or a **partial sub-intent** ("reconfigura as labels" → STAGE 1 only; "reorganiza o board" → STAGE 6 only; "organiza a camada agêntica" → STAGE 5 only; "reconfigura o workflow pós-PR/MR" → STAGE 1, workflow item, only). **Outcome:** the repository leaves the session ready to run the flow — labels and column mapping persisted, `docs/reference/` born, legacy code documented (when present), agent-guidance layer organized (`AGENTS.md`, skills, indexes), board reorganization proposed. The full route runs **once per repository**; the stages are individually invocable afterward.

**Master rule — idempotency:** everything that already exists is reused, never recreated. STAGE 0 inventories before any question or creation. Asking the human to configure what is already configured is a derivation failure (same doctrine as J1: never ask what you can read). Every artifact skipped because it already exists is logged in the act (`preserved: <path>`) and listed in the closing summary — preservation is reported, never silent.

## STAGE 0 — Detection and inventory

`maestra_status` fresh (skip if already run this session and nothing changed). Then inventory, reading — never asking:

- `config.md` and `team.md` on branch `__maestra_config__` (`maestra-config read <file>` — ADR-003) — exist? valid?
- `labels.md` (same branch) — exists? complete (all stages + all columns mapped)?
- `workflow.md` (same branch, root — `maestra-config read workflow.md`; ADR-003/ADR-004) — exists? valid (mode `close|qa` and approval column resolvable; topology `epic-branch|direct` resolvable — ADR-006)?
- `docs/reference/` — exists? which documents?
- Pre-existing code — source directories, manifests, commit history: is there a codebase to document, or a greenfield repo?
- **Stack manifests** — `package.json`, `go.mod`, `pyproject.toml`, `pom.xml`, `composer.json`, `Cargo.toml` etc. Extract the REAL build/test/lint/typecheck commands (e.g., the `scripts` section of `package.json`, the `Makefile` targets). Undetectable stack or missing command → explicit `<!-- TODO: preencher -->` placeholder, never an invented generic command.
- **Existing agent-guidance configs** — `AGENTS.md`, `CLAUDE.md`, `.cursor/rules`, `.windsurf/`, Copilot-instructions files and equivalents. They are SOURCES to read and consolidate, never files to overwrite silently.
- Open issues on the platform — how many, any existing epic grouping?

Announce the inventory in one message ("what already exists: X; what we will create: Y") — the human sees the plan before any question.

## STAGE 1 — Stage labels and board columns

**One consolidated message** (one human decision per turn — the collection is homogeneous, batch it). You PROPOSE, the human corrects — never ask them to build from scratch:

1. **Stage labels** — proposed defaults, in the flow's language: stage 1 → `Produto`, stage 2 → `Engenharia`, stage 3 → `Entrega`. The human confirms or renames.
2. **Board columns** — read the REAL board first (P6: the column options are queried live via the platform cookbook, never from `config.md`). Propose the mapping of the four flow situations — not-started, in-progress, in-review, delivered — to what the platform actually offers (column options of the board field, or column labels, per the platform's model — the operation is in the cookbook). The human confirms or adjusts.
3. **Post-PR/MR workflow** — proposed default `close` (acceptance closes the task — teams without formal QA change nothing). If the team runs post-merge QA in a test environment, set `qa` and confirm, in the same message: the QA Specialty reference (who receives the assignment — `team.md`, P5) and the QA approval column (read from the REAL board — P6). **PR/MR topology** (ADR-006) — proposed default `epic-branch` (daughter task PRs/MRs target an epic integration branch; the epic integrates as a unit); if the team prefers direct PRs/MRs to the integration branch, set `direct` — the opt-out is confirmed in the same message.

**Missing labels:** any confirmed label that does not exist on the platform is created via the `create-label` operation of the cookbook (idempotent — 409/already-exists means proceed). Board column fields that cannot be created via API: deliver the exact manual step to the human, never leave it implicit.

**Persistence:** the confirmed mapping lands in `labels.md` on branch `__maestra_config__` via `maestra-config write labels.md` (template in `templates/labels.md` — ADR-003). The confirmed post-PR/MR workflow lands in `workflow.md` on the SAME branch via `maestra-config write workflow.md` (template `templates/workflow.md` — ADR-004, parallel to `labels.md`; no working-tree copy exists). **Never** in `config.md` — its parser accepts only the four ADR-014 keys and silently ignores the rest (ADR-002).

## STAGE 2 — Team and configuration

If the team map or `config.md` are missing or outdated on `__maestra_config__`, run the J1 STAGE 4 behavior here (microcopy §7.5, protocols §P5): proposed roles in one message, human corrects, visibility note included, persisted via `maestra-config write`. Valid map → skip in silence. This stage **references** J1 STAGE 4 — it never restates it.

## STAGE 3 — `docs/reference/` bootstrap

Create the living-document skeleton (REFERENCE class — how the product is today, edited in place forever after):

- `docs/reference/prd.md` — living PRD (RF/RNF structure, acceptance criteria, out of scope).
- `docs/reference/jornadas.md` — the product's user journeys.
- `docs/reference/architecture.md` — internal architecture.
- `docs/decisions/adr/` — technical decision records (the ADR uniqueness checkpoint of J4 applies from birth).

Greenfield repo → skeletons are born near-empty, marked as living documents filled by the rounds. Pre-existing code → STAGE 4 fills them.

## STAGE 4 — Legacy code documentation (conditional: pre-existing code)

The facilitator does not write the documentation (Role rule 4): **delegate the codebase analysis to specialists** from the catalog via the host's subagent tool — architecture reading, domain mapping, evident lasting decisions. The specialists return distilled drafts; the facilitator assembles the PRD/ADRs proposal and presents it for **explicit human approval before committing** — generated documentation about code the human owns is never committed unreviewed. ADRs only for decisions with evident lasting consequence (ADR by habit = empty ceremony, J4).

**Pattern capture for STAGE 5.3:** when this stage runs, the SAME delegated analysis also returns the recurring code patterns it observed (what repeats across modules, with the file paths as evidence). No extra delegation — the pattern report rides on the analysis already being done.

## STAGE 5 — Agentic organization

The reference layer (STAGEs 3–4) documents the PRODUCT. This stage organizes the AGENT-GUIDANCE layer: what an agent reads first, which procedures exist as skills, and where each document lives. It **complements** the existing structure — it never recreates or duplicates what STAGEs 3–4 (or the human) already produced.

### 5.1 — Scaffold (greenfield and legacy)

Generate each artifact below, skipping-and-logging (`preserved: <path>`) whatever already exists:

- **`AGENTS.md`** (template `templates/agents-md.md`) — short and dense (max ~250 lines), with the seven sections of the template: project context, verifiable commands, structure map, inviolable rules, conventions, expected workflow, pointers. The AGENTS.md **points** to the docs; it never copies their content. Always-active rules live here; procedures live in skills. Build/test/lint/typecheck commands come from the STAGE 0 manifest reading — real commands, never generic placeholders (undetectable → `<!-- TODO: preencher -->`).
- **`.agents/skills/exemplo-skill/SKILL.md`** (template `templates/skill.md`) — the reference skill demonstrating the format: header whose description states explicitly WHEN the skill activates, prerequisites, numbered steps, done checklist.
- **`docs/reference/arquitetura/INDEX.md`** (template `templates/architecture-index.md`) — router table (`| Documento | Conteúdo | Quando ler |`) with one line per architecture document: the STAGE 3–4 output, the runbooks, and a reference to `decisions/`. "Quando ler" orients the agent to load the doc only when relevant ("Antes de alterar regras de negócio", "Antes de mexer em integrações"). If an INDEX.md already exists: do NOT edit or overwrite it — coverage gaps go to the closing gap analysis instead.
- **`docs/reference/arquitetura/runbooks/`** — operation docs (deploy, rollback, incidents), born from the inline skeleton (purpose, preconditions, steps, rollback-of-the-runbook) or as TODO placeholders when the operation is not yet defined.
- **`docs/reference/decisions/0000-template-adr.md`** — the ADR template of the TARGET project: Status (`proposto` / `aceito` / `substituído por ADR-NNNN`), Contexto, Decisão, Consequências. Sequential 4-digit numbering: the next ADR is the existing maximum + 1 — existing ADRs are never renumbered or altered. The template registers the immutability rule: accepted ADRs are immutable; a new decision creates a NEW ADR that references the replaced one. (Vocabulary note: `aceito` ≈ `Current`, `substituído por` ≈ `Replaced by` of the plugin's internal `templates/adr.md`; the J4 uniqueness checkpoint applies in projects running the flow.)
- **`docs/reference/conventions/`** — `code-style.md`, `git-workflow.md`, `api-design.md`, born from detected convention signals (`.eslintrc`, `.editorconfig`, formatter configs, CI pipelines, commit history) or with `<!-- TODO: preencher -->` placeholders when there is nothing to derive from.

**Doc header rule:** every generated doc carries at the top the creation date, a `última revisão` field, and the standing rule that a stale doc must be fixed or marked obsolete — never left silently rotting.

Greenfield → skeletons with TODO placeholders. Legacy → content derived from the STAGE 4 analysis (approved there) and the STAGE 0 inventory.

### 5.2 — Refactor of existing agent guidance (conditional: pre-existing agent configs)

The human may have edited these files by hand — **no silent rewrites, ever**:

1. Read the existing agent configs (STAGE 0 inventory). Classify each block: **always-active rule** (stays in AGENTS.md) × **procedure** (repeatable, multi-step, or high error cost → candidate skill).
2. Present the move plan as a **diff checkpoint** — per block: what leaves the AGENTS.md, where it lands, and the criterion cited ("this is a 6-step deploy procedure → skill"). **Explicit approval before ANY rewrite.**
3. Divergent equivalent configs (e.g., `CLAUDE.md` contradicting `AGENTS.md`): consolidate into `AGENTS.md` as the single source of truth; the alias/symlink question is asked ONCE, consolidated ("create the alias, or only suggest it?").
4. Approved procedures become skills generated from `templates/skill.md` in `.agents/skills/<nome>/SKILL.md`, with a pointer line added to the AGENTS.md pointers section.

### 5.3 — Candidate skills from code patterns (experimental; legacy only)

Using the pattern report of STAGE 4, draft candidate skills from `templates/skill.md`. **No numeric cap — a quality bar instead.** A strong candidate is a pattern with:

- **more than 3 recurrences** in the code, with the file paths cited as evidence, AND
- **non-obvious** execution — an agent would NOT get it right by default (if any agent already does it correctly unaided, it does not need a skill);
- **high error cost** may qualify a pattern at the recurrence boundary — justify explicitly.

Each candidate is presented with its evidence; approval is explicit per candidate (batch approval in one consolidated message is accepted). Approved candidates are generated into `.agents/skills/` and registered in the AGENTS.md pointers section. This sub-stage is **experimental**: depth per ecosystem (archetype libraries, quality evals of generated skills) is out of scope and tracked as a future-round trigger.

### 5.4 — Continuous evolution (standing rule in the template)

The AGENTS.md template carries the standing rule: consolidated decisions and patterns that EMERGE in daily work (the module architecture gets defined, a dashboard widget convention stabilizes) are PROPOSED as skills when they meet the same criterion (repeatable, multi-step, or high error cost — and non-obvious). The setup bootstraps the layer; the project keeps it alive.

## STAGE 6 — Board reorganization proposal

Read the open issues (search operation in the cookbook). Group by coherent region of change — the coupling test applies: do not separate the inseparable. Present the proposed epic grouping in **ONE consolidated message** with visible justification per group. The human confirms, edits or discards.

**Nothing is applied inside J12.** Each confirmed group enters the normal flow as its own demand (J1), where the epic is born with variant, layers and wave. Creating or relinking issues here would bypass triage — trigger #17 applies.

## STAGE 7 — Closing

Commit the created artifacts (REFERENCE class) — mechanics delegated per the tools contract. Close with the summary:

- **Files created** (with paths);
- **Files preserved** — everything skipped as already-existing, with the `preserved:` log lines;
- **Gap analysis bounded to the agent-guidance layer** — detected signals without matching docs (e.g., "`.eslintrc` exists but `conventions/code-style.md` was not generated"), INDEX.md coverage gaps (when a pre-existing INDEX was preserved), divergences found between equivalent agent configs. Suggestions only — the human decides what to apply; broad project best-practices audit (CI, test coverage, pre-commit) is NOT part of this stage;
- **Next steps** — e.g., "review INDEX.md", "fill ADR-0001 with the next technical decision", "confirm the board groupings as demands".

Announce that the full setup is done once per repository and that each stage answers to its own sub-intent from now on.

## Partial invocations

| Sub-intent | Runs |
|---|---|
| "reconfigura as labels" / "remap as colunas" | STAGE 0 → STAGE 1 → STAGE 7 |
| "reconfigura o workflow pós-PR/MR" | STAGE 0 → STAGE 1 (workflow item: post-acceptance mode + pr-topology) → STAGE 7 |
| "reorganiza o board" | STAGE 0 → STAGE 6 → STAGE 7 |
| "documenta o código legado" | STAGE 0 → STAGE 4 → STAGE 7 |
| "organiza a camada agêntica" | STAGE 0 → STAGE 5 → STAGE 7 |

Partial runs obey the same idempotency and the same no-application rule of STAGE 6.

## Journey success criteria

- Zero recreation of existing artifacts (idempotency held, with `preserved:` log); zero questions about what was readable.
- `labels.md` persisted on `__maestra_config__` with all stages and columns mapped; missing labels created on the platform.
- `docs/reference/` born with the three living documents + ADR folder.
- Legacy documentation (when applicable) approved by the human before commit.
- Agent-guidance layer born (AGENTS.md with real stack commands, exemplo-skill, INDEX.md with "Quando ler" filled, `0000-template-adr.md` without numbering conflicts, conventions/) — or each gap explicitly logged as preserved/TODO.
- Legacy agent-config refactor (when applicable) done ONLY through diff checkpoint + explicit approval; zero silent rewrites.
- Candidate skills proposed only with >3 evidenced recurrences (or justified high error cost) and never for obvious behavior; zero skill generated without explicit approval.
- Board reorganization presented as proposal; zero issues created/relinked inside J12.
