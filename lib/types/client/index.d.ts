/**
 * dsh-open-in-vscode client plugin: the browser half of the workspace
 * overflow-menu editor launcher. Mounts the openInVscode Remote namespace
 * and registers the split action into the harness's
 * `sidebar.workspaces.row-menu` slot, with zh/en dictionaries. The row's
 * explicit click closes the menu and asks the Host to resolve both the
 * Workspace and the selected editor.
 */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client';
/** Required services: slots, the gateway Remote face, and locale. */
export declare const inject: string[];
/**
 * Compose the workspace overflow-menu row.
 * @param ctx - client root context.
 */
export declare function apply(ctx: ClientContext): void;
