/** Workspace-row editor launcher: direct default action plus an editor chooser. */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  IconChevronRightOutline14,
  IconCodeOutline16,
  Menu,
  type MenuItem,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  GlobalStandardProps,
  PropsLocale,
} from '@deepseek-ai/dsh-client-ui-slots'
import type { EditorCatalog, EditorView } from '../types.ts'
import { fmt, type OpenInVscodeKey } from './locales.ts'

const PREFERRED_EDITOR_KEY = 'dsh-open-in-vscode.preferred-editor'

/** Host-backed actions supplied to every row contribution. */
export interface OpenInVscodeInjected {
  /** Load the browser-safe editor catalog. */
  listEditors: () => Promise<EditorCatalog>
  /** Open a registered Workspace in one catalog editor. */
  open: (workspaceId: string, editorId: string) => Promise<void>
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The workspace editor-launcher copy. */
    'open-in-vscode': OpenInVscodeKey
  }
}

/** Owner props supplied by the native workspace row-menu slot. */
export interface WorkspaceRowOwnerProps {
  workspaceId: string | undefined
  label: string
  cwd: string | undefined
  onClose: () => void
}

/** Full native row props without assuming an unpublished SlotMap declaration. */
export type OpenInVscodeRowProps =
  WorkspaceRowOwnerProps
  & GlobalStandardProps
  & PropsLocale<'open-in-vscode'>
  & OpenInVscodeInjected

/** Minimal presentation props shared by the native slot and legacy adapter. */
export interface OpenInVscodeMenuRowProps extends OpenInVscodeInjected {
  workspaceId: string | undefined
  label: string
  onClose: () => void
  t: OpenInVscodeRowProps['t']
  /** Launch the primary action on pointerdown when the legacy menu unmounts before click. */
  eagerPointerActivation?: boolean
}

function readPreferredEditor(): string | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    return window.localStorage.getItem(PREFERRED_EDITOR_KEY) ?? undefined
  } catch {
    // Browser storage denial leaves Host configuration authoritative.
    return undefined
  }
}

function writePreferredEditor(editorId: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(PREFERRED_EDITOR_KEY, editorId)
  } catch {
    // Opening the editor must not depend on browser storage availability.
  }
}

function preferredEditor(catalog: EditorCatalog, storedId: string | undefined): EditorView | undefined {
  const available = catalog.editors.filter(editor => editor.available)
  return available.find(editor => editor.id === storedId)
    ?? available.find(editor => editor.id === catalog.defaultEditorId)
    ?? available[0]
}

/** Render the locale-following editor launcher for one Workspace row. */
export function OpenInVscodeMenuRow({
  workspaceId,
  label,
  onClose,
  listEditors,
  open,
  t,
  eagerPointerActivation = false,
}: OpenInVscodeMenuRowProps) {
  const [catalog, setCatalog] = useState<EditorCatalog | undefined>()
  const [loadError, setLoadError] = useState(false)
  const [chooserOpen, setChooserOpen] = useState(false)
  const [preferredId, setPreferredId] = useState(readPreferredEditor)
  const activated = useRef(false)

  useEffect(() => {
    let live = true
    listEditors().then(
      value => { if (live) setCatalog(value) },
      (error: unknown) => {
        console.error('[dsh-open-in-vscode] editor catalog failed:', error)
        if (live) setLoadError(true)
      },
    )
    return () => { live = false }
  }, [listEditors])

  const preferred = catalog === undefined ? undefined : preferredEditor(catalog, preferredId)
  const menuItems = useMemo<readonly MenuItem[]>(() => catalog?.editors.map(editor => ({
    id: editor.id,
    label: editor.available
      ? editor.label
      : <span title={editor.hint}>{editor.label} — {t('menu.unavailable')}</span>,
    disabled: !editor.available,
  })) ?? [], [catalog, t])

  if (workspaceId === undefined) return null

  const launch = (editor: EditorView): void => {
    if (!editor.available || activated.current) return
    activated.current = true
    setChooserOpen(false)
    setPreferredId(editor.id)
    writePreferredEditor(editor.id)
    onClose()
    open(workspaceId, editor.id).catch((error: unknown) => {
      console.error('[dsh-open-in-vscode] open failed:', error)
    })
  }

  if (catalog === undefined) {
    const text = loadError ? t('menu.catalogFailed') : t('menu.loading')
    return (
      <button type="button" role="menuitem" className="dsh-open-in-vscode-row" disabled>
        <span className="dsh-open-in-vscode-icon"><IconCodeOutline16 /></span>
        <span className="dsh-open-in-vscode-label">{text}</span>
      </button>
    )
  }

  const primaryEditor = preferred
    ?? catalog.editors.find(editor => editor.id === catalog.defaultEditorId)
    ?? catalog.editors[0]
  if (primaryEditor === undefined) {
    return (
      <button type="button" role="menuitem" className="dsh-open-in-vscode-row" disabled>
        <span className="dsh-open-in-vscode-icon"><IconCodeOutline16 /></span>
        <span className="dsh-open-in-vscode-label">{t('menu.catalogFailed')}</span>
      </button>
    )
  }

  const availableCount = catalog.editors.filter(editor => editor.available).length
  const primary = (
    <div className="dsh-open-in-vscode-split">
      <button
        type="button"
        role="menuitem"
        className="dsh-open-in-vscode-primary"
        aria-label={fmt(t('menu.openInEditor.aria'), { name: label, editor: primaryEditor.label })}
        disabled={!primaryEditor.available}
        title={primaryEditor.hint}
        onClick={() => { launch(primaryEditor) }}
        onPointerDown={(event) => {
          if (eagerPointerActivation && event.button === 0) launch(primaryEditor)
        }}
      >
        <span className="dsh-open-in-vscode-icon"><IconCodeOutline16 /></span>
        <span className="dsh-open-in-vscode-label">
          {fmt(t('menu.openInEditor'), { editor: primaryEditor.label })}
        </span>
      </button>
      {catalog.editors.length > 1 && (
        <button
          type="button"
          className="dsh-open-in-vscode-chooser"
          aria-label={fmt(t('menu.openWith.aria'), { name: label })}
          aria-haspopup="menu"
          aria-expanded={chooserOpen}
          onClick={(event) => {
            event.stopPropagation()
            setChooserOpen(value => !value)
          }}
        >
          <IconChevronRightOutline14 />
        </button>
      )}
    </div>
  )

  if (catalog.editors.length === 1) return primary
  return (
    <Menu
      open={chooserOpen}
      anchor={primary}
      items={menuItems}
      selectedId={preferred?.id}
      onSelect={(editorId) => {
        const editor = catalog.editors.find(item => item.id === editorId)
        if (editor !== undefined) launch(editor)
      }}
      onClose={() => { setChooserOpen(false) }}
      side="right"
      compact
      className="dsh-open-in-vscode-menu"
      footer={availableCount === 0 ? [{ id: 'none', label: t('menu.catalogFailed'), disabled: true }] : undefined}
    />
  )
}

/** Native row-menu slot entry. */
export function OpenInVscodeRow(props: OpenInVscodeRowProps) {
  return <OpenInVscodeMenuRow {...props} />
}
