/** Resolve editor executables across supported host platforms. */
import { existsSync } from 'node:fs'
import { delimiter, isAbsolute, join, win32 } from 'node:path'

type Exists = (path: string) => boolean

function pathValue(env: NodeJS.ProcessEnv): string {
  return env.PATH ?? env.Path ?? env.path ?? ''
}

function pathCandidates(
  command: string,
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
): string[] {
  const separator = platform === 'win32' ? ';' : delimiter
  const entries = pathValue(env).split(separator)
    .map(entry => entry.trim().replace(/^"|"$/g, ''))
    .filter(entry => entry !== '')
  if (platform !== 'win32') return entries.map(entry => join(entry, command))

  const hasExtension = win32.extname(command) !== ''
  const extensions = hasExtension
    ? ['']
    : (env.PATHEXT ?? '.COM;.EXE;.BAT;.CMD').split(';').filter(Boolean)
  return entries.flatMap(entry => extensions.map(extension => win32.join(entry, command + extension)))
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

/**
 * Resolve an executable only when it exists at an absolute or PATH-derived
 * location. Windows also checks the existing standard VS Code locations.
 */
export function resolveExecutable(
  command: string,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  exists: Exists = existsSync,
): string | undefined {
  if (isAbsolute(command)) return exists(command) ? command : undefined
  const pathMatch = pathCandidates(command, platform, env).find(exists)
  if (pathMatch !== undefined) return pathMatch
  if (platform === 'win32' && command.toLowerCase() === 'code') {
    return candidateWindowsVsCodePaths(env).find(exists)
  }
  return undefined
}
