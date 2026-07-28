import { assertRequiredPatterns } from "../lib/transcript-asserts.mjs"

/** vars.requiredPatterns: regex strings that MUST appear (scope: "agent" | "files"). */
export default async function (output, context) {
  let patterns = context?.vars?.requiredPatterns
  if (typeof patterns === "string") patterns = [patterns]
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return { pass: false, score: 0, reason: "scenario sem vars.requiredPatterns" }
  }
  return assertRequiredPatterns(JSON.parse(output), patterns, { scope: context?.vars?.patternScope ?? "agent" })
}
