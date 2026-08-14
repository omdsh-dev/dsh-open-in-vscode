/**
 * The open-in-vscode wire contract, shared verbatim by the host manifest
 * (`ctx.typert.register` in typert.ts) and the client contribution
 * (`ctx.remote.$mount` in client/remote.ts). The list endpoint publishes safe
 * editor metadata; the open endpoint accepts only a registered Workspace id
 * and an editor id from that catalog.
 */
import { z } from 'zod'
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'

/** Wire codec: a stable Host Workspace id. */
export const workspaceIdSchema = z.string().min(1)

/** Wire codec: an editor id from the Host-published catalog. */
export const editorIdSchema = z.string().min(1)

/** Wire codec: one browser-safe editor view. */
export const editorViewSchema = z.object({
  id: editorIdSchema,
  label: z.string().min(1),
  available: z.boolean(),
  hint: z.string().optional(),
}).readonly()

/** Wire codec: the Host editor catalog. */
export const editorCatalogSchema = z.object({
  editors: z.array(editorViewSchema),
  defaultEditorId: editorIdSchema,
}).readonly()

/** Wire codec: the open result — the editor launch was accepted. */
export const openResultSchema = z.object({ opened: z.literal(true) }).readonly()

/** The openInVscode Remote namespace's strict invocation descriptors. */
export const OPEN_IN_VSCODE_INVOCATIONS: readonly InvocationDescriptor[] = [
  {
    id: 'dsh-open-in-vscode#openInVscode/list',
    service: 'openInVscode',
    namespace: 'openInVscode',
    method: 'list',
    invocation: { kind: 'direct' },
    parameters: [],
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-open-in-vscode#EditorCatalog',
      schema: editorCatalogSchema,
    },
  },
  {
    id: 'dsh-open-in-vscode#openInVscode/open',
    service: 'openInVscode',
    namespace: 'openInVscode',
    method: 'open',
    invocation: { kind: 'direct' },
    parameters: [
      {
        name: 'workspaceId',
        wire: 'workspaceId',
        source: 'json',
        codec: { mode: 'strict', typeSymbol: 'dsh-open-in-vscode#WorkspaceId', schema: workspaceIdSchema },
      },
      {
        name: 'editorId',
        wire: 'editorId',
        source: 'json',
        codec: { mode: 'strict', typeSymbol: 'dsh-open-in-vscode#EditorId', schema: editorIdSchema },
      },
    ],
    cancellation: { parameter: 'signal' },
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-open-in-vscode#OpenResult',
      schema: openResultSchema,
    },
  },
]
