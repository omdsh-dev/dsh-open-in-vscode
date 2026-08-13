type Exists = (path: string) => boolean;
/** Standard Windows VS Code executable locations, with PATH-derived locations first. */
export declare function candidateWindowsVsCodePaths(env?: NodeJS.ProcessEnv): string[];
/**
 * Resolve only the default `code` command on Windows. Explicit editor
 * commands remain untouched so deployment configuration stays authoritative.
 */
export declare function resolveEditorCommand(command: string, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, exists?: Exists): string;
export {};
