type Exists = (path: string) => boolean;
/** Standard Windows VS Code executable locations, with PATH-derived locations first. */
export declare function candidateWindowsVsCodePaths(env?: NodeJS.ProcessEnv): string[];
/**
 * Resolve whether a Windows launch target exists for the `cmd /c start`
 * relaunch: absolute paths check the filesystem, bare names walk PATH with
 * the PATHEXT suffixes. System shells (explorer, pwsh) and the resolved
 * editor path pass through the same rule; a miss means `start` would fail,
 * so the caller keeps the direct-spawn error path instead. Relative paths
 * (containing a separator but not absolute) are not resolvable this way and
 * report a miss.
 */
export declare function windowsCommandExists(command: string, env?: NodeJS.ProcessEnv, exists?: Exists): boolean;
/**
 * Resolve only the default `code` command on Windows. Explicit editor
 * commands remain untouched so deployment configuration stays authoritative.
 */
export declare function resolveEditorCommand(command: string, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, exists?: Exists): string;
export {};
