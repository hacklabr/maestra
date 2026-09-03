import { assertMagnitudeDeclared } from "../lib/transcript-asserts.mjs"

/** R21 / RF-64: magnitude gate spoken out loud with evidence, before the first
 *  elicitation question. vars.expectedMagnitude pins the rubric classification. */
export default async function (output, context) {
  return assertMagnitudeDeclared(JSON.parse(output), context?.vars?.expectedMagnitude ?? null)
}
