/** Resolve the default VS Code executable across supported host platforms. */
import { existsSync } from 'node:fs'
import { win32 } from 'node:path'

type Exists = (path: string) => boolean

function pathValue(env: NodeJS.ProcessEnv): string {
  return env.PATH ?? env.Path ?? env.path ?? ''
}

/** Standard Windows VS Code executable locations, with PATH-derived locations first. */
export function candidateWindowsVsCodePaths(env: NodeJS.ProcessEnv = process.env): string[] {
  const candidates: string[] = []
  for (const raw of pathValue(env).split(';')) {
    const entry = raw.trim().replace(/^"|"$/g, '')
    if (entry === '') continue
    candidates.push(win32.join(entry, 'Code.exe'))
    if (win32.basename(entry).toLowerCase() === 'bin') {
      candidates.push(win32.resolve(entry, '..', 'Code.exe'))
    }
  }

  const roots = [
    env.LOCALAPPDATA === undefined ? undefined : win32.join(env.LOCALAPPDATA, 'Programs'),
    env.ProgramFiles ?? 'C:\\Program Files',
    env['ProgramFiles(x86)'],
  ]
  for (const root of roots) {
    if (root !== undefined && root !== '') {
      candidates.push(win32.join(root, 'Microsoft VS Code', 'Code.exe'))
    }
  }

  const seen = new Set<string>()
  return candidates.filter((candidate) => {
    const key = candidate.toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Resolve whether a Windows launch target exists for the `cmd /c start`
 * relaunch: absolute paths check the filesystem, bare names walk PATH with
 * the PATHEXT suffixes. System shells (explorer, pwsh) and the resolved
 * editor path pass through the same rule; a miss means `start` would fail,
 * so the caller keeps the direct-spawn error path instead. Relative paths
 * (containing a separator but not absolute) are not resolvable this way and
 * report a miss.
 */
export function windowsCommandExists(
  command: string,
  env: NodeJS.ProcessEnv = process.env,
  exists: Exists = existsSync,
): boolean {
  if (win32.isAbsolute(command)) return exists(command)
  const suffixes = (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD')
    .split(';')
    .map(suffix => suffix.toLowerCase())
    .filter(suffix => suffix !== '')
  for (const raw of pathValue(env).split(';')) {
    const entry = raw.trim().replace(/^"|"$/g, '')
    if (entry === '') continue
    const base = win32.join(entry, command)
    if (exists(base) || suffixes.some(suffix => exists(base + suffix))) return true
  }
  return false
}

/**
 * Resolve only the default `code` command on Windows. Explicit editor
 * commands remain untouched so deployment configuration stays authoritative.
 */
export function resolveEditorCommand(
  command: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  exists: Exists = existsSync,
): string {
  if (platform !== 'win32' || command.toLowerCase() !== 'code') return command
  return candidateWindowsVsCodePaths(env).find(exists) ?? command
}
