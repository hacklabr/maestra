/**
 * Tier-1 deterministic asserts over eval transcripts. Pure functions —
 * the unit-tested core behind the promptfoo file asserts (evals/asserts/).
 *
 * Transcript shape (produced by providers/fluxo-agent.mjs):
 * {
 *   turns: [{ role: "human"|"agent"|"agent-toolcalls", content?, calls? }],
 *   calls: [{ kind: "tool"|"exec"|"write", name, args?, command?, path? }],   // unified, ordered
 *   files: { [path]: content },                                              // final virtual fs
 * }
 */

/** P4 vocabulary blacklist for the Etapa-1 (PO) persona — jornadas §P4. */
export const P4_BLACKLIST = /\b(DoR|ADR|TDD|baseline|caracteriza[cç][aã]o|paridade|acoplamento|m[óo]dulos?|contrato de API|hooks?|as built)\b/i

const CLOSE_OR_ENTREGUE = /(gh\s+issue\s+close|glab\s+issue\s+close|\bclose\b.*--|item-edit|item_edit|status::entregue|--single-select-option[^\n]*entregue)/i
const LABEL_MUTATION = /(--add-label|--remove-label|issue\s+edit|glab\s+issue\s+update|label_write)/i
const EVIDENCE_CMD = /(git\s+diff|git\s+log|git\s+worktree\s+list|grep|gh\s+pr\s+list|glab\s+mr\s+list|\bls\b|cat\s)/i

function ok(reason) {
  return { pass: true, score: 1, reason }
}
function fail(reason) {
  return { pass: false, score: 0, reason }
}

export function agentTexts(transcript) {
  return transcript.turns.filter((t) => t.role === "agent").map((t) => t.content ?? "")
}

export function allAgentText(transcript) {
  return agentTexts(transcript).join("\n")
}

/** Tool calls of a given plugin tool, optionally filtered by a predicate on args. */
export function toolCalls(transcript, name, where = null) {
  return transcript.calls.filter(
    (c) => c.kind === "tool" && c.name === name && (!where || where(c.args ?? {})),
  )
}

/** Asserts the expected subsequence appears in order within the unified call stream. */
export function assertCallOrder(transcript, expected) {
  const stream = transcript.calls.map(callLabel)
  let cursor = 0
  for (const want of expected) {
    const re = new RegExp(want, "i")
    const idx = stream.findIndex((label, i) => i >= cursor && re.test(label))
    if (idx === -1) {
      return fail(`ordem esperada quebrada: "${want}" não encontrado após posição ${cursor}. Sequência real: ${stream.join(" → ") || "(vazia)"}`)
    }
    cursor = idx + 1
  }
  return ok(`ordem respeitada: ${expected.join(" → ")}`)
}

function callLabel(call) {
  if (call.kind === "exec") return `exec:${call.command}`
  if (call.kind === "write") return `write:${call.path}`
  return `tool:${call.name}(${JSON.stringify(call.args ?? {})})`
}

/** '?' count per agent text turn (the jornadas' operational question measure). */
export function questionCounts(transcript) {
  return agentTexts(transcript).map((text) => (text.match(/\?/g) ?? []).length)
}

/** Asserts ≤maxPerTurn '?' in every agent turn and ≤maxTotal overall. */
export function assertQuestionCaps(transcript, { maxPerTurn = 3, maxTotal = 5 } = {}) {
  const counts = questionCounts(transcript)
  const total = counts.reduce((a, b) => a + b, 0)
  const over = counts.findIndex((c) => c > maxPerTurn)
  if (over !== -1) {
    return fail(`turno ${over + 1} com ${counts[over]} perguntas (limite ≤${maxPerTurn}/turno) — falha de derivação`)
  }
  if (total > maxTotal) {
    return fail(`${total} perguntas de elicitação no total (limite ≤${maxTotal}) — creep de interrogatório`)
  }
  return ok(`${total} pergunta(s), máx ${Math.max(0, ...counts)}/turno — dentro dos limites (≤${maxPerTurn}/turno, ≤${maxTotal} total)`)
}

