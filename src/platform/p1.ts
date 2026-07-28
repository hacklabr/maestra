/**
 * P1 metadata line — the canonical cross-reference between epic and tasks on
 * BOTH platforms (ADR-011). Format:
 *   **Variant:** X · **Current stage:** Y · **Epic:** #N · **Round:** Rnn
 */
const EPIC_REF = /\*\*Epic:\*\*\s*#(\d+)/

/** Extract the epic number from an issue body, or null when absent. */
export function parseEpicRef(body: string): number | null {
  const match = EPIC_REF.exec(body)
  return match ? Number.parseInt(match[1], 10) : null
}
