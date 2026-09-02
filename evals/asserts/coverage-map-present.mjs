import { assertCoverageMapPresent } from "../lib/transcript-asserts.mjs"

/** R21 / RF-66: coverage map (●/●●/●●● with named specifics) + deepening menu
 *  (≤3 options) + approve as-is / deepen / cut scope closing. */
export default async function (output, _context) {
  return assertCoverageMapPresent(JSON.parse(output))
}
