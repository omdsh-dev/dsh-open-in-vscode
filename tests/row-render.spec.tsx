// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { fmt, zh } from '../src/client/locales.ts'
import { OpenInVscodeRow, type OpenInVscodeRowProps } from '../src/client/row.tsx'
import type { EditorCatalog } from '../src/types.ts'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})

const singleCatalog: EditorCatalog = {
  editors: [{ id: 'vscode', label: 'Visual Studio Code', available: true }],
  defaultEditorId: 'vscode',
}

const multiCatalog: EditorCatalog = {
  editors: [
    { id: 'vscode', label: 'Visual Studio Code', available: true },
    { id: 'cursor', label: 'Cursor', available: true },
    { id: 'fleet', label: 'Fleet', available: false, hint: 'Executable "fleet" was not found' },
  ],
  defaultEditorId: 'vscode',
}

const unavailableCatalog: EditorCatalog = {
  editors: [
    { id: 'vscode', label: 'Visual Studio Code', available: false, hint: 'Executable "code" was not found' },
    { id: 'fleet', label: 'Fleet', available: false, hint: 'Executable "fleet" was not found' },
  ],
  defaultEditorId: 'vscode',
}

const t = ((key: string, params?: Record<string, string>) => {
  const template = (zh as Record<string, string>)[key] ?? key
  return params === undefined ? template : fmt(template, params)
}) as OpenInVscodeRowProps['t']

const useSessions = (() => undefined) as unknown as OpenInVscodeRowProps['useSessions']
const useWorkspaces = (() => undefined) as unknown as OpenInVscodeRowProps['useWorkspaces']

function props(overrides: Partial<OpenInVscodeRowProps> = {}): OpenInVscodeRowProps {
  return {
    workspaceId: 'workspace-1',
    label: 'Project',
    cwd: '/projects/project',
    onClose: vi.fn(),
    listEditors: vi.fn(async () => singleCatalog),
    open: vi.fn(async () => {}),
    t,
    useSessions,
    useWorkspaces,
    ...overrides,
  }
}

describe('OpenInVscodeRow', () => {
  it('renders one available editor as a direct action', async () => {
    const open = vi.fn(async () => {})
    const view = render(<OpenInVscodeRow {...props({ open })} />)
    const row = await screen.findByRole('menuitem', { name: '在 Visual Studio Code 中打开 Project' })
    expect(row.textContent).toBe('在 Visual Studio Code 中打开')
    expect(row.querySelector('svg')).not.toBeNull()
    fireEvent.click(row)
    expect(open).toHaveBeenCalledWith('workspace-1', 'vscode')
    expect(renderToString(<OpenInVscodeRow {...props()} />)).toContain('正在检测编辑器')
    expect(view).toBeTruthy()
  })

  it('opens the chooser, launches a selected editor, and remembers it', async () => {
    const onClose = vi.fn()
    const open = vi.fn(async () => {})
    const first = render(<OpenInVscodeRow {...props({
      onClose,
      open,
      listEditors: vi.fn(async () => multiCatalog),
    })} />)
    await screen.findByRole('menuitem', { name: '在 Visual Studio Code 中打开 Project' })
    fireEvent.click(screen.getByRole('button', { name: '选择用于打开 Project 的编辑器' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Cursor' }))
    expect(onClose).toHaveBeenCalledOnce()
    expect(open).toHaveBeenCalledWith('workspace-1', 'cursor')
    expect(window.localStorage.getItem('dsh-open-in-vscode.preferred-editor')).toBe('cursor')

    first.unmount()
    render(<OpenInVscodeRow {...props({ listEditors: vi.fn(async () => multiCatalog) })} />)
    await screen.findByRole('menuitem', { name: '在 Cursor 中打开 Project' })
  })

  it('shows missing configured editors as disabled chooser entries', async () => {
    render(<OpenInVscodeRow {...props({ listEditors: vi.fn(async () => multiCatalog) })} />)
    await screen.findByRole('menuitem', { name: '在 Visual Studio Code 中打开 Project' })
    fireEvent.click(screen.getByRole('button', { name: '选择用于打开 Project 的编辑器' }))
    const missing = screen.getByRole('menuitem', { name: 'Fleet — 不可用' })
    expect(missing.hasAttribute('disabled')).toBe(true)
    expect(missing.querySelector('span[title]')?.getAttribute('title')).toContain('fleet')
  })

  it('keeps unavailable configured editors inspectable when none can launch', async () => {
    render(<OpenInVscodeRow {...props({ listEditors: vi.fn(async () => unavailableCatalog) })} />)
    const primary = await screen.findByRole('menuitem', { name: '在 Visual Studio Code 中打开 Project' })
    expect(primary.hasAttribute('disabled')).toBe(true)
    expect(primary.getAttribute('title')).toContain('code')

    fireEvent.click(screen.getByRole('button', { name: '选择用于打开 Project 的编辑器' }))
    expect(screen.getByRole('menuitem', { name: 'Fleet — 不可用' }).hasAttribute('disabled')).toBe(true)
  })

  it('reports catalog and launch failures without throwing through the row', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const failed = render(<OpenInVscodeRow {...props({
        listEditors: vi.fn(async () => { throw new Error('offline') }),
      })} />)
      await waitFor(() => { expect(screen.getByRole('menuitem').textContent).toContain('无法加载编辑器') })
      expect(consoleError).toHaveBeenCalledWith(
        '[dsh-open-in-vscode] editor catalog failed:',
        expect.any(Error),
      )
      failed.unmount()

      const open = vi.fn(async () => { throw new Error('launch failed') })
      render(<OpenInVscodeRow {...props({ open })} />)
      fireEvent.click(await screen.findByRole('menuitem', { name: '在 Visual Studio Code 中打开 Project' }))
      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('[dsh-open-in-vscode] open failed:', expect.any(Error))
      })
    } finally {
      consoleError.mockRestore()
    }
  })

  it('renders nothing for a row without a Workspace id', () => {
    const { container } = render(<OpenInVscodeRow {...props({ workspaceId: undefined })} />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('menuitem')).toBeNull()
  })
})
