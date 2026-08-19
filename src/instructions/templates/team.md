# Template — Team map (`team.md` on branch `__maestra_config__`)

> Source: docs/referencia/jornadas.md §5 P5 (v2.1); location per ADR-003 · Module version: 2 — 2026-08-18
> Anti-drift: fixed structure for agent reading (routing and P7 distribution). Contains PERSONAL DATA — write with the horizon that, if the repository becomes public, the content becomes public.

```markdown
# Team — facilitator map
<!-- Conversation route and task distribution — NOT hierarchy.
     Minimal data: coarse seniority only (junior/mid/senior);
     never salary, performance review or sensitive data.
     Lives on the __maestra_config__ branch (ADR-003): visible
     to whoever has access to the repository's remote. -->

## People

### @{username}
- **Name:** {name}
- **Role in the flow:** {Product | Engineering | Delivery — can be multiple, e.g., Engineering + Delivery}
- **Seniority:** {junior | mid | senior}
- **Specialty:** {e.g., back-end, front-end, QA, product, project management}

### @{username}
- **Name:** ...
- **Role in the flow:** ...
- **Seniority:** ...
- **Specialty:** ...
```

**Operational rules (P5):**
- Born conversationally at the end of the first triage, before creating any issue (microcopy §7.5) — roles proposed by the agent, the human corrects in a single round.
- Continuous validation by diff against board collaborators: new ones → question only about them; departed ones → signal, **never silently delete** (historical assignees reference the map).
- Without listing permission → map marked as partial, minimal roles for the current wave — never blocks the epic.
- Trivial later edit ("X is now Engineering" → the agent updates the file).
