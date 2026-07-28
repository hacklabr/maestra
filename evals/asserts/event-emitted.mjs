import { assertEventEmitted } from "../lib/transcript-asserts.mjs"

/** vars.expectEvent: "A" | "B" | "C" | "D" | "E" | "F" | "override" — emitted via maestra_emit_event. */
export default async function (output, context) {
  const type = context?.vars?.expectEvent
  if (!type) return { pass: false, reason: "scenario missing vars.expectEvent" }
  return assertEventEmitted(JSON.parse(output), type)
}
