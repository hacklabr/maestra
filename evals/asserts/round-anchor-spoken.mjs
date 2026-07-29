import { assertRoundAnchorSpoken } from "../lib/transcript-asserts.mjs"

/** R02 / C4: the round anchor (name + theme) must open the first agent turn
 *  (over-naturalisation guard — a natural summary must not drop the anchor). */
export default async function (output, _context) {
  return assertRoundAnchorSpoken(JSON.parse(output))
}
