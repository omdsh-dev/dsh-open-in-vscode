/**
 * The dsh-open-in-vscode host Remote service (`ctx.openInVscode`, wire
 * namespace `openInVscode`). Registered as a TypertRemoteService so the Host
 * Gateway's source-mode discovery exports its @Remote method to the Web
 * client under `/api/openInVscode/open` with zero generated artifacts; the
 * strict manifest (typert.ts) is what actually resolves and invokes the
 * endpoint in a profile-loaded bundle.
 */
import { spawn } from 'node:child_process'
import { isAbsolute } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { ResolvedConfig } from './types.ts'
import { resolveEditorCommand } from './resolve.ts'

/**
 * Spawn the configured editor CLI on one directory and settle when the
 * process has launched (the child detaches and outlives the server).
 * @param command - executable resolved through PATH.
 * @param args - extra arguments before the directory path.
 * @param path - absolute directory to open.
 * @param signal - caller lifetime; an abort before launch rejects the open.
 * @returns fulfillment once the launch is accepted.
 */
export function launchEditor(
  command: string,
  args: readonly string[],
  path: string,
  signal?: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(new Error('open-in-vscode: the open request was aborted'))
      return
    }
    const executable = resolveEditorCommand(command)
    const child = spawn(executable, [...args, path], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
    const abort = (): void => { child.kill() }
    signal?.addEventListener('abort', abort, { once: true })
    child.once('error', (error: NodeJS.ErrnoException) => {
      signal?.removeEventListener('abort', abort)
      const hint = error.code === 'ENOENT'
        ? process.platform === 'win32' && command.toLowerCase() === 'code'
          ? '; dsh-open-in-vscode@0.1.5 could not find VS Code on PATH or in its standard per-user/system install locations'
          : `; the "${command}" executable is not on PATH — install the editor CLI or configure the plugin "command"`
        : ''
      reject(new Error(`open-in-vscode: failed to launch "${command}": ${error.message}${hint}`))
    })
    child.once('spawn', () => {
      signal?.removeEventListener('abort', abort)
      child.unref()
      resolve()
    })
  })
}

/** Open-in-editor service: one directory per call, detached editor process. */
export class OpenInVscodeRuntime extends TypertRemoteService {
  /**
   * Register the service under the `openInVscode` key (the wire namespace).
   * @param ctx - owning cordis context.
   * @param config - resolved plugin configuration.
   */
  constructor(
    ctx: Context,
    private readonly config: ResolvedConfig,
  ) {
    super(ctx, 'openInVscode')
  }

  /**
   * Open one absolute directory in the configured editor.
   * @param path - absolute directory path from the workspace row.
   * @param signal - caller lifetime; an abort before launch cancels the open.
   * @returns the accepted launch.
   */
  @Remote
  async open(path: string, signal?: AbortSignal): Promise<{ opened: true }> {
    if (!isAbsolute(path)) {
      throw new Error(`open-in-vscode: refusing a relative path "${path}"`)
    }
    await launchEditor(this.config.command, this.config.args, path, signal)
    return { opened: true }
  }
}
