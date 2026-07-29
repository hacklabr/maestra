import { assertApprovalLockJ3 } from "../lib/transcript-asserts.mjs"

/** R02 / RF-04 / C10: no write to a round briefing/scope file before an
 *  explicit human approval turn (F009 collapse guard). */
export default async function (output, _context) {
  return assertApprovalLockJ3(JSON.parse(output))
}
