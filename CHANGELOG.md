# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/hacklabr/maestra/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/hacklabr/maestra/releases/tag/v1.0.0
