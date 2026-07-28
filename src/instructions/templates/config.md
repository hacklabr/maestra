# Template — Flow configuration (`.maestra/config.md`)

> Source: src/platform/config.ts (ADR-014 — real format written/read by the code) · Module version: 1 — 2026-07-28
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
- Versioned in the repository ("no state outside the repository"); manual edit overrides detection.
