/**
 * The open-in-vscode wire contract, shared verbatim by the host manifest
 * (`ctx.typert.register` in typert.ts) and the client contribution
 * (`ctx.remote.$mount` in client/remote.ts). The endpoints open one absolute
 * directory in the configured editor CLI, in Windows Explorer, or in a
 * detached PowerShell window; the workspace row's directory travels as a
 * plain JSON string (no Host object lookup needed).
 */
import { z } from 'zod'
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol'

/** Wire codec: the absolute directory path to open. */
export const pathSchema = z.string().min(1)

/** Wire codec: the open result — the launch was accepted. */
export const openResultSchema = z.object({ opened: z.literal(true) }).readonly()

/** One strict invocation: open an absolute directory through the host service. */
function openInvocation(method: string): InvocationDescriptor {
  return {
    id: `dsh-open-in-vscode#openInVscode/${method}`,
    service: 'openInVscode',
    namespace: 'openInVscode',
    method,
    invocation: { kind: 'direct' },
    parameters: [
      {
        name: 'path',
        wire: 'path',
        source: 'json',
        codec: { mode: 'strict', typeSymbol: 'dsh-open-in-vscode#Path', schema: pathSchema },
      },
    ],
    cancellation: { parameter: 'signal' },
    result: {
      mode: 'strict',
      typeSymbol: 'dsh-open-in-vscode#OpenResult',
      schema: openResultSchema,
    },
  }
}

/** The openInVscode Remote namespace's strict invocation descriptors. */
export const OPEN_IN_VSCODE_INVOCATIONS: readonly InvocationDescriptor[] = [
  openInvocation('open'),
  openInvocation('openInExplorer'),
  openInvocation('openInPowerShell'),
]
