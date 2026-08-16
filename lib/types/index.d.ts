/**
 * dsh-open-in-vscode host plugin: mounts the `openInVscode` Typert Remote
 * service (open one workspace directory in the configured editor CLI, in
 * Windows Explorer, or in a detached PowerShell window) and registers its
 * strict Typert manifest. The client half ships in the same package
 * (`./client`); the web server serves it under
 * /plugins/dsh-open-in-vscode/client.js, and it registers the "Open in
 * VSCode / Explorer / PowerShell" rows into the harness's workspace
 * overflow-menu slot.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Cordis plugin name (the Loader entry and client bundle id). */
export declare const name = "dsh-open-in-vscode";
/** Services required before load: the Typert registry. */
export declare const inject: string[];
/** Deployment configuration: which editor CLI opens the directory. */
export interface Config {
    /** Executable that opens a directory, resolved through PATH. */
    command: string;
    /** Extra arguments passed before the directory path. */
    args: string[];
}
/**
 * Configuration schema: deployment-varying choices stay tunable from
 * cordis.yml. The inferred schema type keeps the callable form accepting
 * partial input, so `Config({})` yields the defaults (what the Loader does
 * for cordis.yml compositions).
 */
export declare const Config: z<Schemastery.ObjectS<{
    command: z<string, string>;
    args: z<string[], string[]>;
}>, Schemastery.ObjectT<{
    command: z<string, string>;
    args: z<string[], string[]>;
}>>;
/**
 * Mount the open-in-editor service and its strict Typert manifest.
 * @param ctx - host cordis context.
 * @param config - validated plugin configuration (schema defaults applied).
 */
export declare function apply(ctx: Context, config?: Config): void;
