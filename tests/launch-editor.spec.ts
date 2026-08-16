/**
 * launchEditor's process seam: how the directory, cwd, and Windows
 * shell-open wrapper reach node:child_process. spawn is mocked so no real
 * editor or Explorer/PowerShell window opens during the tests.
 */
import { spawn } from 'node:child_process'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { launchEditor } from '../src/runtime.ts'

vi.mock('node:child_process', () => ({ spawn: vi.fn() }))

const mockSpawn = vi.mocked(spawn)

/** A child stub that settles the launch on the spawn event. */
function stubChild(): void {
  mockSpawn.mockReturnValue({
    once(event: string, listener: () => void) {
      if (event === 'spawn') queueMicrotask(listener)
      return this
    },
    unref: vi.fn(),
    kill: vi.fn(),
  } as never)
}

beforeEach(() => {
  mockSpawn.mockClear()
  stubChild()
})

describe('launchEditor', () => {
  it('spawns the command with the directory appended and the detach flags', async () => {
    await launchEditor('myeditor', [], '/tmp/workspace')
    expect(mockSpawn).toHaveBeenCalledWith('myeditor', ['/tmp/workspace'], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    })
  })

  it('passes extra arguments before the directory', async () => {
    await launchEditor('myeditor', ['--reuse-window'], '/tmp/workspace')
    expect(mockSpawn).toHaveBeenCalledWith('myeditor', ['--reuse-window', '/tmp/workspace'], expect.any(Object))
  })

  it('keeps the directory out of the argv when appendPath is false', async () => {
    await launchEditor('myeditor', ['-b'], '/tmp/workspace', undefined, { appendPath: false })
    expect(mockSpawn).toHaveBeenCalledWith('myeditor', ['-b'], expect.any(Object))
  })

  it('starts the child in the requested cwd', async () => {
    await launchEditor('myeditor', [], '/tmp/workspace', undefined, { cwd: '/work' })
    expect(mockSpawn.mock.calls[0]![2]).toMatchObject({ cwd: '/work' })
  })

  it.runIf(process.platform === 'win32')(
    'shellOpen relaunches through cmd /c start so a visible window appears',
    async () => {
      await launchEditor('explorer', [], '/tmp/workspace', undefined, { shellOpen: true })
      expect(mockSpawn).toHaveBeenCalledWith('cmd.exe', ['/c', 'start', '', 'explorer'], expect.any(Object))
    },
  )

  it.runIf(process.platform === 'win32')(
    'shellOpen keeps the cwd for the new console window',
    async () => {
      await launchEditor('pwsh', ['-NoExit'], '/tmp/workspace', undefined, {
        appendPath: false,
        cwd: '/work',
        shellOpen: true,
      })
      expect(mockSpawn).toHaveBeenCalledWith('cmd.exe', ['/c', 'start', '', 'pwsh', '-NoExit'], expect.objectContaining({
        cwd: '/work',
      }))
    },
  )

  it('rejects an already-aborted request without spawning', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(launchEditor('myeditor', [], '/tmp', controller.signal)).rejects.toThrow(/aborted/)
    expect(mockSpawn).not.toHaveBeenCalled()
  })
})
