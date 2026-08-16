import { win32 } from 'node:path'
import { describe, expect, it } from 'vitest'
import { candidateWindowsVsCodePaths, resolveEditorCommand, windowsCommandExists } from '../src/resolve.ts'

describe('Windows VS Code command resolution', () => {
  it('finds PATH, per-user, and system Code.exe locations in order', () => {
    expect(candidateWindowsVsCodePaths({
      PATH: '"D:\\VS Code\\bin";E:\\portable',
      LOCALAPPDATA: 'C:\\Users\\Ada\\AppData\\Local',
      ProgramFiles: 'C:\\Program Files',
      'ProgramFiles(x86)': 'C:\\Program Files (x86)',
    })).toEqual([
      win32.join('D:\\VS Code\\bin', 'Code.exe'),
      win32.resolve('D:\\VS Code\\bin', '..', 'Code.exe'),
      win32.join('E:\\portable', 'Code.exe'),
      win32.join('C:\\Users\\Ada\\AppData\\Local', 'Programs', 'Microsoft VS Code', 'Code.exe'),
      win32.join('C:\\Program Files', 'Microsoft VS Code', 'Code.exe'),
      win32.join('C:\\Program Files (x86)', 'Microsoft VS Code', 'Code.exe'),
    ])
  })

  it('uses the first installed standard location for the default command', () => {
    const installed = win32.join('C:\\Users\\Ada\\AppData\\Local', 'Programs', 'Microsoft VS Code', 'Code.exe')
    expect(resolveEditorCommand('code', 'win32', {
      LOCALAPPDATA: 'C:\\Users\\Ada\\AppData\\Local',
      ProgramFiles: 'C:\\Program Files',
    }, candidate => candidate === installed)).toBe(installed)
  })

  it('preserves custom commands and the PATH fallback', () => {
    expect(resolveEditorCommand('cursor', 'win32', {}, () => false)).toBe('cursor')
    expect(resolveEditorCommand('code', 'win32', {}, () => false)).toBe('code')
    expect(resolveEditorCommand('code', 'darwin', {}, () => true)).toBe('code')
  })
})

describe('windowsCommandExists', () => {
  it('checks absolute paths directly', () => {
    expect(windowsCommandExists('C:\\tools\\editor.exe', { PATH: '' }, () => true)).toBe(true)
    expect(windowsCommandExists('C:\\tools\\editor.exe', { PATH: '' }, () => false)).toBe(false)
  })

  it('finds a bare command through PATH with the default PATHEXT suffixes', () => {
    const exists = (p: string) => p === 'C:\\bin\\editor.exe'
    expect(windowsCommandExists('editor', { PATH: 'C:\\bin' }, exists)).toBe(true)
    expect(windowsCommandExists('editor', { PATH: 'C:\\bin' }, () => false)).toBe(false)
  })

  it('honors PATHEXT, quoted PATH entries, and extensionless executables', () => {
    const exists = (p: string) => p === 'C:\\bin\\editor.cmd' || p === 'C:\\bin\\node'
    expect(windowsCommandExists('editor', { PATH: '"C:\\bin";', PATHEXT: '.CMD' }, exists)).toBe(true)
    expect(windowsCommandExists('node', { PATH: 'C:\\bin', PATHEXT: '.COM;.EXE' }, exists)).toBe(true)
  })

  it('compares PATH lookups case-insensitively like Windows', () => {
    const exists = (p: string) => p.toLowerCase() === 'c:\\bin\\editor.exe'
    expect(windowsCommandExists('EDITOR', { PATH: 'C:\\BIN', PATHEXT: '.EXE' }, exists)).toBe(true)
    expect(windowsCommandExists('editor', { PATH: 'C:\\bin' }, exists)).toBe(true)
  })
})
