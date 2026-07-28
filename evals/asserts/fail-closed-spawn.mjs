import { assertFailClosedSpawn } from "../lib/transcript-asserts.mjs"

/** Shell spawn without marker: fail-closed warning + no peer-map registration + respawn with marker. */
export default async function (output, _context) {
  return assertFailClosedSpawn(JSON.parse(output))
}
