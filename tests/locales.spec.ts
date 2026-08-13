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
    expect(fmt('Open {name} in VSCode', { name: 'Project' })).toBe('Open Project in VSCode')
    expect(fmt('在 VSCode 中打开 {name}', { name: '项目' })).toBe('在 VSCode 中打开 项目')
    expect(fmt('Open {name} in VSCode', {})).toBe('Open {name} in VSCode')
  })

  it('registers the expected namespace', () => {
    expect(NS).toBe('open-in-vscode')
    expect(zh['menu.openInVscode']).toBe('在 VSCode 中打开')
    expect(en['menu.openInVscode']).toBe('Open in VSCode')
  })
})
