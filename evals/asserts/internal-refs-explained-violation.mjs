import { assertInternalRefsExplained } from "../lib/transcript-asserts.mjs"

/** R20 violation golden: the scenario's mock text is a KNOWN violation (e.g.
 *  the F047 BEFORE sample). This assert PASSES only when the detector fires —
 *  it proves the regression guard actually catches the bare-reference text. */
export default async function (output, _context) {
  const result = assertInternalRefsExplained(JSON.parse(output))
  if (result.pass) {
    return {
      pass: false,
      score: 0,
      reason: "violation golden NOT detected — the clear-writing guard let bare internal references pass (§7.15 rule 1, F047)",
    }
  }
  return { pass: true, score: 1, reason: `violation detected as expected: ${result.reason}` }
}