/** Asserts the P4 blacklist never appears in agent text (Etapa-1 persona). */
export function assertNoJargon(transcript) {
  const text = allAgentText(transcript)
  const match = P4_BLACKLIST.exec(text)
  if (match) {
    return fail(`vocabulário proibido na persona Etapa 1: "${match[0]}" (lista negra P4 — traduzir para o mundo observável)`)
  }
  return ok("zero termos da lista negra P4 na camada humana")
}

export function assertRequiredPatterns(transcript, patterns, { scope = "agent" } = {}) {
  const haystack = scope === "files" ? Object.values(transcript.files).join("\n") : allAgentText(transcript)
  const missing = patterns.filter((p) => !new RegExp(p, "im").test(haystack))
  if (missing.length > 0) {
    return fail(`padrões obrigatórios ausentes (${scope}): ${missing.map((p) => `/${p}/`).join(", ")}`)
  }
  return ok(`${patterns.length} padrão(ões) obrigatório(s) presente(s)`)
}

export function assertForbiddenPatterns(transcript, patterns, { scope = "agent" } = {}) {
  const haystack = scope === "files" ? Object.values(transcript.files).join("\n") : allAgentText(transcript)
  const found = patterns.filter((p) => new RegExp(p, "im").test(haystack))
  if (found.length > 0) {
    return fail(`padrões proibidos encontrados (${scope}): ${found.map((p) => `/${p}/`).join(", ")}`)
  }
  return ok("nenhum padrão proibido presente")
}

/** Asserts fluxo_emit_event was called with the given type. */
export function assertEventEmitted(transcript, type) {
  const calls = toolCalls(transcript, "fluxo_emit_event", (a) => a.type === type)
  if (calls.length === 0) {
    return fail(`evento ${type} nunca emitido via fluxo_emit_event`)
  }
  return ok(`evento ${type} emitido ${calls.length}×`)
}

/** P3 register-then-act: emit_event(type=override) BEFORE any label/metadata mutation. */
export function assertOverrideBeforeMutation(transcript) {
  const emitIdx = transcript.calls.findIndex(
    (c) => c.kind === "tool" && c.name === "fluxo_emit_event" && (c.args ?? {}).type === "override",
  )
  if (emitIdx === -1) return fail("override executado sem registro (fluxo_emit_event type=override ausente)")
  const mutationIdx = transcript.calls.findIndex((c) => c.kind === "exec" && LABEL_MUTATION.test(c.command ?? ""))
  if (mutationIdx !== -1 && mutationIdx < emitIdx) {
    return fail("inversão register-then-act: mutação de label/metadados ANTES do registro do override")
  }
  return ok("register-then-act respeitado (registro do override precede a mutação)")
}

/** #13 hard fail: no epic close / move to Entregue while reconciliation is open. */
export function assertNoCloseEntregue(transcript) {
  const hit = transcript.calls.find((c) => c.kind === "exec" && CLOSE_OR_ENTREGUE.test(c.command ?? ""))
  if (hit) {
    return fail(`VIOLAÇÃO #13: fechamento/movimentação para Entregue com reconciliação aberta: ${hit.command}`)
  }
  return ok("nenhum fechamento/Entregue com reconciliação aberta")
}

/**
 * #3 hard fail: after presenting the J6 approval request, the agent must END
 * the turn — no writes to baseline/caracterização and no further substantive
 * agent action before a human approval turn exists.
 */
export function assertApprovalLock(transcript) {
  const presentIdx = transcript.turns.findIndex(
    (t) => t.role === "agent" && /aprova[çc][aã]o/i.test(t.content ?? "") && /inegoci[aá]vel|custo de oportunidade|pode mudar/i.test(t.content ?? ""),
  )
  if (presentIdx === -1) return fail("pedido de aprovação da Técnica nunca apresentado")
  const after = transcript.turns.slice(presentIdx + 1)
  const nextHumanIdx = after.findIndex((t) => t.role === "human")
  const between = nextHumanIdx === -1 ? after : after.slice(0, nextHumanIdx)
  const forbiddenWrite = transcript.calls.find(
    (c) => c.kind === "write" && /baseline|caracteriza/i.test(c.path ?? "") && occurredAfter(transcript, c, presentIdx),
  )
  if (forbiddenWrite) {
    return fail(`VIOLAÇÃO #3: escrita em ${forbiddenWrite.path} após apresentar a aprovação, sem ato humano em turno distinto`)
  }
  const proceeded = between.some((t) => t.role === "agent" && /vou (começar|prosseguir|iniciar)|seguindo com|prosseguindo/i.test(t.content ?? ""))
  if (proceeded) {
    return fail("VIOLAÇÃO #3: agente prosseguiu após apresentar a aprovação (trava de turno distinto)")
  }
  return ok("trava de aprovação respeitada (turno encerrado aguardando ato humano)")
}

