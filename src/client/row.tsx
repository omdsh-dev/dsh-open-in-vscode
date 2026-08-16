/**
 * The workspace overflow-menu rows contributed into the harness's
 * `sidebar.workspaces.row-menu` slot: "Open in VSCode" launches the
 * workspace directory in the configured editor, "Open in Explorer" in
 * Windows Explorer, and "Open in PowerShell" in a detached PowerShell
 * window — all through the host Remote. Pure presentation — data and
 * callbacks arrive through the four props shares (owner share from the
 * slot, the open callbacks from the inject face, the locale seat).
 */
import { Fragment, useRef } from 'react'
import { IconCodeOutline16, IconFolderOpenOutline16 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { fmt, type OpenInVscodeKey } from './locales.ts'

/** The row's business face: the host Remote calls behind the menu actions. */
export interface OpenInVscodeInjected {
  /**
   * Open one absolute directory in the configured editor.
   * @param path - absolute directory path.
   * @returns fulfillment after the editor launch is accepted.
   */
  open: (path: string) => Promise<void>
  /**
   * Open one absolute directory in Windows Explorer.
   * @param path - absolute directory path.
   * @returns fulfillment after the launch is accepted.
   */
  openInExplorer: (path: string) => Promise<void>
  /**
   * Open one absolute directory in a detached PowerShell window.
   * @param path - absolute directory path.
   * @returns fulfillment after the launch is accepted.
   */
  openInPowerShell: (path: string) => Promise<void>
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The workspace overflow-menu row copy. */
    'open-in-vscode': OpenInVscodeKey
  }
}

// The harness does not declare `sidebar.workspaces.row-menu` yet (upstream
// ui-workspace predates the slot), so this repo carries the SlotMap entry
// its own registration types against. The runtime checks `ctx.slots.spec`
// before using the slot — the legacy DOM adapter covers runtimes that lack
// the declaration — and when the harness eventually declares the slot, the
// two interface merges must agree (a mismatch fails the build loudly).
declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface SlotMap {
    /** Workspace overflow-menu rows (declared by this repo until the harness does). */
    'sidebar.workspaces.row-menu': {
      kind: 'single'
      scope: 'root'
      owner: {
        /** Workspace id of the row's Workspace. */
        workspaceId: string
        /** Display title of the Workspace. */
        label: string
        /** Absolute directory path; absent rows render nothing. */
        cwd: string | undefined
        /** Close the Workspace overflow menu before launching. */
        onClose: () => void
      }
    }
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
  /** Close the Workspace overflow menu before launching. */
  onClose: () => void
  /** Locale-bound translation seat. */
  t: OpenInVscodeRowProps['t']
  /** Launch on pointerdown when a legacy menu removes injected DOM before click. */
  eagerPointerActivation?: boolean
}

/** The PowerShell terminal glyph (`>_`); ui-primitives ships no terminal icon. */
function TerminalIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M2.25 4.5L6.75 8L2.25 11.5L3.25 12.75L9.25 8L3.25 3.25L2.25 4.5ZM7 12H13.75V13.5H7V12Z"
        fill="currentColor"
      />
    </svg>
  )
}

/**
 * Render the locale-following menu rows for one Workspace row.
 * @param props - owner share (row identity + close), locale seat, open faces.
 * @returns the menu rows, or nothing for a row without a directory.
 */
export function OpenInVscodeMenuRow({
  cwd,
  label,
  onClose,
  open,
  openInExplorer,
  openInPowerShell,
  t,
  eagerPointerActivation = false,
}: OpenInVscodeMenuRowProps) {
  const activated = useRef<Record<string, boolean>>({})
  if (cwd === undefined) return null
  const makeLaunch = (key: string, fn: (path: string) => Promise<void>) => (): void => {
    if (activated.current[key]) return
    activated.current[key] = true
    // The menu interaction completes with the click; the launch settles async.
    onClose()
    fn(cwd).catch((error: unknown) => {
      console.error('[dsh-open-in-vscode] open failed:', error)
    })
  }
  const actions = [
    {
      key: 'vscode',
      label: t('menu.openInVscode'),
      aria: fmt(t('menu.openInVscode.aria'), { name: label }),
      icon: <IconCodeOutline16 />,
      launch: makeLaunch('vscode', open),
    },
    {
      key: 'explorer',
      label: t('menu.openInExplorer'),
      aria: fmt(t('menu.openInExplorer.aria'), { name: label }),
      icon: <IconFolderOpenOutline16 />,
      launch: makeLaunch('explorer', openInExplorer),
    },
    {
      key: 'powershell',
      label: t('menu.openInPowerShell'),
      aria: fmt(t('menu.openInPowerShell.aria'), { name: label }),
      icon: <TerminalIcon />,
      launch: makeLaunch('powershell', openInPowerShell),
    },
  ]
  return (
    <Fragment>
      {actions.map(action => (
        <button
          key={action.key}
          type="button"
          role="menuitem"
          className="dsh-open-in-vscode-row"
          aria-label={action.aria}
          onClick={action.launch}
          onPointerDown={(event) => {
            if (eagerPointerActivation && event.button === 0) action.launch()
          }}
        >
          <span className="dsh-open-in-vscode-icon">{action.icon}</span>
          <span className="dsh-open-in-vscode-label">{action.label}</span>
        </button>
      ))}
    </Fragment>
  )
}

/** Native row-menu slot entry. */
export function OpenInVscodeRow(props: OpenInVscodeRowProps) {
  return <OpenInVscodeMenuRow {...props} />
}
