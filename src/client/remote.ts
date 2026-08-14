/**
 * The client-side Typert Remote contribution for the dsh-open-in-vscode host
 * service: mounts the shared strict descriptors into `ctx.remote.openInVscode`.
 * The descriptors and codecs come from the shared contract module, so the
 * browser bundle and the host manifest stay on one wire definition.
 */
import type { RemoteResult, TypertRemoteContribution } from '@deepseek-ai/dsh-typert-protocol'
import { OPEN_IN_VSCODE_INVOCATIONS } from '../contract.ts'
import type { EditorCatalog } from '../types.ts'

/** The openInVscode Remote namespace's client contribution. */
export const OPEN_IN_VSCODE_REMOTE: TypertRemoteContribution = {
  package: 'dsh-open-in-vscode',
  descriptors: OPEN_IN_VSCODE_INVOCATIONS,
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  // Typed face of the mounted namespace. Note: the runtime access is NOT the
  // dotted `ctx.remote.openInVscode` read — that path walks the cordis fiber
  // chain and stops at the Loader's runtime-less internal forks between a
  // plugin entry and the root fiber. The plugin resolves the namespace
  // service through `ctx.reflect.get('remote.openInVscode')` instead (see
  // client/index.ts).
  /** The `openInVscode` namespace face mounted under `ctx.remote.openInVscode`. */
  interface TypertRemoteNamespace$6f70656e496e5673636f6465 {
    list: () => Promise<RemoteResult<EditorCatalog>>
    open: (workspaceId: string, editorId: string, signal?: AbortSignal) => Promise<RemoteResult<{ opened: true }>>
  }
  interface TypertRemoteMap {
    'openInVscode/list': () => Promise<RemoteResult<EditorCatalog>>
    'openInVscode/open': (workspaceId: string, editorId: string, signal?: AbortSignal) => Promise<RemoteResult<{ opened: true }>>
  }
  interface TypertRemoteNamespaceMap {
    openInVscode: TypertRemoteNamespace$6f70656e496e5673636f6465
  }
}
