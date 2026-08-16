/**
 * The client-side Typert Remote contribution for the dsh-open-in-vscode host
 * service: mounts the shared strict descriptors into `ctx.remote.openInVscode`.
 * The descriptors and codecs come from the shared contract module, so the
 * browser bundle and the host manifest stay on one wire definition.
 */
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol';
/** The openInVscode Remote namespace's client contribution. */
export declare const OPEN_IN_VSCODE_REMOTE: TypertRemoteContribution;
declare module '@deepseek-ai/dsh-typert-protocol' {
    /** The `openInVscode` namespace face mounted under `ctx.remote.openInVscode`. */
    interface TypertRemoteNamespace$6f70656e496e5673636f6465 {
        open: (path: string, signal?: AbortSignal) => Promise<RemoteResult<{
            opened: true;
        }>>;
        openInExplorer: (path: string, signal?: AbortSignal) => Promise<RemoteResult<{
            opened: true;
        }>>;
        openInPowerShell: (path: string, signal?: AbortSignal) => Promise<RemoteResult<{
            opened: true;
        }>>;
    }
    interface TypertRemoteMap {
        'openInVscode/open': (path: string, signal?: AbortSignal) => Promise<RemoteResult<{
            opened: true;
        }>>;
        'openInVscode/openInExplorer': (path: string, signal?: AbortSignal) => Promise<RemoteResult<{
            opened: true;
        }>>;
        'openInVscode/openInPowerShell': (path: string, signal?: AbortSignal) => Promise<RemoteResult<{
            opened: true;
        }>>;
    }
    interface TypertRemoteNamespaceMap {
        openInVscode: TypertRemoteNamespace$6f70656e496e5673636f6465;
    }
}
