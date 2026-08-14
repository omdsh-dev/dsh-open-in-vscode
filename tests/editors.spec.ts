import { describe, expect, it } from 'vitest'
import { editorCatalog, resolveEditors } from '../src/editors.ts'
import type { ResolvedConfig } from '../src/types.ts'

function config(overrides: Partial<ResolvedConfig> = {}): ResolvedConfig {
  return {
    command: 'code',
    args: [],
    label: 'Visual Studio Code',
    autoDetect: true,
    editors: [],
    defaultEditor: 'vscode',
    ...overrides,
  }
}

describe('editor registry resolution', () => {
  it('keeps the configured default and adds only available macOS built-ins', () => {
    const installed = new Set([
      '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code',
      '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
      '/usr/bin/open',
    ])
    const editors = resolveEditors(config(), 'darwin', { PATH: '/usr/bin' }, path => installed.has(path))
    expect(editors.map(editor => [editor.id, editor.available])).toEqual([
      ['vscode', true],
      ['cursor', true],
      ['terminal', true],
      ['finder', true],
    ])
    expect(editors.find(editor => editor.id === 'cursor')).toMatchObject({
      command: '/Applications/Cursor.app/Contents/Resources/app/bin/cursor',
      args: [],
    })
  })

  it('retains missing configured editors with a fix hint and hides missing built-ins', () => {
    const editors = resolveEditors(config({
      command: '/missing/code',
      editors: [{ id: 'fleet', label: 'Fleet', command: 'fleet', args: ['--wait'] }],
    }), 'linux', { PATH: '/usr/bin' }, () => false)
    expect(editors).toEqual([
      expect.objectContaining({ id: 'vscode', available: false, hint: expect.stringContaining('/missing/code') }),
      expect.objectContaining({ id: 'fleet', available: false, hint: expect.stringContaining('fleet') }),
    ])
  })

  it('honors custom arguments and disables automatic discovery', () => {
    const editors = resolveEditors(config({
      command: '/bin/code',
      args: ['--reuse-window'],
      autoDetect: false,
      editors: [{ id: 'custom', label: 'Custom Editor', command: '/bin/custom', args: ['open'] }],
    }), 'linux', {}, path => path.startsWith('/bin/'))
    expect(editors).toEqual([
      expect.objectContaining({ id: 'vscode', command: '/bin/code', args: ['--reuse-window'], available: true }),
      expect.objectContaining({ id: 'custom', command: '/bin/custom', args: ['open'], available: true }),
    ])
  })

  it('fails load-time validation for duplicate or unsafe ids', () => {
    expect(() => resolveEditors(config({
      editors: [{ id: 'vscode', label: 'Duplicate', command: 'other', args: [] }],
    }), 'linux', {}, () => true)).toThrow(/duplicate editor id/)
    expect(() => resolveEditors(config({
      editors: [{ id: '../escape', label: 'Unsafe', command: 'other', args: [] }],
    }), 'linux', {}, () => true)).toThrow(/invalid editor id/)
  })

  it('selects an available configured default and publishes no commands', () => {
    const editors = resolveEditors(config({
      command: '/bin/code',
      autoDetect: false,
      defaultEditor: 'fleet',
      editors: [{ id: 'fleet', label: 'Fleet', command: '/bin/fleet', args: [] }],
    }), 'linux', {}, () => true)
    const catalog = editorCatalog(editors, 'fleet')
    expect(catalog.defaultEditorId).toBe('fleet')
    expect(catalog.editors).toEqual([
      { id: 'vscode', label: 'Visual Studio Code', available: true },
      { id: 'fleet', label: 'Fleet', available: true },
    ])
    expect(JSON.stringify(catalog)).not.toContain('/bin/')
  })
})
