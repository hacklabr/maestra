# Deviations of round R20 — textos que humanos leiam sem esforço
<!-- Every divergence between what was planned and what was implemented.
     An undeclared deviation is the embryo of contradictory documentation. -->

## Deviation 1 — Gloss semantics: punctuation AND explanatory word (not OR)
- **Planned:** the design comment on #58 specified the gloss check as "a gloss marker appears within the same sentence (±120 chars)" — any one marker (punctuation or explanatory word).
- **Implemented:** the assert requires punctuation (—, (, :) AND an explanatory word within the window; the doc comment explains why.
- **Reason:** the planned OR-semantics passes the F047 BEFORE sample ("F045 (novo):" carries "(" and ":" with zero explanation), contradicting the "BEFORE must fail" requirement. The implementer followed the project's existing-convention priority and documented the divergence in the function's doc comment.
- **Decision registered at:** [specialist's distilled report in this session + doc comment in `evals/lib/transcript-asserts.mjs`](https://github.com/hacklabr/maestra/pull/61)
- **Reference document updated:** [evals/lib/transcript-asserts.mjs — R20 section](https://github.com/hacklabr/maestra/pull/61/files)

## Deviation 2 — Two assert wrapper files beyond the 4 contracted deliverables
- **Planned:** 4 deliverable files only (`transcript-asserts.mjs`, scenario yaml, `rubric.md`, harness registration).
- **Implemented:** 6 files — plus `evals/asserts/internal-refs-explained.mjs` and `evals/asserts/internal-refs-explained-violation.mjs`.
- **Reason:** scenarios reference asserts as `file://asserts/*.mjs` and the harness structure test hard-fails when an on-disk scenario lacks its assert files; the `-violation` wrapper inverts the result so the violation goldens (T1/T4) keep the gate green while proving the detector fires.
- **Decision registered at:** [specialist's distilled report in this session](https://github.com/hacklabr/maestra/pull/61)
- **Reference document updated:** [evals/asserts/internal-refs-explained.mjs + -violation.mjs](https://github.com/hacklabr/maestra/pull/61/files)

## Deviation 3 — Three promptfoo configs touched
- **Planned:** no config files among the deliverables.
- **Implemented:** `promptfooconfig.yaml`, `.nightly.yaml` and `.dry.yaml` each register the new scenario.
- **Reason:** the "no orphan corpus" harness test hard-fails if a scenario on disk is missing from the configs; the dry-config registration is what lets `eval:dry` exercise the scenario as contracted.
- **Decision registered at:** [specialist's distilled report in this session](https://github.com/hacklabr/maestra/pull/61)
- **Reference document updated:** [evals/promptfooconfig.{yaml,dry.yaml,nightly.yaml}](https://github.com/hacklabr/maestra/pull/61/files)

## Deviation 4 — §7.15 text rewritten for neutral-vocabulary compliance
- **Planned:** §7.15 examples cited `gh 2.97`, "GitHub" and "PR" (first commit ad7cb3c).
- **Implemented:** neutral forms — `CLI 2.97`, "issue-platform CLI", "PR/MR" (fix commit 8767be0).
- **Reason:** the project's neutral-vocabulary check (ADR-012) hard-fails on platform-specific terms outside the cookbooks; the teaching value of the examples is preserved with neutral terms, and the real F047 wording (with `gh 2.97`) remains the eval golden, which lives outside the scanned tree.
- **Decision registered at:** [facilitator's in-session correction — this session's chat](https://github.com/hacklabr/maestra/pull/61)
- **Reference document updated:** [src/instructions/reference/microcopy.md §7.15](https://github.com/hacklabr/maestra/pull/61/files)
