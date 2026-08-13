/**
 * Package-owned invariant companion for `dsh-open-in-vscode`.
 * @module dsh-open-in-vscode/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = 'dsh-open-in-vscode'

/** Cordis companion plugin name. */
export const name = 'dsh-open-in-vscode-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the open result is derived per call from the live
 * editor process, the strict Typert manifest is a registry-owned
 * registration, and the row-menu slot contribution renders a plain callback
 * face — all proven by the composition spec's disposal assertions rather
 * than by an event-stream relationship.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
