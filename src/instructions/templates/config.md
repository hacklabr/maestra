# Template — Flow configuration (`config.md` on branch `__maestra_config__`)

> Source: src/platform/config.ts (parser format ADR-014; location ADR-003 — real format written/read by the code) · Module version: 2 — 2026-08-18
> Anti-drift: this file documents the EXACT format that `writeFluxoConfig` persists and `readFluxoConfig` parses. Keys and values outside the pattern are silently ignored by the parser — drift here = invisible configuration.

```markdown
# Flow configuration

<!-- ADR-014: generated on first triage; edit by hand to override detection. -->

- platform: {github|gitlab}
- host: {instance hostname — e.g., github.com, gitlab.com, gitlab.company.com}
- project: {project identifier on the platform}
- board: {board/column-project id — cached at 1× setup per project}
```

**Rules (from the code, not convention):**
- Only the 4 keys above are parsed: `platform`, `host`, `project`, `board` (format `- key: value`, one per line).
- `platform` only accepts `github` or `gitlab` — any other value is discarded.
- Created on the first triage (J1): tool detection persists what it derived; the agent asks **ONCE** only what is missing — once per repository.
- Lives at the root of the orphan branch `__maestra_config__` (ADR-003): written/read by the tools via the config-store, or manually via `maestra-config read/write config.md`. Never a `.maestra/` folder in the project tree (legacy → `maestra-config migrate`). Manual edit overrides detection.
