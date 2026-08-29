# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.0] - 2026-08-28

### Added

- Issue classification (R16, issue #34): native issue type + dimension labels
  at issue creation (RF-45..48) — classification wired into J1 triage and
  scope templates.

- Prompt-free instruction loading (R17, issue #52): new `maestra_read_instructions`
  tool serves the full content of exactly one instruction file (relative path) from
  the installed tree `<host-config>/maestra/instructions/` — allowlist with
  fail-closed containment (absolute paths, `..` and symlink escapes rejected).
  Kernels (v9/v6/v7/v2), journeys (j1/j2/j3/j8) and the agent bootstrap pointers
  now load via the tool instead of host `read` (`external_directory` permission
  grants removed from the generated agent markdown); smoke assertions flipped to
  the new contract; eval IL-01 added. Closes dogfooding finding F039
  (per-session read-permission prompts on out-of-workspace instruction files).

- Universal pre-creation dedup gate (R19, issue #53): anti-bypass trigger #19 —
  no demand-representing issue is born without a prior duplicate/related search
  (open + closed); `search-similar` cookbook operation (GH + GL) with §1
  creation precondition; microcopy "Duplicate found" declared journey-agnostic;
  AB-19 eval pins search-before-create on a mid-session doc-bug arc.

### Changed

- Epic-branch PR topology (R18, issue #54): `pr-topology` now defaults to
  epic-branch PRs — new `awaiting-integration` state and P6 steps 7a/7b
  (per-task PR + integration PR); supersedes the single-monolith-PR flow.

## [1.2.0] - 2026-08-19

### Added

- Orphan-branch configuration store (R14, issue #48, ADR-003): per-repo
  configuration (`config.md`, `team.md`, `labels.md`) now lives on the orphan
  branch `__maestra_config__` (no shared history with the project), read via
  git plumbing and written as commits + best-effort push — zero maestra
  commits on project branches. New `src/platform/config-store.ts`; tools
  (`maestra_status`, `issue_digest`, `emit_event`, `maestra-report`) read
  config from the branch and signal legacy `.maestra/` folders. New
  `maestra-config` CLI: `migrate` (idempotent legacy migration; prints —
  never executes — the removal commands), `read`/`write` for single-file
  upsert. Instructions (J1/J2/J12, protocols P5/P6, microcopy, templates,
  cookbooks) and eval/smoke harness updated in lockstep. Supersedes the
  "config versioned in the host tree" decision (ADR-014 location).

- Post-PR QA workflow (R15, issue #49): close|qa modes,
  awaiting-qa/qa-rejected substates, J2 B7 guided QA session, workflow.md on
  `__maestra_config__` (ADR-004), reassign-issue (GH/GL cookbooks).

## [1.1.0] - 2026-08-05

### Added

- `maestra/ops` operations specialist (R11, issue #40): a subagent that
  executes git and issue-platform mechanics (worktrees, branches, commits,
  pushes, PR/MR opening, task linking, board moves) on behalf of the
  facilitator under a distilled-return contract — retries and raw command
  output stay inside the ops session; the caller receives only the distilled
  success or a precise final error. Installer writes the ops agent for both
  hosts; smoke suite asserts 2 subagents (shell + ops) per cell.
- Consent gate before implementation (R10): the facilitator must obtain
  explicit human consent before any implementation begins — wired into J2
  (resume), J5 (stage 3), the direct-mode kernel, and microcopy §7.13.

### Changed

- README: "How the flow works" intro with one mermaid diagram per agent, and
  a dedicated section for the operations specialist.

## [1.0.0] - 2026-08-03

First stable release of Maestra — a development workflow facilitator plugin
(triage → three stages → reconciliation, with gates and four depth variants)
for OpenCode and Mimo Code. The plugin is the discipline; the issue platform
(GitHub/GitLab) is the memory.

### Added

- Plugin scaffold: platform adapter (GitHub/GitLab), tools (`maestra_status`,
  `maestra_issue_digest`, `maestra_emit_event`, `ask_peer`), installer with
  host detection (`install.sh`), and CI guards (`check:vocab`, `check:dist`,
  smoke suite).
- Shell-specialist architecture: a single subagent with the specialist persona
  expanded on demand, persona-expansion hook, and caller-identity propagation.
- Layered instruction architecture (L0–L4): always-resident kernel with 18
  anti-bypass triggers, journeys J1–J11 loaded on demand, references,
  templates, and a greppable persona catalog (submodule).
- Unconditional entry gate with orchestrator-only role and mandatory
  facilitation sequence.
- Quick-capture flow (J11): stage-0 entry door with draft → confirm → publish;
  v2 adds grounding, dedup, and clickable questions (R07), delegated capture
  enrichment via research subagents (R08), and delegated publish via an
  operations subagent (R09).
- `issue-writer` agent for capture-only quick capture (R06).
- Direct-mode agent running the minimal flow in a single session (R05).
- Parallel round modes for discussion panels (J9, R04).
- Two-phase derivation/speech templates with welcoming language (R02).
- Evaluation suite (promptfoo): deterministic tier, LLM-as-judge with
  versioned rubric, and golden transcripts as the guard condition for
  dogfooding.
- `maestra-report` CLI for presence auditing.
- Dogfooding discipline: append-only findings registry
  (`docs/dogfooding/findings.md`) feeding future rounds; nine rounds
  (R01–R09) executed and reconciled with scope, retro, and deviations records.
- Adaptive language policy: English codebase with PT-BR allowed in
  human-context documents.

### Changed

- Project renamed from `fluxo-facilitador` to `maestra`.
- Entire codebase and instructions translated to English under the adaptive
  language policy.

### Fixed

- `emit_event` payload normalization when the host serializes objects as JSON
  strings.
- Kernel entry-gate adherence: mandatory sequence plus anti-bypass trigger
  #17 (R01).
- Variant-aware decomposition and structural wave links in journeys.
- Round setup conventions and discovery conduct in journeys.
- Protocol P6 board movement rewrite and P1 metadata atomicity.

[Unreleased]: https://github.com/hacklabr/maestra/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/hacklabr/maestra/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/hacklabr/maestra/releases/tag/v1.0.0
