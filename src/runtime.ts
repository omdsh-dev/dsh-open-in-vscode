/**
 * The dsh-open-in-vscode host Remote service (`ctx.openInVscode`, wire
 * namespace `openInVscode`). Registered as a TypertRemoteService so the Host
 * Gateway's source-mode discovery exports its @Remote method to the Web
 * client under `/api/openInVscode/open` with zero generated artifacts; the
 * strict manifest (typert.ts) is what actually resolves and invokes the
 * endpoint in a profile-loaded bundle.
 */
import { spawn } from 'node:child_process'
import type { Context } from '@deepseek-ai/cordis'
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import { WorkspaceId } from '@deepseek-ai/dsh-workspace'
import { editorCatalog } from './editors.ts'
import type { EditorCatalog, ResolvedEditor } from './types.ts'

/**
 * Spawn one resolved editor command on a Workspace directory and settle when the
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
    const child = spawn(command, [...args, path], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
    const abort = (): void => { child.kill() }
    signal?.addEventListener('abort', abort, { once: true })
    child.once('error', (error: NodeJS.ErrnoException) => {
      signal?.removeEventListener('abort', abort)
      const hint = error.code === 'ENOENT'
        ? `; the "${command}" executable is unavailable — install it or update the plugin editor configuration`
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

/** Host-side editor catalog and registered-Workspace launch service. */
export class OpenInVscodeRuntime extends TypertRemoteService {
  private readonly editors: ReadonlyMap<string, ResolvedEditor>
  private readonly catalog: EditorCatalog

  /**
   * Register the service under the `openInVscode` key (the wire namespace).
   * @param ctx - owning cordis context.
   * @param editors - resolved allowlisted launch targets.
   * @param configuredDefault - preferred editor id from Host configuration.
   */
  constructor(
    ctx: Context,
    editors: readonly ResolvedEditor[],
    configuredDefault: string,
  ) {
    super(ctx, 'openInVscode')
    this.editors = new Map(editors.map(editor => [editor.id, editor]))
    this.catalog = editorCatalog(editors, configuredDefault)
  }

  /** Return browser-safe editor metadata without commands or arguments. */
  @Remote
  list(): EditorCatalog {
    return this.catalog
  }

  /**
   * Open one registered Workspace in one allowlisted editor.
   * @param workspaceId - stable Host Workspace id from the row owner share.
   * @param editorId - id from {@link list}; never a command.
   * @param signal - caller lifetime; an abort before launch cancels the open.
   * @returns the accepted launch.
   */
  @Remote
  async open(workspaceId: string, editorId: string, signal?: AbortSignal): Promise<{ opened: true }> {
    const workspace = this.ctx.workspaceRegistry.get(WorkspaceId(workspaceId))
    if (workspace === undefined) {
      throw new Error(`open-in-vscode: unknown workspace "${workspaceId}"`)
    }
    if (await workspace.status() !== 'ok') {
      throw new Error(`open-in-vscode: workspace directory is missing for "${workspaceId}"`)
    }
    const editor = this.editors.get(editorId)
    if (editor === undefined) {
      throw new Error(`open-in-vscode: unknown editor "${editorId}"`)
    }
    if (!editor.available) {
      throw new Error(`open-in-vscode: editor "${editorId}" is unavailable${editor.hint === undefined ? '' : `; ${editor.hint}`}`)
    }
    await launchEditor(editor.command, editor.args, workspace.path, signal)
    return { opened: true }
  }
}