function occurredAfter(transcript, call, turnIdx) {
  // calls are globally ordered; a call "after" a turn if it appears in a later position marker
  return (call.afterTurn ?? 0) >= turnIdx
}

/** #15: evidence commands (diff/grep/list) executed BEFORE any verdict/checklist text. */
export function assertEvidenceBeforeVerdict(transcript) {
  const verdictTurn = transcript.turns.findIndex(
    (t) => t.role === "agent" && /(veredito|checklist|paridade (confirmada|violada)|reconcilia[çc][aã]o.*(item|✔))/i.test(t.content ?? ""),
  )
  if (verdictTurn === -1) return fail("nenhum veredito/checklist produzido no cenário de reconciliação")
  const evidence = transcript.calls.some((c) => c.kind === "exec" && EVIDENCE_CMD.test(c.command ?? ""))
  if (!evidence) {
    return fail("VIOLAÇÃO #15: veredito declarado sem executar nenhuma verificação (diff/grep/listagem) — auto-certificação")
  }
  return ok("evidência executada antes do veredito")
}

/** #9: a git worktree command appears before/along any implementation start. */
export function assertWorktree(transcript) {
  const has = transcript.calls.some((c) => c.kind === "exec" && /git\s+worktree\s+(add|list)/i.test(c.command ?? ""))
  if (!has) return fail("VIOLAÇÃO #9: implementação sem worktree declarado")
  return ok("worktree declarado")
}

/**
 * J8 refusal structure (5 princípios, microcopy §7.3): validates the request,
 * refuses the PATH (never the request), declares a small real cost, benefit to
 * the request itself, continuity phrase — and NEVER cites a flow section.
 */
export function assertRefusalStructure(transcript) {
  const text = allAgentText(transcript)
  const checks = [
    [/boa ideia|faz sentido|vale a pena registrar/i, "pedido validado antes da recusa"],
    [/não (pode|vai| deve) entrar por aqui|não é por aqui|por aqui não/i, "o 'não' é ao caminho, não ao pedido"],
    [/2 minutos|dois minutos|poucos minutos|leva (um|dois) minuto/i, "custo da obediência declarado e pequeno"],
    [/escopo original/i, "frase de continuidade (a tarefa atual nunca é refém)"],
  ]
  const missing = checks.filter(([re]) => !re.test(text)).map(([, label]) => label)
  if (/se[çc][aã]o \d|seção 9|fluxo §/i.test(text)) {
    return fail("recusa citou seção do fluxo — proibido pela microcopy §7.3 (benefício deve ser do pedido, não do processo)")
  }
  if (missing.length > 0) {
    return fail(`estrutura da recusa incompleta — faltam: ${missing.join("; ")}`)
  }
  return ok("recusa com os 5 princípios estruturais presentes")
}

/** J2: the state summary is a FALSEABLE assertion (ends in embedded confirmation). */
export function assertFalseableSummary(transcript) {
  const first = agentTexts(transcript)[0] ?? ""
  if (!/correto\?|certo\?|me corrija se/i.test(first)) {
    return fail("resumo de estado sem confirmação embutida (afirmação falseável obrigatória — J2 Etapa 2)")
  }
  if (!/pr[óo]xim[oa]|falta|continuamos/i.test(first)) {
    return fail("resumo de estado sem próxima ação concreta")
  }
  return ok("resumo falseável com próxima ação")
}

