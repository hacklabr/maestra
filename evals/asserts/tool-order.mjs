import { assertCallOrder } from "../lib/transcript-asserts.mjs"

/** Expects vars.expectedCallOrder: regex strings (subsequence over the unified call stream). */
export default async function (output, context) {
  let expected = context?.vars?.expectedCallOrder
  // promptfoo flattens single-element var arrays — normalize.
  if (typeof expected === "string") expected = [expected]
  if (!Array.isArray(expected) || expected.length === 0) {
    return { pass: false, score: 0, reason: "scenario sem vars.expectedCallOrder" }
  }
  return assertCallOrder(JSON.parse(output), expected)
}
