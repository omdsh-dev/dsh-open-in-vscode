import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { ResolvedConfig } from './types.ts';
/**
 * Spawn the configured editor CLI on one directory and settle when the
 * process has launched (the child detaches and outlives the server).
 * @param command - executable resolved through PATH.
 * @param args - extra arguments before the directory path.
 * @param path - absolute directory to open.
 * @param signal - caller lifetime; an abort before launch rejects the open.
 * @returns fulfillment once the launch is accepted.
 */
export declare function launchEditor(command: string, args: readonly string[], path: string, signal?: AbortSignal): Promise<void>;
/** Open-in-editor service: one directory per call, detached editor process. */
export declare class OpenInVscodeRuntime extends TypertRemoteService {
    private readonly config;
    /**
     * Register the service under the `openInVscode` key (the wire namespace).
     * @param ctx - owning cordis context.
     * @param config - resolved plugin configuration.
     */
    constructor(ctx: Context, config: ResolvedConfig);
    /**
     * Open one absolute directory in the configured editor.
     * @param path - absolute directory path from the workspace row.
     * @param signal - caller lifetime; an abort before launch cancels the open.
     * @returns the accepted launch.
     */
    open(path: string, signal?: AbortSignal): Promise<{
        opened: true;
    }>;
}