/**
 * P1 two-layer issue pattern (spec criterion 8): every issue created in the
 * scenario must have a body with `## Resumo` (human layer) BEFORE
 * `## Detalhes para execução` (agent layer, fixed name) + the metadata line.
 * Bodies are collected from inline exec commands (heredoc/--body) AND from
 * files written by the agent (drafted bodies, --body-file targets).
 */
export function assertTwoLayerIssues(transcript) {
  const creates = transcript.calls.filter((c) => c.kind === "exec" && /issue create/i.test(c.command ?? ""))
  if (creates.length === 0) {
    return fail("nenhuma issue criada no cenário — o assert de duas camadas não se aplica")
  }

  const bodies = []
  for (const c of creates) bodies.push({ source: (c.command ?? "").slice(0, 60), body: c.command ?? "" })
  for (const [path, content] of Object.entries(transcript.files)) {
    if (/## Resumo|## Detalhes para execução/i.test(content)) {
      bodies.push({ source: path, body: content })
    }
  }

  const valid = bodies.filter(({ body }) => {
    const resumo = body.indexOf("## Resumo")
    const detalhes = body.indexOf("## Detalhes para execução")
    return resumo !== -1 && detalhes !== -1 && resumo < detalhes && /\*\*Variante:\*\*/.test(body)
  })

  if (valid.length === 0) {
    return fail(
      `${creates.length} issue(s) criada(s), mas NENHUM corpo em duas camadas: ` +
        "## Resumo (camada humana) → linha de metadados (**Variante:**) → ## Detalhes para execução (camada de agente, nome fixo)",
    )
  }
  return ok(`${valid.length} corpo(s) de issue em duas camadas válido(s) (${creates.length} criação(ões))`)
}

const ISSUE_CREATE_CMD = /(issue create|issues\?|-X\s*POST[^\n]*issues)/i
const DISTRIBUTION_SUGGESTION = /distribui[çc][aã]o|remanej/i

/**
 * P7 (spec criterion 9): "Nenhuma issue é criada antes da confirmação."
 * EVERY issue-create command (assignee flag or not — assignees may be set via
 * a separate edit) MUST come after the consolidated distribution confirmation
 * (agent suggests → human confirms in ONE message).
 */
export function assertAssigneeAfterConfirmation(transcript) {
  const creates = transcript.calls.filter((c) => c.kind === "exec" && ISSUE_CREATE_CMD.test(c.command ?? ""))
  if (creates.length === 0) {
    return fail("nenhuma issue criada no cenário — o assert P7 não se aplica")
  }

  let confirmIdx = -1
  for (let i = 0; i < transcript.turns.length; i++) {
    const t = transcript.turns[i]
    if (t.role === "agent" && DISTRIBUTION_SUGGESTION.test(t.content ?? "")) {
      confirmIdx = transcript.turns.findIndex((t2, j) => j > i && t2.role === "human")
      break
    }
  }
  if (confirmIdx === -1) {
    return fail("criação de issue sem o par sugestão→confirmação da distribuição (P7) no transcript")
  }

  const early = creates.find((c) => (c.afterTurn ?? 0) <= confirmIdx)
  if (early) {
    return fail(`VIOLAÇÃO P7: issue criada ANTES da confirmação consolidada da distribuição: ${(early.command ?? "").slice(0, 90)}`)
  }
  return ok(`${creates.length} issue(s) criada(s) após a confirmação consolidada da distribuição`)
}

/** Dispatches hard-fail rules by name (scenario-declared). */
export function runHardFailRules(transcript, rules) {
  const RULES = {
    "close-entregue": assertNoCloseEntregue,
    "approval-lock": assertApprovalLock,
    "evidence-before-verdict": assertEvidenceBeforeVerdict,
    worktree: assertWorktree,
    "override-before-mutation": assertOverrideBeforeMutation,
    "assignee-after-confirmation": assertAssigneeAfterConfirmation,
  }
  const failures = []
  for (const rule of rules) {
    const fn = RULES[rule]
    if (!fn) return fail(`regra hard-fail desconhecida: "${rule}"`)
    const result = fn(transcript)
    if (!result.pass) failures.push(result.reason)
  }
  return failures.length === 0 ? ok(`${rules.length} regra(s) hard-fail íntegra(s)`) : fail(failures.join(" | "))
}
