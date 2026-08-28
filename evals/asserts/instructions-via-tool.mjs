import { assertInstructionsViaTool } from "../lib/transcript-asserts.mjs"

/** R17 entry-gate contract: instruction files load via maestra_read_instructions (relative path). */
export default async function (output) {
  return assertInstructionsViaTool(JSON.parse(output))
}
