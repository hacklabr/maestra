import { assertTwoLayerIssues } from "../lib/transcript-asserts.mjs"

/** P1: created issue bodies must be two-layer (## Summary → **Variant:** → ## Details for execution). */
export default async function (output, _context) {
  return assertTwoLayerIssues(JSON.parse(output))
}
