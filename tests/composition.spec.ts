/**
 * Host composition behavior: the plugin module boots over a real cordis
 * Context with the real Typert registry, registers the openInVscode service
 * and its strict manifest, and the open @Remote launches the configured
 * editor on the directory. The editor seam is real (a fixture script); only
 * the process boundary is a fixture command.
 */
import { Context, symbols } from '@deepseek-ai/cordis'
import TypertRegistry from '@deepseek-ai/dsh-typert-registry'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import * as plugin from '../src/index.ts'
import type { OpenInVscodeRuntime } from '../src/runtime.ts'

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
async function mount(ctx: Context, config?: plugin.Config) {
  const registryFiber = ctx.plugin(TypertRegistry)
  await registryFiber
  const fiber = ctx.plugin({ inject: plugin.inject, apply: plugin.apply }, config)
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
      })
      try {
        const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
        await expect(runtime.open(dir, new AbortController().signal)).resolves.toEqual({ opened: true })
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

  it('open refuses a relative path', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx)
    try {
      const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
      await expect(runtime.open('relative/path', new AbortController().signal))
        .rejects.toThrow(/refusing a relative path/)
    } finally {
      await fiber.dispose()
    }
  })

  it('open reports a missing editor executable with a fix hint', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx, { command: 'definitely-not-an-editor-bin', args: [] })
    try {
      const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
      await expect(runtime.open('/tmp', new AbortController().signal))
        .rejects.toThrow(/definitely-not-an-editor-bin/)
      await expect(runtime.open('/tmp', new AbortController().signal))
        .rejects.toThrow(/not on PATH/)
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
      await expect(runtime.open('/tmp', aborted.signal)).rejects.toThrow(/aborted/)
    } finally {
      await fiber.dispose()
    }
  })

  it('openInExplorer and openInPowerShell refuse a relative path', async () => {
    const ctx = new Context()
    const fiber = await mount(ctx)
    try {
      const runtime = ctx.get('openInVscode') as OpenInVscodeRuntime
      await expect(runtime.openInExplorer('relative/path', new AbortController().signal))
        .rejects.toThrow(/refusing a relative path/)
      await expect(runtime.openInPowerShell('relative/path', new AbortController().signal))
        .rejects.toThrow(/refusing a relative path/)
    } finally {
      await fiber.dispose()
    }
  })
})
