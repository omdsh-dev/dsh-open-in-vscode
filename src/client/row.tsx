/**
 * The workspace overflow-menu row contributed into the harness's
 * `sidebar.workspaces.row-menu` slot: "Open in VSCode" launches the
 * workspace directory in the configured editor through the host Remote.
 * Pure presentation — data and callbacks arrive through the four props
 * shares (owner share from the slot, the open callback from the inject
 * face, the locale seat).
 */
import { useRef } from 'react'
import { IconCodeOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { fmt, type OpenInVscodeKey } from './locales.ts'

/** The row's business face: the host Remote call behind the menu action. */
export interface OpenInVscodeInjected {
  /**
   * Open one absolute directory in the configured editor.
   * @param path - absolute directory path.
   * @returns fulfillment after the editor launch is accepted.
   */
  open: (path: string) => Promise<void>
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The workspace overflow-menu row copy. */
    'open-in-vscode': OpenInVscodeKey
  }
}

/** Full row props: the slot's owner share + the locale seat + the inject face. */
export type OpenInVscodeRowProps =
  PropsRuntime<'sidebar.workspaces.row-menu'>
  & PropsLocale<'open-in-vscode'>
  & OpenInVscodeInjected

/** Minimal presentation props shared by the native slot and legacy adapter. */
export interface OpenInVscodeMenuRowProps extends OpenInVscodeInjected {
  /** Display title of the Workspace. */
  label: string
  /** Absolute directory path; absent rows render nothing. */
  cwd: string | undefined
  /** Close the Workspace overflow menu before launching the editor. */
  onClose: () => void
  /** Locale-bound translation seat. */
  t: OpenInVscodeRowProps['t']
  /** Launch on pointerdown when a legacy menu removes injected DOM before click. */
  eagerPointerActivation?: boolean
}

/**
 * Render the locale-following editor row for one Workspace row.
 * @param props - owner share (row identity + close), locale seat, open face.
 * @returns the menu row, or nothing for a row without a directory.
 */
export function OpenInVscodeMenuRow({
  cwd,
  label,
  onClose,
  open,
  t,
  eagerPointerActivation = false,
}: OpenInVscodeMenuRowProps) {
  const activated = useRef(false)
  if (cwd === undefined) return null
  const launch = (): void => {
    if (activated.current) return
    activated.current = true
    // The menu interaction completes with the click; the launch settles async.
    onClose()
    open(cwd).catch((error: unknown) => {
      console.error('[dsh-open-in-vscode] open failed:', error)
    })
  }
  return (
    <button
      type="button"
      role="menuitem"
      className="dsh-open-in-vscode-row"
      aria-label={fmt(t('menu.openInVscode.aria'), { name: label })}
      onClick={launch}
      onPointerDown={(event) => {
        if (eagerPointerActivation && event.button === 0) launch()
      }}
    >
      <span className="dsh-open-in-vscode-icon"><IconCodeOutline16 /></span>
      <span className="dsh-open-in-vscode-label">{t('menu.openInVscode')}</span>
    </button>
  )
}

/** Native row-menu slot entry. */
export function OpenInVscodeRow(props: OpenInVscodeRowProps) {
  return <OpenInVscodeMenuRow {...props} />
}
