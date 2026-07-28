import { execFile } from "node:child_process"

export type ExecResult = { stdout: string; stderr: string; code: number }
export type ExecFn = (cmd: string, args: string[]) => Promise<ExecResult>

export class ForgeError extends Error {
  constructor(
    message: string,
    readonly cmd: string,
    readonly args: string[],
    readonly stderr: string,
  ) {
    super(message)
    this.name = "ForgeError"
  }
}

export const defaultExec: ExecFn = (cmd, args) =>
  new Promise((resolvePromise) => {
    execFile(cmd, args, { timeout: 30_000, maxBuffer: 16 * 1024 * 1024 }, (error, stdout, stderr) => {
      resolvePromise({
        stdout: stdout ?? "",
        stderr: stderr ?? "",
        code: error ? (typeof error.code === "number" ? error.code : 1) : 0,
      })
    })
  })

/** Run a CLI command, throwing ForgeError with full context on non-zero exit. */
export async function runCli(exec: ExecFn, cmd: string, args: string[]): Promise<string> {
  const result = await exec(cmd, args)
  if (result.code !== 0) {
    throw new ForgeError(
      `${cmd} failed with exit ${result.code}: ${result.stderr.trim().slice(0, 500)}`,
      cmd,
      args,
      result.stderr,
    )
  }
  return result.stdout
}
