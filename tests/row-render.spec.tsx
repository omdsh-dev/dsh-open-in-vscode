// @vitest-environment jsdom
/**
 * Client row presentation: renders the locale-following menu row from the
 * slot's owner share, launches the editor on click (closing the menu first),
 * reports launch failure without crashing the row, and renders nothing for a
 * row without a directory. A renderToString smoke proves the SSR path.
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
    t,
    useSessions,
    useWorkspaces,
    ...overrides,
  }
}

describe('OpenInVscodeRow', () => {
  it('renders the zh menu row with the workspace in its aria label', () => {
    const view = render(<OpenInVscodeRow {...props()} />)
    const row = screen.getByRole('menuitem', { name: '在 VSCode 中打开 Project' })
    expect(row.textContent).toBe('在 VSCode 中打开')
    expect(row.querySelector('svg')).not.toBeNull()
    // SSR smoke: the same row renders as static markup.
    expect(renderToString(<OpenInVscodeRow {...props()} />)).toContain('在 VSCode 中打开')
    expect(view).toBeTruthy()
  })

  it('clicking the row closes the menu and launches the editor on the cwd', async () => {
    const onClose = vi.fn()
    const open = vi.fn(async () => {})
    render(<OpenInVscodeRow {...props({ onClose, open })} />)
    fireEvent.click(screen.getByRole('menuitem'))
    expect(onClose).toHaveBeenCalledOnce()
    expect(open).toHaveBeenCalledWith('/projects/project')
    await Promise.resolve()
  })

  it('a rejected launch is reported without throwing through the row', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      const open = vi.fn(async () => { throw new Error('no such command') })
      render(<OpenInVscodeRow {...props({ open })} />)
      fireEvent.click(screen.getByRole('menuitem'))
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
