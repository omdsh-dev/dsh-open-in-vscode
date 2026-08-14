/**
 * Host composition behavior: the plugin module boots over a real cordis
 * Context with the real Typert registry, registers the openInVscode service
 * and its strict manifest, and the open @Remote launches the configured
 * editor on the directory. The editor seam is real (a fixture script); only
 * the process boundary is a fixture command.
 */
import { Context, Service, symbols } from '@deepseek-ai/cordis'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import type { Workspace, WorkspaceId } from '@deepseek-ai/dsh-workspace'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import * as plugin from '../src/index.ts'
import type { OpenInVscodeRuntime } from '../src/runtime.ts'

class FixtureWorkspaceRegistry extends Service {
  private readonly workspaces: ReadonlyMap<string, Workspace>

  constructor(ctx: Context, entries: ReadonlyArray<{ id: string; path: string; status?: 'ok' | 'missing-dir' }>) {
    super(ctx, 'workspaceRegistry')
    this.workspaces = new Map(entries.map(entry => [entry.id, {
      id: entry.id as WorkspaceId,
      path: entry.path,
      title: entry.id,
      createdAt: '2026-08-14T00:00:00.000Z',
      updatedAt: '2026-08-14T00:00:00.000Z',
      sessionIds: [],
      status: async () => entry.status ?? 'ok',
      setTitle: async () => {},
      attachSession: async () => {},
      insertSessionBefore: async () => {},
      detachSession: async () => {},
    }]))
  }

  get(id: WorkspaceId): Workspace | undefined {
    return this.workspaces.get(String(id))
  }
}

/** The unproxied service original (cordis caller-tracking may wrap instances). */
function originalOf(service: object): object {
  const original = Reflect.get(service, symbols.original) as object | undefined
  return original ?? service
}

/** A fixture "editor": a node script that appends its directory argument to a marker file. */
async function fixtureEditor(): Promise<{ root: string; marker: string; args: string[] }> {
  const root = await mkdtemp(join(tmpdir(), 'dsh-open-in-vscode-'))
  const marker = join(root, 'opened.log')
  const script = join(root, 'editor.mjs')
  await writeFile(script, [
    "import { appendFileSync } from 'node:fs'",
    'const [marker, path] = process.argv.slice(2)',
    'appendFileSync(marker, path + String.fromCharCode(10))',
    '',
  ].join('\n'))
  return { root, marker, args: [script, marker] }
}

/** Mount the function-plugin module on a fresh context (harness test pattern). */
async function mount(
  ctx: Context,
  config: plugin.Config = {},
  workspaces: ReadonlyArray<{ id: string; path: string; status?: 'ok' | 'missing-dir' }> = [
    { id: 'workspace-1', path: '/tmp' },
  ],
) {
  new FixtureWorkspaceRegistry(ctx, workspaces)
  const registryFiber = ctx.plugin(TypertRegistry)
  await registryFiber
  const fiber = ctx.plugin({ inject: plugin.inject, apply: plugin.apply }, {
    command: process.execPath,
    label: 'Fixture editor',
    autoDetect: false,
    ...config,
  })
  await fiber
  return fiber
}

describe('dsh-open-in-vscode host composition', () => {
  it('boots the plugin and registers the service under its own key', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx)
    try {
      const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime | undefined
      expect(runtime).toBeDefined()
      // The Gateway source-mode binding the wire dispatch relies on.
      expect(Reflect.get(originalOf(runtime as OpenInVscodeRuntime), 'typertRemote').namespace).toBe('openInVscode')
    } finally {
      await fiber.dispose()
    }
  })

  it('registers the strict Typert manifest and withdraws it on disposal', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx)
    const registry = ctx.get('typert') as TypertRegistry
    expect(registry.local.get('openInVscode/open')).toMatchObject({
      id: 'dsh-open-in-vscode#openInVscode/open',
      service: 'openInVscode',
      namespace: 'openInVscode',
      method: 'open',
    })
    expect(registry.local.get('openInVscode/list')).toMatchObject({
      id: 'dsh-open-in-vscode#openInVscode/list',
      service: 'openInVscode',
      namespace: 'openInVscode',
      method: 'list',
    })
    await fiber.dispose()
    expect(registry.local.get('openInVscode/open')).toBeUndefined()
    expect(ctx.get('openInVscode')).toBeUndefined()
  })

  it('open launches the configured editor on the directory', async () => {
    const fixture = await fixtureEditor()
    try {
      const dir = join(fixture.root, 'workspace')
      const ctx = new Context()
      const fiber = await mount(ctx, {
        command: process.execPath,
        args: fixture.args,
      }, [{ id: 'workspace-1', path: dir }])
      try {
        const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
        await expect(runtime.open('workspace-1', 'vscode', new AbortController().signal)).resolves.toEqual({ opened: true })
        await vi.waitFor(async () => {
          expect(await readFile(fixture.marker, 'utf8')).toContain(dir)
        })
      } finally {
        await fiber.dispose()
      }
    } finally {
      await rm(fixture.root, { recursive: true, force: true })
    }
  })

  it('list publishes browser-safe editor metadata', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx)
    try {
      const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
      expect(runtime.list()).toEqual({
        editors: [{ id: 'vscode', label: 'Fixture editor', available: true }],
        defaultEditorId: 'vscode',
      })
    } finally {
      await fiber.dispose()
    }
  })

  it('open rejects unknown workspaces, missing directories, and unknown editors', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx, {}, [{ id: 'missing-dir', path: '/gone', status: 'missing-dir' }])
    try {
      const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
      await expect(runtime.open('unknown', 'vscode')).rejects.toThrow(/unknown workspace/)
      await expect(runtime.open('missing-dir', 'vscode')).rejects.toThrow(/directory is missing/)
      await expect(runtime.open('missing-dir', 'unknown')).rejects.toThrow(/directory is missing/)
    } finally {
      await fiber.dispose()
    }
  })

  it('open rejects an unavailable configured editor before spawning', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx, {
      editors: [{ id: 'missing', label: 'Missing', command: '/definitely/missing' }],
    })
    try {
      const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
      await expect(runtime.open('workspace-1', 'missing')).rejects.toThrow(/editor "missing" is unavailable/)
      await expect(runtime.open('workspace-1', 'unknown')).rejects.toThrow(/unknown editor/)
    } finally {
      await fiber.dispose()
    }
  })

  it('open rejects an already-aborted request without spawning', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx, { command: process.execPath, args: [] })
    try {
      const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
      const aborted = new AbortController()
      aborted.abort()
      await expect(runtime.open('workspace-1', 'vscode', aborted.signal)).rejects.toThrow(/aborted/)
    } finally {
      await fiber.dispose()
    }
  })
})
