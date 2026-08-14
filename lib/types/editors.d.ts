import type { EditorCatalog, ResolvedConfig, ResolvedEditor } from './types.ts';
type Exists = (path: string) => boolean;
/** Resolve the complete allowlisted editor registry for one Host process. */
export declare function resolveEditors(config: ResolvedConfig, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv, exists?: Exists): ResolvedEditor[];
/** Convert the private registry into browser-safe metadata. */
export declare function editorCatalog(editors: readonly ResolvedEditor[], configuredDefault: string): EditorCatalog;
export {};
