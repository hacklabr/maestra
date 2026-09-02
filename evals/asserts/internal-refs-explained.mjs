import { assertInternalRefsExplained } from "../lib/transcript-asserts.mjs"

/** R20: internal references (Fnnn/Rnn/#nn/tool versions/field tokens) must be
 *  glossed in plain words at first occurrence (microcopy §7.15 rule 1, F047). */
export default async function (output, _context) {
  return assertInternalRefsExplained(JSON.parse(output))
}
