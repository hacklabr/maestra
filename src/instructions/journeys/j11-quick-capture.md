# J11 — Quick Capture (stage-0)

> Source: fluxo-de-desenvolvimento.md (stage-0 quick capture) + kernel entry router (R03) · Module version: 3 — 2026-08-02
> Anti-drift: module derived from the source; divergence is a finding, never a silent adjustment.
> Changelog: v1 (R03) — initial version: capture-intent journey, stage-0 label, confirmation gate, promotion via J1. v2 (R07) — curated capture: "author's intent, curated text" replaces "author's words"; quick bounded code grounding; board duplicate check (create new / relate / discard); ≤2 quick questions via the host's clickable-question tool; confirmation gate unchanged. v3 (R08) — delegated enrichment: Stage 1 grounding and duplicate check delegated to generic research subagents via the host's subagent tool, with a distilled-return contract (one verified sentence / ≤3 candidates); quick questions stay in the main session; confirmation gate unchanged.

**Trigger:** capture intent detected by the kernel entry router — the person wants to REGISTER something for later, not classify or process it now. **Promise:** the demand reaches the board fast — curated draft, bounded enrichment (≤2 questions, one quick grounding pass), no triage interrogation.

## STAGE 1 — Intake + enrichment

From the user's message, extract the demand. Then enrich, in this order — each step optional except where noted, all of them bounded. Steps 1 and 2 are **delegated**: they run in a research subagent spawned via the host's subagent tool, NOT in the capture session — the main session receives only the distilled result, never the search trail (no grep output, no file dumps, no issue listings). The subagent is a generic lightweight researcher (any general-purpose subagent the host offers), NEVER the discussion-panel specialist shell — that one is reserved for panel personas (J9).

1. **Quick code grounding (optional, bounded — delegated).** When the demand cites code (a file, function, behavior), delegate ONE fast verification pass to a research subagent via the host's subagent tool. The delegation prompt asks: verify the cited file/function exists and report what it does today. **Distilled return (contract):** exactly ONE verified sentence of current behavior (e.g., "`src/foo.ts` does X today"), or "skipped" — never the search trail. This is explicitly NOT an exhaustive investigation — no call graphs, no root-cause analysis, no fix design. If it costs more than a couple of lookups, the subagent stops and returns "skipped"; capture proceeds without grounding.
2. **Board duplicate check (mandatory — delegated).** Delegate a search of open issues for similar demands to a research subagent via the host's subagent tool. **Distilled return (contract):** at most 3 candidate issues, each as number + title, or "nothing found" — never the full listing. If a candidate exists, carry it into the draft presentation (Stage 2) with the options **create new / relate / discard** (microcopy §7.12). Never publish a likely duplicate without the author having seen the candidate.
3. **Quick questions (≤2, optional — main session).** Only when ambiguity is material — a wrong guess would change what gets captured — ask 1–2 quick questions via the host's clickable-question tool, when available; otherwise ask as a plain message. This step is conversation with the author and is NEVER delegated. Never let this become a triage interrogation: if two questions don't resolve it, capture what you have and note the open point in the summary.

## STAGE 2 — Curated draft + confirmation gate

Generate the draft issue:

- **Title:** ≤60 chars, verb + object, business language (no technical diagnosis).
- **Summary** (`## Summary`): 2–4 sentences, **curated** — rewrite what the person said for clarity, preserving the author's intent without inventing scope. When grounding happened, it may include one sentence of verified current behavior. Curating is not diagnosing: no root cause, no solution design, no classification.

Present the draft in chat (microcopy §7.12). If a duplicate candidate was found in Stage 1, present it together with the draft (create new / relate / discard). Ask for confirmation or correction. If the user corrects, apply corrections and re-confirm.

**Confirmation gate:** no issue published without explicit confirmation. Silence or absence of objection is NOT confirmation (same default as kernel trigger #3).

## STAGE 3 — Publish

After confirmation:

1. Create the issue with label `stage-0`. Add it to the board.
2. Post a comment noting it is awaiting triage (stage-0).
3. If the duplicate check chose **relate**, cross-reference the candidate issue — use the platform's native relation link when the cookbook offers one; otherwise a comment on each issue referencing the other.
4. Use microcopy §7.12 (published).

**Do NOT create:** epic, round folder, wave, daughter tasks, metadata line (P1), variant label — this is **pre-flow**. The round folder is NOT born here; it is born at the first J1 artifact commit (J3/J6 Stage 1).

**Emit NO events (A–F)** — capture is pre-flow. Triage events fire when J1 runs later (promotion).

## STAGE 4 — Promotion (when prioritized)

When the user says "triage issue #N" (or similar) about a stage-0 issue, OR when J2 resume encounters a stage-0 issue (branch B1a):

- Run **J1 normally** over the issue.
- **Remove the `stage-0` label** as part of classification.
- The issue transitions from pre-flow into the normal flow.

## Rules

- **Author's intent, curated text:** the draft rewrites title and summary for clarity, faithful to what the author meant, without inventing scope. Curating ≠ diagnosing — never root cause, solution design, or classification.
- **Delegated enrichment:** grounding and the duplicate check run in generic research subagents via the host's subagent tool — the capture session stays clean (no greps, file reads, or issue listings in it). The curated draft and the confirmation gate are NEVER delegated.
- **Distilled-return contract (size caps):** grounding returns ONE verified sentence of current behavior or "skipped"; the duplicate check returns ≤3 candidates (number + title) or "nothing found". The search trail never enters the main session.
- **Bounded grounding:** one fast pass, explicitly not exhaustive; skipped when it doesn't make sense.
- **No silent duplicates:** a duplicate candidate is always shown to the author before publishing, with the choice create new / relate / discard.
- **Confirmation gate:** no issue published without explicit confirmation; silence is NOT confirmation.
- **`stage-0` ≠ Minimal:** stage-0 is unclassified pre-flow; Minimal is a classified variant. A stage-0 issue has no variant — only after J1 promotion does it receive one.
- **No round folder born here** — born at the first J1 artifact commit (J3/J6 Stage 1), as in every variant.

## Journey success criteria

- Issue published with `stage-0` label; capture stays fast (≤2 questions, grounding bounded to one quick pass).
- Draft curated for clarity, faithful to the author's intent; no triage interrogation.
- Duplicate candidates presented before publishing whenever found.
- No epic, round folder, wave, or events created — pre-flow only.
