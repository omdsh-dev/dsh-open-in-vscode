// @vitest-environment jsdom
/**
 * Client row presentation: renders the three locale-following menu rows from
 * the slot's owner share, launches the matching host action on click
 * (closing the menu first), reports launch failure without crashing the
 * rows, and renders nothing for a row without a directory. A renderToString
 * smoke proves the SSR path.
 */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { fmt, zh } from '../src/client/locales.ts'
import { OpenInVscodeRow, type OpenInVscodeRowProps } from '../src/client/row.tsx'

afterEach(cleanup)

/** The real zh dictionary through the locale seat shape. */
const t = ((key: string, params?: Record<string, string>) => {
  const template = (zh as Record<string, string>)[key] ?? key
  return params === undefined ? template : fmt(template, params)
}) as OpenInVscodeRowProps['t']

// The row never reads the global seats; stubs satisfy the type only.
const useSessions = (() => undefined) as unknown as OpenInVscodeRowProps['useSessions']
const useWorkspaces = (() => undefined) as unknown as OpenInVscodeRowProps['useWorkspaces']

function props(overrides: Partial<OpenInVscodeRowProps> = {}): OpenInVscodeRowProps {
  return {
    workspaceId: 'ws' as never,
    label: 'Project',
    cwd: '/projects/project',
    onClose: vi.fn(),
    open: vi.fn(async () => {}),
    openInExplorer: vi.fn(async () => {}),
    openInPowerShell: vi.fn(async () => {}),
    t,
    useSessions,
    useWorkspaces,
    ...overrides,
  }
}

describe('OpenInVscodeRow', () => {
  it('renders the three zh menu rows with the workspace in their aria labels', () => {
    const view = render(<OpenInVscodeRow {...props()} />)
    const rows = screen.getAllByRole('menuitem')
    expect(rows).toHaveLength(3)
    expect(screen.getByRole('menuitem', { name: '在 VSCode 中打开 Project' }).textContent).toBe('在 VSCode 中打开')
    expect(screen.getByRole('menuitem', { name: '在资源管理器中打开 Project' }).textContent).toBe('在资源管理器中打开')
    expect(screen.getByRole('menuitem', { name: '在 PowerShell 中打开 Project' }).textContent).toBe('在 PowerShell 中打开')
    expect(rows.every(row => row.querySelector('svg') !== null)).toBe(true)
    // SSR smoke: the same rows render as static markup.
    const markup = renderToString(<OpenInVscodeRow {...props()} />)
    expect(markup).toContain('在 VSCode 中打开')
    expect(markup).toContain('在资源管理器中打开')
    expect(markup).toContain('在 PowerShell 中打开')
    expect(view).toBeTruthy()
  })

  it('clicking each row closes the menu and launches the matching action on the cwd', async () => {
    const onClose = vi.fn()
    const open = vi.fn(async () => {})
    const openInExplorer = vi.fn(async () => {})
    const openInPowerShell = vi.fn(async () => {})
    render(<OpenInVscodeRow {...props({ onClose, open, openInExplorer, openInPowerShell })} />)

    fireEvent.click(screen.getByRole('menuitem', { name: '在 VSCode 中打开 Project' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '在资源管理器中打开 Project' }))
    fireEvent.click(screen.getByRole('menuitem', { name: '在 PowerShell 中打开 Project' }))
    expect(open).toHaveBeenCalledWith('/projects/project')
    expect(openInExplorer).toHaveBeenCalledWith('/projects/project')
    expect(openInPowerShell).toHaveBeenCalledWith('/projects/project')
    expect(onClose).toHaveBeenCalledTimes(3)
    await Promise.resolve()
  })

  it('a rejected launch is reported without throwing through the row', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const open = vi.fn(async () => { throw new Error('no such command') })
      render(<OpenInVscodeRow {...props({ open })} />)
      fireEvent.click(screen.getByRole('menuitem', { name: '在 VSCode 中打开 Project' }))
      await Promise.resolve()
      expect(consoleError).toHaveBeenCalledWith('[dsh-open-in-vscode] open failed:', expect.any(Error))
    } finally {
      consoleError.mockRestore()
    }
  })

  it('renders nothing for a Workspace row without a directory', () => {
    const { container } = render(<OpenInVscodeRow {...props({ cwd: undefined })} />)
    expect(container.firstChild).toBeNull()
    expect(screen.queryByRole('menuitem')).toBeNull()
  })
})
