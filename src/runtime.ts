/**
 * The dsh-open-in-vscode host Remote service (`ctx.openInVscode`, wire
 * namespace `openInVscode`). Registered as a TypertRemoteService so the Host
 * Gateway's source-mode discovery exports its @Remote methods to the Web
 * client under `/api/openInVscode/*` with zero generated artifacts; the
 * strict manifest (typert.ts) is what actually resolves and invokes the
 * endpoints in a profile-loaded bundle. The three endpoints open a directory
 * in the configured editor CLI, in Windows Explorer, or in a detached
 * PowerShell window.
 */
import { spawn } from 'node:child_process'
import { isAbsolute } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import type { ResolvedConfig } from './types.ts'
import { resolveEditorCommand, windowsCommandExists } from './resolve.ts'

/**
 * Launch tweaks for {@link launchEditor}: how the directory reaches the child
 * and whether Windows should relaunch through the shell.
 */
export interface LaunchEditorOptions {
  /** Keep `path` out of the argv (the child gets it through `cwd` instead). */
  appendPath?: boolean
  /** Start the child in this directory. */
  cwd?: string
  /**
   * Windows only: relaunch the command through cmd /c start (ShellExecute)
   * so GUI and console windows get a real, foreground window — direct spawn
   * from a background service never activates a GUI window, and console apps
   * would be hidden by detached + CREATE_NO_WINDOW. Used only when the launch
   * target resolves to an existing file; otherwise the direct spawn stays, so
   * a missing executable still fails loud with a fix hint. The new window's
   * working directory is the spawned cmd's cwd, and path still reaches the
   * child through argv unless appendPath is false.
   */
  shellOpen?: boolean
}

/**
 * Spawn the configured editor CLI on one directory and settle when the
 * process has launched (the child detaches and outlives the server).
 * @param command - executable resolved through PATH.
 * @param args - extra arguments before the directory path.
 * @param path - absolute directory to open.
 * @param signal - caller lifetime; an abort before launch rejects the open.
 * @param options - launch tweaks (see {@link LaunchEditorOptions}).
 * @returns fulfillment once the launch is accepted.
 */
export function launchEditor(
  command: string,
  args: readonly string[],
  path: string,
  signal?: AbortSignal,
  options: LaunchEditorOptions = {},
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted === true) {
      reject(new Error('open-in-vscode: the open request was aborted'))
      return
    }
    let executable = resolveEditorCommand(command)
    let argv = options.appendPath === false ? [...args] : [...args, path]
    if (options.shellOpen === true && process.platform === 'win32') {
      // cmd /c start needs the resolved executable (a bare code would depend
      // on PATH's code.cmd) and the directory still travels as argv (the old
      // branch dropped it, so Explorer opened its default location).
      const target = executable
      if (windowsCommandExists(target)) {
        executable = 'cmd.exe'
        argv = ['/c', 'start', '', target, ...args]
        if (options.appendPath !== false) argv.push(path)
      }
    }
    const child = spawn(executable, argv, {
      detached: true,
      stdio: 'ignore',
      windowsHide: false,
      ...(options.cwd === undefined ? {} : { cwd: options.cwd }),
    })
    const abort = (): void => { child.kill() }
    signal?.addEventListener('abort', abort, { once: true })
    child.once('error', (error: NodeJS.ErrnoException) => {
      signal?.removeEventListener('abort', abort)
      const hint = error.code === 'ENOENT'
        ? process.platform === 'win32' && command.toLowerCase() === 'code'
          ? '; dsh-open-in-vscode@0.1.6 could not find VS Code on PATH or in its standard per-user/system install locations'
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
    // Windows: relaunch through cmd /c start so the editor window opens in
    // the foreground instead of blinking in the taskbar (direct spawn from a
    // background service never activates a GUI window).
    await launchEditor(this.config.command, this.config.args, path, signal, { shellOpen: true })
    return { opened: true }
  }

  /**
   * Open one absolute directory in Windows Explorer.
   * @param path - absolute directory path from the workspace row.
   * @param signal - caller lifetime; an abort before launch cancels the open.
   * @returns the accepted launch.
   */
  @Remote
  async openInExplorer(path: string, signal?: AbortSignal): Promise<{ opened: true }> {
    if (!isAbsolute(path)) {
      throw new Error(`open-in-vscode: refusing a relative path "${path}"`)
    }
    await launchEditor('explorer', [], path, signal, { shellOpen: true })
    return { opened: true }
  }

  /**
   * Open one absolute directory in a detached PowerShell window.
   * @param path - absolute directory path from the workspace row.
   * @param signal - caller lifetime; an abort before launch cancels the open.
   * @returns the accepted launch.
   */
  @Remote
  async openInPowerShell(path: string, signal?: AbortSignal): Promise<{ opened: true }> {
    if (!isAbsolute(path)) {
      throw new Error(`open-in-vscode: refusing a relative path "${path}"`)
    }
    await launchEditor('pwsh', ['-NoExit'], path, signal, {
      appendPath: false,
      cwd: path,
      shellOpen: true,
    })
    return { opened: true }
  }
}
