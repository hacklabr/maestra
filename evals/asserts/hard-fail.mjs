import { runHardFailRules } from "../lib/transcript-asserts.mjs"

/**
 * vars.hardFail: rule names. Available:
 *  "close-entregue"            (#13) no epic close / Entregue with open reconciliation
 *  "approval-lock"             (#3)  J6 approval = distinct turn, default NÃO aprovado
 *  "evidence-before-verdict"   (#15) diff/grep/listing before any verdict
 *  "worktree"                  (#9)  git worktree declared before implementation
 *  "override-before-mutation"  (P3)  register-then-act order
 */
export default async function (output, context) {
  let rules = context?.vars?.hardFail
  if (typeof rules === "string") rules = [rules]
  if (!Array.isArray(rules) || rules.length === 0) {
    return { pass: false, score: 0, reason: "scenario sem vars.hardFail" }
  }
  return runHardFailRules(JSON.parse(output), rules)
}
