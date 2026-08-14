/** Build the allowlisted Host editor registry from built-ins and configuration. */
import { existsSync } from 'node:fs'
import { win32 } from 'node:path'
import type { EditorCatalog, EditorConfig, ResolvedConfig, ResolvedEditor } from './types.ts'
import { resolveExecutable } from './resolve.ts'

type Exists = (path: string) => boolean

interface LaunchCandidate {
  command: string
  args?: readonly string[]
}

interface EditorCandidate {
  id: string
  label: string
  launches: readonly LaunchCandidate[]
  configured?: boolean
}

const EDITOR_ID = /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/u

function macCandidates(): EditorCandidate[] {
  return [
    { id: 'cursor', label: 'Cursor', launches: [
      { command: 'cursor' },
      { command: '/Applications/Cursor.app/Contents/Resources/app/bin/cursor' },
    ] },
    { id: 'windsurf', label: 'Windsurf', launches: [
      { command: 'windsurf' },
      { command: '/Applications/Windsurf.app/Contents/Resources/app/bin/windsurf' },
    ] },
    { id: 'zed', label: 'Zed', launches: [
      { command: 'zed' },
      { command: '/Applications/Zed.app/Contents/MacOS/zed' },
    ] },
    { id: 'idea', label: 'IntelliJ IDEA', launches: [
      { command: 'idea' },
      { command: '/Applications/IntelliJ IDEA.app/Contents/MacOS/idea' },
    ] },
    { id: 'webstorm', label: 'WebStorm', launches: [
      { command: 'webstorm' },
      { command: '/Applications/WebStorm.app/Contents/MacOS/webstorm' },
    ] },
    { id: 'pycharm', label: 'PyCharm', launches: [
      { command: 'pycharm' },
      { command: '/Applications/PyCharm.app/Contents/MacOS/pycharm' },
    ] },
    { id: 'terminal', label: 'Terminal', launches: [
      { command: '/usr/bin/open', args: ['-a', 'Terminal'] },
    ] },
    { id: 'finder', label: 'Finder', launches: [{ command: '/usr/bin/open' }] },
  ]
}

function windowsCandidates(env: NodeJS.ProcessEnv): EditorCandidate[] {
  const localPrograms = env.LOCALAPPDATA === undefined
    ? undefined
    : win32.join(env.LOCALAPPDATA, 'Programs')
  const windowsRoot = env.WINDIR ?? env.SystemRoot ?? 'C:\\Windows'
  return [
    { id: 'cursor', label: 'Cursor', launches: [
      { command: 'cursor' },
      ...(localPrograms === undefined ? [] : [
        { command: win32.join(localPrograms, 'cursor', 'Cursor.exe') },
        { command: win32.join(localPrograms, 'Cursor', 'Cursor.exe') },
      ]),
    ] },
    { id: 'windsurf', label: 'Windsurf', launches: [
      { command: 'windsurf' },
      ...(localPrograms === undefined ? [] : [
        { command: win32.join(localPrograms, 'Windsurf', 'Windsurf.exe') },
      ]),
    ] },
    { id: 'zed', label: 'Zed', launches: [{ command: 'zed' }] },
    { id: 'idea', label: 'IntelliJ IDEA', launches: [{ command: 'idea' }] },
    { id: 'webstorm', label: 'WebStorm', launches: [{ command: 'webstorm' }] },
    { id: 'pycharm', label: 'PyCharm', launches: [{ command: 'pycharm' }] },
    { id: 'terminal', label: 'Windows Terminal', launches: [{ command: 'wt', args: ['-d'] }] },
    { id: 'explorer', label: 'File Explorer', launches: [
      { command: win32.join(windowsRoot, 'explorer.exe') },
      { command: 'explorer' },
    ] },
  ]
}

