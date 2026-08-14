// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import { installLegacyWorkspaceMenu } from '../src/client/legacy-menu.tsx'
import { en } from '../src/client/locales.ts'
import type { EditorCatalog } from '../src/types.ts'

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
})

const workspaceStrings: Record<string, string> = {
  'actions.workspace.aria': 'Workspace actions for {name}',
  rename: 'Rename',
  'delete.workspace': 'Delete workspace',
}

const catalog: EditorCatalog = {
  editors: [{ id: 'vscode', label: 'Visual Studio Code', available: true }],
  defaultEditorId: 'vscode',
}

const listEditors = async (): Promise<EditorCatalog> => catalog

function translate<K extends string>(dict: Record<string, string>): (key: K, params?: Record<string, unknown>) => string {
  return (key, params) => {
    const template = dict[key] ?? key
    return template.replace(/\{(\w+)\}/g, (_match, name: string) => String(params?.[name] ?? `{${name}}`))
  }
}

function openWorkspaceMenu(): void {
  const menu = document.createElement('div')
  menu.setAttribute('role', 'menu')
  const viewport = document.createElement('div')
  viewport.setAttribute('role', 'presentation')
  for (const label of ['Rename', 'Delete workspace']) {
    const item = document.createElement('button')
    item.setAttribute('role', 'menuitem')
    item.textContent = label
    viewport.appendChild(item)
  }
  menu.appendChild(viewport)
  document.body.appendChild(menu)
}

function LegacyWorkspaceMenu({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Menu
      open={open}
      closeOnPointerLeave
      portal
      anchor={
        <button
          type="button"
          aria-label="Workspace actions for dsh"
          onClick={() => { setOpen(true) }}
        >Actions</button>
      }
      items={[
        { id: 'rename', label: 'Rename' },
        { id: 'delete', label: 'Delete workspace' },
      ]}
      onSelect={() => {}}
      onClose={() => {
        onClose()
        setOpen(false)
      }}
    />
  )
}

describe('rc.6 Workspace menu compatibility', () => {
  it('injects the row into a real Workspace menu and launches the matching path', async () => {
    const open = vi.fn(async () => {})
    const dispose = installLegacyWorkspaceMenu({
      workspaces: { getSnapshot: () => ({ items: [{ workspaceId: 'workspace-1', title: 'dsh', path: '/work/dsh' }] }) },
      workspaceT: translate(workspaceStrings),
      rowT: translate(en),
      listEditors,
      open,
    })
    const anchor = document.createElement('button')
    anchor.setAttribute('aria-label', 'Workspace actions for dsh')
    document.body.appendChild(anchor)
    fireEvent.click(anchor)
    openWorkspaceMenu()

    const row = await screen.findByRole('menuitem', { name: 'Open dsh in Visual Studio Code' })
    fireEvent.pointerDown(row, { button: 0 })
    fireEvent.click(row)
    await waitFor(() => { expect(open).toHaveBeenCalledWith('workspace-1', 'vscode') })
    expect(open).toHaveBeenCalledOnce()
    dispose()
  })

  it('does not inject into session menus or ambiguous Workspace labels', async () => {
    const dispose = installLegacyWorkspaceMenu({
      workspaces: {
        getSnapshot: () => ({
          items: [
            { workspaceId: 'one', title: 'same', path: '/one' },
            { workspaceId: 'two', title: 'same', path: '/two' },
          ],
        }),
      },
      workspaceT: translate(workspaceStrings),
      rowT: translate(en),
      listEditors,
      open: vi.fn(async () => {}),
    })
    const anchor = document.createElement('button')
    anchor.setAttribute('aria-label', 'Workspace actions for same')
    document.body.appendChild(anchor)
    fireEvent.click(anchor)
    const menu = document.createElement('div')
    menu.setAttribute('role', 'menu')
    menu.innerHTML = '<button role="menuitem">Rename</button><button role="menuitem">Archive session</button>'
    document.body.appendChild(menu)

    await new Promise(resolve => setTimeout(resolve, 0))
    expect(screen.queryByRole('menuitem', { name: /Visual Studio Code/u })).toBeNull()
    dispose()
  })

  it('keeps the rc.6 hover-closing menu open when the pointer enters the injected row', async () => {
    const onClose = vi.fn()
    const dispose = installLegacyWorkspaceMenu({
      workspaces: { getSnapshot: () => ({ items: [{ workspaceId: 'workspace-1', title: 'dsh', path: '/work/dsh' }] }) },
      workspaceT: translate(workspaceStrings),
      rowT: translate(en),
      listEditors,
      open: vi.fn(async () => {}),
    })
    render(<LegacyWorkspaceMenu onClose={onClose} />)
    const anchor = screen.getByRole('button', { name: 'Workspace actions for dsh' })
    fireEvent.click(anchor)
    const row = await screen.findByRole('menuitem', { name: 'Open dsh in Visual Studio Code' })

    vi.useFakeTimers()
    try {
      fireEvent.pointerLeave(anchor.parentElement as HTMLElement)
      fireEvent.pointerOver(row)
      act(() => { vi.advanceTimersByTime(1_000) })
      expect(onClose).not.toHaveBeenCalled()
      expect(screen.getByRole('menu')).toBeTruthy()
    } finally {
      vi.useRealTimers()
      dispose()
    }
  })
})
