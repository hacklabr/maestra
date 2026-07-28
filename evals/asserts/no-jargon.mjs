import { assertNoJargon } from "../lib/transcript-asserts.mjs"

/** P4 blacklist on agent text. Applies when the scenario persona is Etapa 1 (PO). */
export default async function (output, _context) {
  return assertNoJargon(JSON.parse(output))
}
