/**
 * dsh-open-in-vscode host plugin: mounts the `openInVscode` Typert Remote
 * service (open one workspace directory in the configured editor CLI) and
 * registers its strict Typert manifest. The client half ships in the same
 * package (`./client`); the web server serves it under
 * /plugins/dsh-open-in-vscode/client.js, and it registers the "Open in
 * VSCode" row into the harness's workspace overflow-menu slot.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
// Type-only: brings the `ctx.typert` Context merge into this program.
import type {} from '@deepseek-ai/dsh-typert-registry'
import { OpenInVscodeRuntime } from './runtime.ts'
import { TYPERT_MANIFEST } from './typert.ts'
import type { ResolvedConfig } from './types.ts'

/** Cordis plugin name (the Loader entry and client bundle id). */
export const name = 'dsh-open-in-vscode'

/** Services required before load: the Typert registry. */
export const inject = ['typert']

/** Deployment configuration: which editor CLI opens the directory. */
export interface Config {
  /** Executable that opens a directory, resolved through PATH. */
  command: string
  /** Extra arguments passed before the directory path. */
  args: string[]
}

/**
 * Configuration schema: deployment-varying choices stay tunable from
 * cordis.yml. The inferred schema type keeps the callable form accepting
 * partial input, so `Config({})` yields the defaults (what the Loader does
 * for cordis.yml compositions).
 */
export const Config = z.object({
  command: z.string().default('code'),
  args: z.array(z.string()).default([]),
})

/**
 * Mount the open-in-editor service and its strict Typert manifest.
 * @param ctx - host cordis context.
 * @param config - validated plugin configuration (schema defaults applied).
 */
export function apply(ctx: Context, config?: Config): void {
  const resolved: ResolvedConfig = Config(config ?? {})
  new OpenInVscodeRuntime(ctx, resolved)
  // Strict endpoint registration: the gateway resolves openInVscode/open
  // from this manifest, independent of decorator marker state.
  ctx.effect(() => {
    const dispose = ctx.typert.register(TYPERT_MANIFEST)
    return () => { void dispose() }
  }, 'dsh-open-in-vscode: typert manifest')
}
