# Template — Artifact task — Stages 1 and 2

> Source: fluxo-de-desenvolvimento.md §11.2 + docs/referencia/jornadas.md §4–§5 (v2.1) · Module version: 1 — 2026-07-28
> Anti-drift: sections verbatim from source §11.2 within the two-layer structure (P1). The "Type and delivery location" field is the documental class declaration — mandatory in every artifact task (REFERENCE × RECORD governance).

```markdown
{TITLE — max ~60 characters, verb + object, business language}

## Summary
<!-- 2–4 sentences: which document this task produces/updates and why,
     in language a non-technical person understands. -->

**Variant:** {full | condensed | minimal | technical} · **Current stage:** {1|2} · **Substate:** in-artifacts · **Epic:** #{N} · **Round:** {Rnn}

---
## Details for execution

### Epic
<!-- Link to the parent issue — mandatory -->

### Artifact to produce
<!-- E.g., mini-briefing, reference PRD update, ADR,
     fit analysis, motivation, baseline, round scope -->

### Type and delivery location
<!-- MANDATORY — the documental class of the artifact:
     REFERENCE (docs/reference/ — living, edited in place)
     or RECORD (docs/rounds/Rnn-yyyy-mm-name/, docs/decisions/adr/ —
     dated, immutable after the round closes).
     E.g., update docs/reference/prd.md — section X -->

### Required inputs
<!-- Documents or decisions this artifact depends on -->

### Acceptance criteria
<!-- Items of the Definition of Ready / stage gate that this artifact
     needs to satisfy. The task only closes with them validated. -->
- [ ] Artifact committed in the correct location of the repository
- [ ] ...
```

**Usage rules:**
- The round folder **is born at the first artifact commit of the round** — never in triage — and is ALWAYS born, in all variants (decision Q1).
- A closed artifact task whose declared artifact **does not exist in the repository does not count for the gate** (J2 — microcopy §7.2, "artifact not found").
- Reference document: edited **in place**, single version — never a versioned copy (`prd-v2.md` is forbidden). Record document: at most a dated addendum after closing.
