/**
 * Wire-contract invariants: exactly two strict endpoints, one descriptor set
 * shared verbatim by the Host manifest and the client contribution, and
 * boundary codecs that parse and reject their values.
 */
import { describe, expect, it } from 'vitest'
import {
  OPEN_IN_VSCODE_INVOCATIONS,
  editorCatalogSchema,
  editorIdSchema,
  openResultSchema,
  workspaceIdSchema,
} from '../src/contract.ts'
import { OPEN_IN_VSCODE_REMOTE } from '../src/client/remote.ts'
import { TYPERT_MANIFEST } from '../src/typert.ts'

describe('the openInVscode wire contract', () => {
  it('declares the two strict endpoints shared by host and client', () => {
    expect(OPEN_IN_VSCODE_INVOCATIONS).toHaveLength(2)
    const [list, open] = OPEN_IN_VSCODE_INVOCATIONS
    expect(list).toMatchObject({
      id: 'dsh-open-in-vscode#openInVscode/list',
      method: 'list',
      parameters: [],
      result: { mode: 'strict', typeSymbol: 'dsh-open-in-vscode#EditorCatalog' },
    })
    expect(open).toMatchObject({
      id: 'dsh-open-in-vscode#openInVscode/open',
      service: 'openInVscode',
      namespace: 'openInVscode',
      method: 'open',
      invocation: { kind: 'direct' },
      cancellation: { parameter: 'signal' },
    })
    expect(open.parameters).toEqual([
      expect.objectContaining({ name: 'workspaceId', wire: 'workspaceId', source: 'json' }),
      expect.objectContaining({ name: 'editorId', wire: 'editorId', source: 'json' }),
    ])
    expect(open.result).toMatchObject({ mode: 'strict', typeSymbol: 'dsh-open-in-vscode#OpenResult' })
    // One source pins the wire: the manifest and the client contribution
    // reference the same descriptor array, never a copy.
    expect(TYPERT_MANIFEST.invocations).toBe(OPEN_IN_VSCODE_INVOCATIONS)
    expect(OPEN_IN_VSCODE_REMOTE.descriptors).toBe(OPEN_IN_VSCODE_INVOCATIONS)
    expect(TYPERT_MANIFEST.package).toBe('dsh-open-in-vscode')
    expect(OPEN_IN_VSCODE_REMOTE.package).toBe('dsh-open-in-vscode')
  })

  it('codecs parse and reject their boundary values', () => {
    expect(workspaceIdSchema.parse('workspace-1')).toBe('workspace-1')
    expect(editorIdSchema.parse('cursor')).toBe('cursor')
    expect(() => workspaceIdSchema.parse('')).toThrow()
    expect(() => editorIdSchema.parse('')).toThrow()
    expect(editorCatalogSchema.parse({
      editors: [{ id: 'cursor', label: 'Cursor', available: true }],
      defaultEditorId: 'cursor',
    })).toMatchObject({ defaultEditorId: 'cursor' })
    expect(() => editorCatalogSchema.parse({ editors: [], defaultEditorId: '' })).toThrow()
    expect(openResultSchema.parse({ opened: true })).toEqual({ opened: true })
    expect(() => openResultSchema.parse({ opened: false })).toThrow()
    const open = OPEN_IN_VSCODE_INVOCATIONS[1]!
    expect(open.parameters[0]!.codec).toMatchObject({ mode: 'strict', typeSymbol: 'dsh-open-in-vscode#WorkspaceId' })
    expect(open.parameters[1]!.codec).toMatchObject({ mode: 'strict', typeSymbol: 'dsh-open-in-vscode#EditorId' })
    expect(open.result).toMatchObject({ mode: 'strict' })
  })
})