function linuxCandidates(): EditorCandidate[] {
  return [
    { id: 'cursor', label: 'Cursor', launches: [{ command: 'cursor' }] },
    { id: 'windsurf', label: 'Windsurf', launches: [{ command: 'windsurf' }] },
    { id: 'zed', label: 'Zed', launches: [{ command: 'zed' }] },
    { id: 'idea', label: 'IntelliJ IDEA', launches: [{ command: 'idea' }] },
    { id: 'webstorm', label: 'WebStorm', launches: [{ command: 'webstorm' }] },
    { id: 'pycharm', label: 'PyCharm', launches: [{ command: 'pycharm' }] },
    { id: 'terminal', label: 'Terminal', launches: [
      { command: 'x-terminal-emulator', args: ['--working-directory'] },
    ] },
    { id: 'files', label: 'File Manager', launches: [{ command: 'xdg-open' }] },
  ]
}

function builtInCandidates(platform: NodeJS.Platform, env: NodeJS.ProcessEnv): EditorCandidate[] {
  if (platform === 'darwin') return macCandidates()
  if (platform === 'win32') return windowsCandidates(env)
  return linuxCandidates()
}

function configuredCandidate(editor: EditorConfig): EditorCandidate {
  return {
    id: editor.id,
    label: editor.label,
    launches: [{ command: editor.command, args: editor.args }],
    configured: true,
  }
}

function resolveCandidate(
  candidate: EditorCandidate,
  platform: NodeJS.Platform,
  env: NodeJS.ProcessEnv,
  exists: Exists,
): ResolvedEditor {
  for (const launch of candidate.launches) {
    const command = resolveExecutable(launch.command, platform, env, exists)
    if (command !== undefined) {
      return {
        id: candidate.id,
        label: candidate.label,
        command,
        args: launch.args ?? [],
        available: true,
      }
    }
  }
  const first = candidate.launches[0]
  if (first === undefined) throw new Error(`open-in-vscode: editor "${candidate.id}" has no launch candidate`)
  return {
    id: candidate.id,
    label: candidate.label,
    command: first.command,
    args: first.args ?? [],
    available: false,
    hint: `Executable "${first.command}" was not found`,
  }
}

function validateCandidate(candidate: EditorCandidate, seen: Set<string>): void {
  if (!EDITOR_ID.test(candidate.id)) {
    throw new Error(`open-in-vscode: invalid editor id "${candidate.id}"`)
  }
  if (candidate.label.trim() === '') {
    throw new Error(`open-in-vscode: editor "${candidate.id}" has an empty label`)
  }
  if (seen.has(candidate.id)) {
    throw new Error(`open-in-vscode: duplicate editor id "${candidate.id}"`)
  }
  seen.add(candidate.id)
}

/** Resolve the complete allowlisted editor registry for one Host process. */
export function resolveEditors(
  config: ResolvedConfig,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env,
  exists: Exists = existsSync,
): ResolvedEditor[] {
  const configured: EditorCandidate[] = [
    {
      id: 'vscode',
      label: config.label,
      launches: [
        { command: config.command, args: config.args },
        ...(config.command === 'code' && platform === 'darwin'
          ? [{ command: '/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code', args: config.args }]
          : []),
      ],
      configured: true,
    },
    ...config.editors.map(configuredCandidate),
  ]
  const configuredIds = new Set(configured.map(editor => editor.id))
  const automatic = config.autoDetect
    ? builtInCandidates(platform, env).filter(editor => !configuredIds.has(editor.id))
    : []
  const candidates = [...configured, ...automatic]
  const seen = new Set<string>()
  for (const candidate of candidates) validateCandidate(candidate, seen)
  return candidates
    .map(candidate => ({ resolved: resolveCandidate(candidate, platform, env, exists), configured: candidate.configured === true }))
    .filter(({ resolved, configured: required }) => required || resolved.available)
    .map(({ resolved }) => resolved)
}

/** Convert the private registry into browser-safe metadata. */
export function editorCatalog(editors: readonly ResolvedEditor[], configuredDefault: string): EditorCatalog {
  if (editors.length === 0) throw new Error('open-in-vscode: the editor registry is empty')
  const available = editors.filter(editor => editor.available)
  const preferred = available.find(editor => editor.id === configuredDefault) ?? available[0] ?? editors[0]
  if (preferred === undefined) throw new Error('open-in-vscode: the editor registry is empty')
  return {
    editors: editors.map(({ id, label, available: isAvailable, hint }) => ({
      id,
      label,
      available: isAvailable,
      ...(hint === undefined ? {} : { hint }),
    })),
    defaultEditorId: preferred.id,
  }
}
