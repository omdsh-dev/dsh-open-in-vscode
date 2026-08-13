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
import { installLegacyWorkspaceMenu } from './legacy-menu.tsx'
import { adoptStyles } from './styles.ts'

/** Required services: slots, the gateway Remote face, and locale. */
export const inject = ['slots', 'remote', 'locale', 'workspaces']

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

  // The latest public npm build (0.1.0-rc.6) predates the Workspace row-menu
  // slot. Keep its DOM adapter live only while that declaration is absent;
  // a newer runtime declaring the slot immediately tears the adapter down.
  ctx.effect(() => {
    let disposeLegacy: (() => void) | undefined
    const reconcile = (): void => {
      const native = ctx.slots.spec('sidebar.workspaces.row-menu') !== undefined
      if (native) {
        disposeLegacy?.()
        disposeLegacy = undefined
      } else if (disposeLegacy === undefined) {
        disposeLegacy = installLegacyWorkspaceMenu({
          workspaces: ctx.workspaces.list,
          workspaceT: ctx.locale.bind('workspace'),
          rowT: ctx.locale.bind(NS),
          open,
        })
      }
    }
    const unsubscribe = ctx.slots.subscribe('sidebar.workspaces.row-menu', reconcile)
    reconcile()
    return () => {
      unsubscribe()
      disposeLegacy?.()
    }
  }, 'dsh-open-in-vscode: rc.6 workspace-menu compatibility')
}
