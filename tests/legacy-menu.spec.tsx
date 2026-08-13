// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installLegacyWorkspaceMenu } from '../src/client/legacy-menu.tsx'
import { en } from '../src/client/locales.ts'

afterEach(() => {
  cleanup()
  document.body.replaceChildren()
})

const workspaceStrings: Record<string, string> = {
  'actions.workspace.aria': 'Workspace actions for {name}',
  rename: 'Rename',
  'delete.workspace': 'Delete workspace',
}

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

describe('rc.6 Workspace menu compatibility', () => {
  it('injects the row into a real Workspace menu and launches the matching path', async () => {
    const open = vi.fn(async () => {})
    const dispose = installLegacyWorkspaceMenu({
      workspaces: { getSnapshot: () => ({ items: [{ title: 'dsh', path: '/work/dsh' }] }) },
      workspaceT: translate(workspaceStrings),
      rowT: translate(en),
      open,
    })
    const anchor = document.createElement('button')
    anchor.setAttribute('aria-label', 'Workspace actions for dsh')
    document.body.appendChild(anchor)
    fireEvent.click(anchor)
    openWorkspaceMenu()

    const row = await screen.findByRole('menuitem', { name: 'Open dsh in VSCode' })
    fireEvent.pointerDown(row, { button: 0 })
    fireEvent.click(row)
    await waitFor(() => { expect(open).toHaveBeenCalledWith('/work/dsh') })
    expect(open).toHaveBeenCalledOnce()
    dispose()
  })

  it('does not inject into session menus or ambiguous Workspace labels', async () => {
    const dispose = installLegacyWorkspaceMenu({
      workspaces: {
        getSnapshot: () => ({
          items: [
            { title: 'same', path: '/one' },
            { title: 'same', path: '/two' },
          ],
        }),
      },
      workspaceT: translate(workspaceStrings),
      rowT: translate(en),
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
    expect(screen.queryByRole('menuitem', { name: /VSCode/u })).toBeNull()
    dispose()
  })
})
