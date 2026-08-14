import { win32 } from 'node:path'
import { describe, expect, it } from 'vitest'
import { candidateWindowsVsCodePaths, resolveEditorCommand, resolveExecutable } from '../src/resolve.ts'

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

  it('resolves ordinary executables from PATH on POSIX and PATHEXT on Windows', () => {
    expect(resolveExecutable('cursor', 'darwin', { PATH: '/usr/local/bin:/usr/bin' }, path => (
      path === '/usr/local/bin/cursor'
    ))).toBe('/usr/local/bin/cursor')
    expect(resolveExecutable('cursor', 'win32', {
      PATH: 'C:\\Tools;D:\\Apps',
      PATHEXT: '.EXE;.CMD',
    }, path => path === win32.join('D:\\Apps', 'cursor.EXE'))).toBe(win32.join('D:\\Apps', 'cursor.EXE'))
  })

  it('rejects unresolved and missing absolute executables', () => {
    expect(resolveExecutable('missing', 'linux', { PATH: '/usr/bin' }, () => false)).toBeUndefined()
    expect(resolveExecutable('/Applications/Missing.app/bin/tool', 'darwin', {}, () => false)).toBeUndefined()
  })
})
