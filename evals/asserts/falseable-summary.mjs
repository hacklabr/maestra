import { assertFalseableSummary } from "../lib/transcript-asserts.mjs"

/** J2: state summary is a falseable assertion with a concrete next action. */
export default async function (output, _context) {
  return assertFalseableSummary(JSON.parse(output))
}
