/**
 * Dictionary invariants: zh is the key-set source of truth, en mirrors it
 * completely, and the placeholder filler behaves on both sides.
 */
import { describe, expect, it } from 'vitest'
import { en, fmt, NS, zh } from '../src/client/locales.ts'

describe('the open-in-vscode dictionaries', () => {
  it('shares one key set between zh and en', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(Object.keys(zh).length).toBeGreaterThan(0)
  })

  it('fmt fills placeholders and leaves unknown keys intact', () => {
    expect(fmt('Open {name} in {editor}', { name: 'Project', editor: 'Cursor' })).toBe('Open Project in Cursor')
    expect(fmt('在 {editor} 中打开 {name}', { name: '项目', editor: 'Cursor' })).toBe('在 Cursor 中打开 项目')
    expect(fmt('Open {name} in {editor}', {})).toBe('Open {name} in {editor}')
  })

  it('registers the expected namespace', () => {
    expect(NS).toBe('open-in-vscode')
    expect(zh['menu.openInEditor']).toBe('在 {editor} 中打开')
    expect(en['menu.openInEditor']).toBe('Open in {editor}')
  })
})
