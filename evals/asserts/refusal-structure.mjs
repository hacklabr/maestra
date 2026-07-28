import { assertRefusalStructure } from "../lib/transcript-asserts.mjs"

/** J8 refusal: the 5 structural principles (microcopy §7.3), incl. the section-citation ban. */
export default async function (output, _context) {
  return assertRefusalStructure(JSON.parse(output))
}
