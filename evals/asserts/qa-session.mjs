/**
 * R15 — QA session ordering contract (J2 branch B7 / microcopy §7.14):
 *  1. the facilitator PRESENTS the task (acceptance criteria + where to
 *     validate in the test environment) before ANY platform mutation;
 *  2. transitions (close / card / reassign / metadata) execute only AFTER the
 *     human verdict turn — the session never closes preemptively.
 *
 * Turn numbering: every push into transcript.turns increments the count; a
 * call's `afterTurn` is the turn number in whose agent loop it ran (calls in
 * the agent loop right after human turn N have afterTurn = N).
 */

const MUTATION =
  /(issue\s+(close|edit|comment)|issue\s+comment|item-edit|item_edit|--add-assignee|--remove-assignee|assignee_ids|--body-file|api\s+[^\n]*-X\s*(POST|PATCH|PUT|DELETE))/i

const PRESENTATION = /(criteri|acceptance)/i
const WHERE_TO_VALIDATE = /(test environment|staging|where to (validate|check)|ambiente de teste)/i
const VERDICT = /(approv|reject|aprov|reprov)/i

function ok(reason) {
  return { pass: true, score: 1, reason }
}
function fail(reason) {
  return { pass: false, score: 0, reason }
}

export default async function (output, _context) {
  const transcript = JSON.parse(output)
  const failures = []

  // 1) presentation turn exists (criteria + where to validate)
  const presentIdx = transcript.turns.findIndex(
    (t) => t.role === "agent" && PRESENTATION.test(t.content ?? "") && WHERE_TO_VALIDATE.test(t.content ?? ""),
  )
  if (presentIdx === -1) {
    failures.push("QA session presentation (acceptance criteria + where to validate in the test environment) never produced")
  }

  // 2) a human verdict turn exists, strictly after the presentation turn
  const verdictIdx = transcript.turns.findIndex(
    (t, i) => t.role === "human" && i > presentIdx && VERDICT.test(t.content ?? ""),
  )
  if (verdictIdx === -1) {
    failures.push("human QA verdict turn never scripted after the presentation — transitions have no consent source")
  }

  // 3) transitions exist and respect the order contract
  const firstMutation = transcript.calls.find((c) => c.kind === "exec" && MUTATION.test(c.command ?? ""))
  if (!firstMutation) {
    failures.push("no transition executed (close/card/reassign/metadata) — expected after the verdict")
  } else {
    const presentTurnNumber = presentIdx + 1
    const verdictTurnNumber = verdictIdx + 1
    if (presentIdx !== -1 && (firstMutation.afterTurn ?? 0) <= presentTurnNumber) {
      failures.push(
        `VIOLATION: platform mutation before/within the presentation turn ("${String(firstMutation.command).slice(0, 60)}…" in turn ${firstMutation.afterTurn}; presentation in turn ${presentTurnNumber})`,
      )
    }
    if (verdictIdx !== -1 && (firstMutation.afterTurn ?? 0) < verdictTurnNumber) {
      failures.push(
        `VIOLATION: transition executed before the human verdict ("${String(firstMutation.command).slice(0, 60)}…" in turn ${firstMutation.afterTurn}; verdict turn ${verdictTurnNumber}) — the session never closes preemptively`,
      )
    }
  }

  return failures.length === 0
    ? ok("QA session order contract respected: presentation → questions → verdict → transitions")
    : fail(failures.join(" | "))
}
