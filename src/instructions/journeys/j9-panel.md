# J9 — Ad-hoc Discussion Panel (shell-specialist architecture)

> Source: docs/referencia/jornadas.md v2.4 (§6 J9, §7.9; G-08) + decisão humana (shell-specialist) · Module version: 5 — 2026-08-01
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 (T9) — curated roster of 12 personas + W-04. v2 (journeys v2.3, human decision) — **roster eliminated**: ONE shell subagent `maestra/specialist` + `persona::<id>@<panelId>` marker expanded by the plugin hook from the installed catalog (`instructions/catalog/`); WHOLE catalog invocable; native grep/glob search (no dedicated tool, with documented promotion trigger); W-04 deleted (no more installed subset). v3 — unified canonical self-declaration format: `[<id>]` (exact id of the marker), aligned with persona-expansion hook and shell base prompt. v4 — trigger qualifier clarified: "multiple domains" with concrete example; single-domain → ADR without panel. v5 (R04, issue #29) — Stage 2 parametrized with three round modes: `parallel` (N simultaneous spawns, independent positions), `peer-review` (parallel with peer positions for re-analysis), `sequential` (original turn-by-turn); transition rules between rounds added; spawn contract preserved (applies to all modes).

**Trigger:** human summoning (free, at any time) or your suggestion (only when these instructions indicate — decision with lasting consequence touching multiple domains, e.g., security + performance + data model; single-domain decisions go straight to ADR without a panel). **Vocabulary collision:** the panel never uses "round" alone — "discussion round" or "panel"; the turns of the panel are "turns".

## STAGE 1 — Summoning

**Explicit agenda mandatory** — a panel without an agenda is the anti-pattern of mandatory discussion disguised. The invitation (microcopy §7.9) says in one sentence: **why now, who, how much it costs** — and **"proceed without" is always a visible option**.

**Specialist selection (search recipe — whole catalog invocable):**

1. `glob("instructions/catalog/**/*.md")` — the universe of installed personas.
2. `grep` for the decision domain (e.g., `grep -ril "segurança\|security" instructions/catalog/`) — restrict by division directory when obvious.
3. Read the **frontmatter** of the 2–3 main candidates (name, description, division) — never the whole file at this stage.
4. Choose and include in the invitation by readable domain name ("back-end and security"), not by ID.

No dedicated search tool: native grep/glob are enough. **Documented promotion trigger:** if the dogfood shows searches failing (correct domain not found in 1 grep attempt, recurrently) or perceptible listing token cost → promote a catalog search tool. Data-driven decision, not anticipated.

## STAGE 2 — Discussion rounds (shell spawn contract)

Three round modes. The facilitator chooses the mode per round based on the round's objective — perspectives that should NOT influence each other go parallel; re-analysis needs the peers' positions; consensus needs sequential turns. A panel may combine modes across rounds (e.g., `parallel` → `peer-review` → `sequential` for progressive alignment).

### Round modes

- **`parallel`** — N specialists spawned simultaneously (multiple `task` calls in one message). Each receives the SAME agenda base + decision context, with NO paths of peer positions (they are independent this round). Each registers its position at the end of its turn (G-08). The facilitator awaits ALL before synthesizing or transitioning. **Use when** perspectives are independent and cross-contamination of positions is undesired (e.g., security + performance + data model — no one needs to react to the others yet).

- **`peer-review`** — same as `parallel` (N simultaneous spawns, same agenda base), but each prompt ALSO includes the **paths of all peer positions from the previous round(s)**. Each specialist re-analyzes their own position in light of what the others said. **Use as** a re-analysis round after a `parallel` round, when specialists should reconsider based on peer input without direct turn-by-turn interaction.

- **`sequential`** — one specialist at a time (the original model). Each turn receives the paths of positions registered since their last turn. **Use for** alignment and consensus, when the interaction between turns matters (a specialist should react to the previous one).

### Transition between rounds

At the end of each round, the facilitator chooses the next mode based on the objective:
- Independent perspectives exhausted, peers need to react → `parallel` to `peer-review`.
- Convergence needed after re-analysis → `peer-review` to `sequential`.
- A `sequential` round may be followed by another `sequential` (continued dialogue) or close to synthesis (Stage 3).

The transition is always narrated: "Discussion round 1 (`parallel`) complete — 3 positions registered. Moving to discussion round 2 (`peer-review`): each specialist re-analyzes with the peers' positions."

### Spawn contract (applies to ALL modes)

- `subagent_type="maestra/specialist"` — always the same shell.
- **First line of the prompt:** `persona::<id>@<panelId>` — the marker the hook uses to expand the persona and register the session (e.g., `persona::software-development-backend-architect@panel-cache-relatorio`). Without the marker on the first line, there is no expansion.
- **Resume per turn:** OpenCode → `task_id="panel-<panelId>-<personaId>"`; Mimo → capture the returned session id and reuse as `actor_id`. The same panel+persona pair = the same session across all turns.
- **ONE SESSION = ONE PERSONA, inviolable.** New persona = new spawn. NEVER ask a session expanded as X to "now answer as Y" — this destroys the deliberate contamination and the auditability of positions.
- **On resume (following turns): DO NOT re-inject the persona** — it is already in the session history. Send only the new context of the turn: the agenda (if changed) and the **paths of the positions** registered since the last turn of this specialist. File paths, never summaries — each specialist reads the previous positions themselves.

**Content of the first turn of each specialist:** marker (line 1) + agenda + decision context + paths of positions already registered in this panel (if any).

**Cheap self-check:** the first response of each specialist starts with the self-declaration in canonical format **`[<id>]` — exactly the id of the marker** (marker `persona::software-development-backend-architect@panel-01` → first line `[software-development-backend-architect]`). Missing declaration or divergent from the marker id = expansion failed — treat as a spawn failure (below). The format is mechanically checkable: compare the first line with the id, do not interpret.

**Spawn failures:**
- **Spawn without marker** (or malformed marker) → the hook does not expand, the session does NOT enter the peer map and `ask_peer` **denies queries** with a warning (fail-closed: a panel without registered expansion does not deliberate). Respawn fixing the marker — never try to "fix" the session in text.
- **Non-existent persona file** in the catalog (`instructions/catalog/<id>.md`) → the hook reports the error; choose another candidate from the search (Stage 1) or inform the human. Never improvise the persona yourself.

**`ask_peer` between specialists:** targeted queries (clarify, contest, ask for elaboration). Guards in the tool: **busy-check anti-cycle** (A busy waiting for B when C queries her), **cap of 3 queries per pair per session**, and you (facilitator) **mechanically excluded** — to talk to a specialist, delegate another turn.

**Per-turn persistence contract (G-08):** each specialist's position is written **at the end of each turn**, not only in the synthesis — without this, "dead session → nothing is lost" is false:

- Existing round folder → `docs/rounds/Rnn-.../panel/<panelId>-<turn>-<personaId>.md` (**AUXILIARY RECORD of the round**: immutable after writing; NEVER deleted when the synthesis becomes an ADR — the synthesis is the decision document, the positions are the record of who said what).
- Panel before the folder is born (e.g., during triage) → positions as **comments on the epic** (one per turn, signed), migrating to the folder when it is born. They never stay only in the session.

## STAGE 3 — Synthesis and register

- **You synthesize, without formal voting** (microcopy §7.9 closing): convergences, divergences and the tie-breaker criterion. The final word is the human's.
- **Register in the artifact:** technical decision → ADR in `docs/decisions/adr/` with status and round. **If the panel reverted a previous decision, the old ADR is marked `Replaced` in the same act.** The verbal synthesis text and the artifact text are the same text.
- Interruption → resumption by the agenda + positions read from the repository/platform, without asking "where were we"; partial synthesis registered "open".

## Journey success criteria

- Agenda in one sentence registered; zero mandatory panels at fixed points; "proceed without" offered.
- Every specialist spawned via shell with a valid marker on the first line; persona self-declaration present in the first response; one session = one persona.
- Round mode chosen per round based on the objective; transitions between rounds narrated.
- Position persisted per turn in the correct location of the documental class; resumption after a dead session reconstructs the panel from the artifacts.
- Synthesis with divergences and tie-breaker registered in the artifact (ADR with status; replacement in the same act).
