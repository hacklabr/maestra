import { assertAnchorsCovered } from "../lib/transcript-asserts.mjs"

/** R21 / RF-65: the free-text born draft covers the 5 briefing anchors. */
export default async function (output, _context) {
  return assertAnchorsCovered(JSON.parse(output))
}
