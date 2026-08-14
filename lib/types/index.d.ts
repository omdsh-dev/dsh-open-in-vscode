/**
 * dsh-open-in-vscode host plugin: mounts the `openInVscode` Typert Remote
 * service (list available editors and open a registered Workspace) and
 * registers its strict Typert manifest. The client half ships in the same
 * package (`./client`); the web server serves it under
 * /plugins/dsh-open-in-vscode/client.js, and it registers the split editor
 * launcher into the harness's Workspace overflow-menu slot.
 */
import type { Context } from '@deepseek-ai/cordis';
import z from '@deepseek-ai/schemastery';
/** Cordis plugin name (the Loader entry and client bundle id). */
export declare const name = "dsh-open-in-vscode";
/** Services required before load: Typert and the authoritative Workspace registry. */
export declare const inject: string[];
/** Deployment configuration: editor discovery, allowlist, and default choice. */
export interface Config {
    /** Backward-compatible default editor executable, resolved through PATH. */
    command?: string;
    /** Backward-compatible default editor arguments before the directory. */
    args?: string[];
    /** Backward-compatible default editor display label. */
    label?: string;
    /** Discover available built-in editor profiles for this Host platform. */
    autoDetect?: boolean;
    /** Additional allowlisted editor profiles. */
    editors?: Array<{
        id: string;
        label: string;
        command: string;
        args?: string[];
    }>;
    /** Editor id selected before the browser remembers a user choice. */
    defaultEditor?: string;
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
    label: z<string, string>;
    autoDetect: z<boolean, boolean>;
    editors: z<({
        id?: string | null | undefined;
        label?: string | null | undefined;
        command?: string | null | undefined;
        args?: string[] | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict)[], Schemastery.ObjectT<{
        id: z<string, string>;
        label: z<string, string>;
        command: z<string, string>;
        args: z<string[], string[]>;
    }>[]>;
    defaultEditor: z<string, string>;
}>, Schemastery.ObjectT<{
    command: z<string, string>;
    args: z<string[], string[]>;
    label: z<string, string>;
    autoDetect: z<boolean, boolean>;
    editors: z<({
        id?: string | null | undefined;
        label?: string | null | undefined;
        command?: string | null | undefined;
        args?: string[] | null | undefined;
    } & import("@deepseek-ai/cosmokit").Dict)[], Schemastery.ObjectT<{
        id: z<string, string>;
        label: z<string, string>;
        command: z<string, string>;
        args: z<string[], string[]>;
    }>[]>;
    defaultEditor: z<string, string>;
}>>;
/**
 * Mount the open-in-editor service and its strict Typert manifest.
 * @param ctx - host cordis context.
 * @param config - validated plugin configuration (schema defaults applied).
 */
export declare function apply(ctx: Context, config?: Config): void;
