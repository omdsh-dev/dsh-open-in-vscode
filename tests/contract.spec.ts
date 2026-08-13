/**
 * Wire-contract invariants: exactly one strict endpoint, one descriptor set
 * shared verbatim by the host manifest and the client contribution, and
 * boundary codecs that parse and reject their values.
 */
import { describe, expect, it } from 'vitest'
import { OPEN_IN_VSCODE_INVOCATIONS, openResultSchema, pathSchema } from '../src/contract.ts'
import { OPEN_IN_VSCODE_REMOTE } from '../src/client/remote.ts'
import { TYPERT_MANIFEST } from '../src/typert.ts'

describe('the openInVscode wire contract', () => {
  it('declares exactly one strict endpoint shared by host and client', () => {
    expect(OPEN_IN_VSCODE_INVOCATIONS).toHaveLength(1)
    const [invocation] = OPEN_IN_VSCODE_INVOCATIONS
    expect(invocation).toMatchObject({
      id: 'dsh-open-in-vscode#openInVscode/open',
      service: 'openInVscode',
      namespace: 'openInVscode',
      method: 'open',
      invocation: { kind: 'direct' },
      cancellation: { parameter: 'signal' },
    })
    expect(invocation.parameters).toEqual([
      expect.objectContaining({ name: 'path', wire: 'path', source: 'json' }),
    ])
    expect(invocation.result).toMatchObject({ mode: 'strict', typeSymbol: 'dsh-open-in-vscode#OpenResult' })
    // One source pins the wire: the manifest and the client contribution
    // reference the same descriptor array, never a copy.
    expect(TYPERT_MANIFEST.invocations).toBe(OPEN_IN_VSCODE_INVOCATIONS)
    expect(OPEN_IN_VSCODE_REMOTE.descriptors).toBe(OPEN_IN_VSCODE_INVOCATIONS)
    expect(TYPERT_MANIFEST.package).toBe('dsh-open-in-vscode')
    expect(OPEN_IN_VSCODE_REMOTE.package).toBe('dsh-open-in-vscode')
  })

  it('codecs parse and reject their boundary values', () => {
    expect(pathSchema.parse('/tmp/workspace')).toBe('/tmp/workspace')
    expect(() => pathSchema.parse('')).toThrow()
    expect(openResultSchema.parse({ opened: true })).toEqual({ opened: true })
    expect(() => openResultSchema.parse({ opened: false })).toThrow()
    const [invocation] = OPEN_IN_VSCODE_INVOCATIONS
    expect(invocation.parameters[0]!.codec).toMatchObject({ mode: 'strict', typeSymbol: 'dsh-open-in-vscode#Path' })
    expect(invocation.result).toMatchObject({ mode: 'strict' })
  })
})
