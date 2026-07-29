import { assertUnblockWhenPaused } from "../lib/transcript-asserts.mjs"

/** R02 / C7: when vars.substate is "paused", the unblock condition must be
 *  spoken. The scenario declares the substate it is exercising. */
export default async function (output, context) {
  const substate = context?.vars?.substate ?? ""
  return assertUnblockWhenPaused(JSON.parse(output), substate)
}
