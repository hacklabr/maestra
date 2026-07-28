import type { ExecFn, ExecResult } from "../exec.js"

export interface RecordedCall {
  cmd: string
  args: string[]
}

/**
 * Exec stub: routes by regex over the joined command line, records all calls.
 * Unmatched calls fail with exit 127 (fail loud — a missing route IS a bug in
 * the test or an unexpected command in the adapter).
 */
export function makeExecStub(routes: Array<[RegExp, Partial<ExecResult>]>): {
  exec: ExecFn
  calls: RecordedCall[]
} {
  const calls: RecordedCall[] = []
  const exec: ExecFn = async (cmd, args) => {
    calls.push({ cmd, args })
    const line = [cmd, ...args].join(" ")
    for (const [pattern, result] of routes) {
      if (pattern.test(line)) return { stdout: "", stderr: "", code: 0, ...result }
    }
    return { stdout: "", stderr: `no stub route for: ${line}`, code: 127 }
  }
  return { exec, calls }
}

export const json = (value: unknown): Partial<ExecResult> => ({ stdout: JSON.stringify(value) })

export const fail = (stderr: string, code = 1): Partial<ExecResult> => ({ stderr, code })
