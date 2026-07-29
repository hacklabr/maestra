import { assertNoFieldEnumeration } from "../lib/transcript-asserts.mjs"

/** R02: the flow's internal field names (variant/round/stage/substate/gate)
 *  must not be enumerated as fields in agent speech (ADR-001 MUDANÇA 5). */
export default async function (output, _context) {
  return assertNoFieldEnumeration(JSON.parse(output))
}
