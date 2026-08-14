import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { EditorCatalog, ResolvedEditor } from './types.ts';
/**
 * Spawn one resolved editor command on a Workspace directory and settle when the
 * process has launched (the child detaches and outlives the server).
 * @param command - executable resolved through PATH.
 * @param args - extra arguments before the directory path.
 * @param path - absolute directory to open.
 * @param signal - caller lifetime; an abort before launch rejects the open.
 * @returns fulfillment once the launch is accepted.
 */
export declare function launchEditor(command: string, args: readonly string[], path: string, signal?: AbortSignal): Promise<void>;
/** Host-side editor catalog and registered-Workspace launch service. */
export declare class OpenInVscodeRuntime extends TypertRemoteService {
    private readonly editors;
    private readonly catalog;
    /**
     * Register the service under the `openInVscode` key (the wire namespace).
     * @param ctx - owning cordis context.
     * @param editors - resolved allowlisted launch targets.
     * @param configuredDefault - preferred editor id from Host configuration.
     */
    constructor(ctx: Context, editors: readonly ResolvedEditor[], configuredDefault: string);
    /** Return browser-safe editor metadata without commands or arguments. */
    list(): EditorCatalog;
    /**
     * Open one registered Workspace in one allowlisted editor.
     * @param workspaceId - stable Host Workspace id from the row owner share.
     * @param editorId - id from {@link list}; never a command.
     * @param signal - caller lifetime; an abort before launch cancels the open.
     * @returns the accepted launch.
     */
    open(workspaceId: string, editorId: string, signal?: AbortSignal): Promise<{
        opened: true;
    }>;
}
