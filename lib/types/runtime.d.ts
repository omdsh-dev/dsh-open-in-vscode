import type { Context } from '@deepseek-ai/cordis';
import { TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol';
import type { ResolvedConfig } from './types.ts';
/**
 * Launch tweaks for {@link launchEditor}: how the directory reaches the child
 * and whether Windows should relaunch through the shell.
 */
export interface LaunchEditorOptions {
    /** Keep `path` out of the argv (the child gets it through `cwd` instead). */
    appendPath?: boolean;
    /** Start the child in this directory. */
    cwd?: string;
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
    shellOpen?: boolean;
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
export declare function launchEditor(command: string, args: readonly string[], path: string, signal?: AbortSignal, options?: LaunchEditorOptions): Promise<void>;
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
    /**
     * Open one absolute directory in Windows Explorer.
     * @param path - absolute directory path from the workspace row.
     * @param signal - caller lifetime; an abort before launch cancels the open.
     * @returns the accepted launch.
     */
    openInExplorer(path: string, signal?: AbortSignal): Promise<{
        opened: true;
    }>;
    /**
     * Open one absolute directory in a detached PowerShell window.
     * @param path - absolute directory path from the workspace row.
     * @param signal - caller lifetime; an abort before launch cancels the open.
     * @returns the accepted launch.
     */
    openInPowerShell(path: string, signal?: AbortSignal): Promise<{
        opened: true;
    }>;
}
