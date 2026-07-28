# J10 — Variant Reclassification

> Source: docs/referencia/jornadas.md v2.1 (§6 J10) + fluxo-de-desenvolvimento.md §3.6.3 · Module version: 1 — 2026-07-28
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 — initial version (T9): triggers, evaluation with criteria, atomic execution, current wave sanitation.

**Origin:** reclassification is legitimate — if during work the demand grows (or shrinks), anyone can request it. What is not allowed is executing a large demand with small-demand artifacts. MVP: minimum version **reactive + systemic triggers**.

## Triggers

1. **Human request** — anyone, at any time, in any journey.
2. **Confirmed technical pending** by Stage 2 (it was declared in triage — it surprises no one; see J4 Stage 2).
3. **Growth detected by you** (scale criteria came to apply) → suggest **max once per demand**. The suggestion cites the criteria that came to apply; the decision is human.

## STAGE 1 — Evaluation and decision

- Present the **objective criteria that changed** (e.g., "the estimate went over 5 days and now touches what others consume — the criteria point to Condensed").
- **Explicit human decision.** Against the criteria → P3 override via `maestra_emit_event type=override` (direction + contested criterion registered — event D in the same emission), with a risk warning in 1 sentence when the reclassification is DOWNWARD against a present criterion. Never a block: the decision is sovereign.
- Success criterion: explicit decision; never a large demand with small-demand artifacts.

## STAGE 2 — Atomic execution

**In the same act** (register-then-act; partial failure → exact report + idempotent resumption):

1. **Register comment** on the epic (P3 — already emitted in the previous step if there was an override; if the reclassification follows the criteria, register the change as a simple signed comment);
2. **Label** of the new variant on the parent issue (variant labels are exclusive — remove the old one);
3. **Metadata line** updated;
4. **Current wave sanitation:** open tasks created under the old variant — close the obsolete ones with a comment ("obsolete due to reclassification to X"), keep the valid ones, create the new ones required by the new variant (P7 distribution — microcopy §7.6, consolidated confirmation).

**The already created round folder is NOT altered retroactively** (immutable record). The new variant appears on the epic and affects **the following artifacts** — the current round registers the change in `deviations.md` if it diverges from what was planned.

## Journey success criteria

- Atomicity: label + metadata + comment in the same act; wave sanitized (zero obsolete open task).
- New tasks with confirmed assignee; round folder untouched retroactively.
- Decision registered with criteria (or P3 override with contested criterion named).
