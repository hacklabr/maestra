import { assertForbiddenPatterns } from "../lib/transcript-asserts.mjs"

/** vars.forbiddenPatterns: regex strings that must NEVER appear (scope: "agent" | "files"). */
export default async function (output, context) {
  let patterns = context?.vars?.forbiddenPatterns
  if (typeof patterns === "string") patterns = [patterns]
  if (!Array.isArray(patterns) || patterns.length === 0) {
    return { pass: false, score: 0, reason: "scenario sem vars.forbiddenPatterns" }
  }
  return assertForbiddenPatterns(JSON.parse(output), patterns, { scope: context?.vars?.patternScope ?? "agent" })
}
