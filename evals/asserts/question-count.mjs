import { assertQuestionCaps } from "../lib/transcript-asserts.mjs"

/** vars.questionCaps: { maxPerTurn?, maxTotal? } — defaults 3/5 (journeys §2). */
export default async function (output, context) {
  const caps = context?.vars?.questionCaps ?? {}
  return assertQuestionCaps(JSON.parse(output), caps)
}
