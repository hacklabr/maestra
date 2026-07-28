# Template — Definition of Ready (summary for quick reference)

> Source: fluxo-de-desenvolvimento.md §11.7 (+ §6 Stage 1 exit gate) · Module version: 1 — 2026-07-28
> Anti-drift: verbatim from the source. In the Stage 1 persona (PO), "DoR" is a forbidden term (P4) — say "the package that needs to be ready for Engineering to start".

## Stage 1 gate checklist (fluxo §6 — item-by-item verification)

- [ ] Round briefing (problem, context, success metrics, constraints)
- [ ] Reference PRD updated with identified requirements (RF/RNF)
- [ ] Business rules documented
- [ ] Explicit out of scope
- [ ] Journeys + user stories with acceptance criteria
- [ ] Round scope defined (`scope.md` with the round's RFs/RNFs)
- [ ] **Preliminary feasibility assessment:** at least one Stage 2 person participated in the validation

## Mandatory table per variant (fluxo §11.7)

| Artifact | Mandatory? |
|---|---|
| Round briefing (record) | Yes (Full variant; mini-briefing in Condensed) |
| Reference PRD updated with RF/RNF | Yes (Full/Condensed; issue in Minimal) — **per round** |
| Explicit out of scope | **Yes — always** |
| Acceptance criteria | **Yes — always, in all variants** |
| Reference journeys | Full: yes; Condensed: only the affected ones |
| Round scope (`scope.md`) | Yes |
| Stage 2 feasibility assessment | Yes |
| Prototype/wireframes | If there is UI |

**Application rules:**
- In the Condensed and Minimal variants the package is reduced proportionally (matrix 3.5) — **but acceptance criteria and out of scope never leave** (anti-bypass #4: blocking, 100%).
- **Gate met = all Stage 1 artifact tasks closed** — verified one by one (never inference). A closed artifact task whose artifact does not exist in the repository **does not count**.
- The feasibility assessment is asynchronous by nature: assign + comment mentioning the Stage 2 person + close the turn gracefully — never hold the human waiting nor simulate the assessment.
- Attempt to skip the gate → P3 override with scaled defense (microcopy §7.1/§7.4).
