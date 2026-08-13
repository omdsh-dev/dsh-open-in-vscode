/**
 * dsh-open-in-vscode client plugin: the browser half of the workspace
 * overflow-menu "Open in VSCode" row. Mounts the openInVscode Remote
 * namespace and registers the row into the harness's
 * `sidebar.workspaces.row-menu` slot, with zh/en dictionaries. The row's
 * click closes the menu and asks the host to launch the editor on the
 * workspace directory.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the ui-workspace SlotMap merge (the row-menu owner share).
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
// Type-only: brings the ctx.locale Context merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import { OPEN_IN_VSCODE_REMOTE } from './remote.ts'
import { NS, en, zh } from './locales.ts'
import { OpenInVscodeRow, type OpenInVscodeInjected } from './row.tsx'
import { adoptStyles } from './styles.ts'

/** Required services: slots, the gateway Remote face, and locale. */
export const inject = ['slots', 'remote', 'locale']

/** The mounted openInVscode namespace service's callable face. */
interface OpenInVscodeNamespaceFace {
  open(path: string, signal?: AbortSignal): Promise<
    { ok: true; value: { opened: true } } | { ok: false; error: { code: string; message: string; details: object } }
  >
}

/**
 * Compose the workspace overflow-menu row.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  adoptStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-open-in-vscode: dictionaries')

  // The mounted namespace handle resolves through the service store
  // (`ctx.reflect.get`), not through `ctx.remote.openInVscode`: the
  // generated-style dotted read walks the cordis fiber chain, which stops at
  // the Loader's runtime-less internal forks between a plugin entry and the
  // root fiber — the namespace service mounted under the gateway entry is
  // unreachable that way (the store path resolves it by isolation label).
  let openInVscode: OpenInVscodeNamespaceFace | undefined
  ctx.effect(async () => {
    const dispose = await ctx.remote.$mount(OPEN_IN_VSCODE_REMOTE)
    openInVscode = (ctx.reflect as unknown as { get(name: string): unknown })
      .get('remote.openInVscode') as OpenInVscodeNamespaceFace | undefined
    if (openInVscode === undefined) {
      throw new Error('dsh-open-in-vscode: the openInVscode Remote namespace did not mount')
    }
    return () => {
      openInVscode = undefined
      void dispose()
    }
  }, 'dsh-open-in-vscode: remote')

  const open = async (path: string): Promise<void> => {
    if (openInVscode === undefined) {
      throw new Error('dsh-open-in-vscode: the openInVscode Remote is not mounted')
    }
    const result = await openInVscode.open(path)
    if (!result.ok) {
      throw new Error(`open-in-vscode: ${result.error.code}: ${result.error.message}`)
    }
  }

  ctx.slots.inject('sidebar.workspaces.row-menu', () => ctx.slots.register({
    name: 'sidebar.workspaces.row-menu',
    locale: NS,
    inject: (): OpenInVscodeInjected => ({ open }),
  }, OpenInVscodeRow))
}
