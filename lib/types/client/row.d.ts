import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type OpenInVscodeKey } from './locales.ts';
/** The row's business face: the host Remote calls behind the menu actions. */
export interface OpenInVscodeInjected {
    /**
     * Open one absolute directory in the configured editor.
     * @param path - absolute directory path.
     * @returns fulfillment after the editor launch is accepted.
     */
    open: (path: string) => Promise<void>;
    /**
     * Open one absolute directory in Windows Explorer.
     * @param path - absolute directory path.
     * @returns fulfillment after the launch is accepted.
     */
    openInExplorer: (path: string) => Promise<void>;
    /**
     * Open one absolute directory in a detached PowerShell window.
     * @param path - absolute directory path.
     * @returns fulfillment after the launch is accepted.
     */
    openInPowerShell: (path: string) => Promise<void>;
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The workspace overflow-menu row copy. */
        'open-in-vscode': OpenInVscodeKey;
    }
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface SlotMap {
        /** Workspace overflow-menu rows (declared by this repo until the harness does). */
        'sidebar.workspaces.row-menu': {
            kind: 'single';
            scope: 'root';
            owner: {
                /** Workspace id of the row's Workspace. */
                workspaceId: string;
                /** Display title of the Workspace. */
                label: string;
                /** Absolute directory path; absent rows render nothing. */
                cwd: string | undefined;
                /** Close the Workspace overflow menu before launching. */
                onClose: () => void;
            };
        };
    }
}
/** Full row props: the slot's owner share + the locale seat + the inject face. */
export type OpenInVscodeRowProps = PropsRuntime<'sidebar.workspaces.row-menu'> & PropsLocale<'open-in-vscode'> & OpenInVscodeInjected;
/** Minimal presentation props shared by the native slot and legacy adapter. */
export interface OpenInVscodeMenuRowProps extends OpenInVscodeInjected {
    /** Display title of the Workspace. */
    label: string;
    /** Absolute directory path; absent rows render nothing. */
    cwd: string | undefined;
    /** Close the Workspace overflow menu before launching. */
    onClose: () => void;
    /** Locale-bound translation seat. */
    t: OpenInVscodeRowProps['t'];
    /** Launch on pointerdown when a legacy menu removes injected DOM before click. */
    eagerPointerActivation?: boolean;
}
/**
 * Render the locale-following menu rows for one Workspace row.
 * @param props - owner share (row identity + close), locale seat, open faces.
 * @returns the menu rows, or nothing for a row without a directory.
 */
export declare function OpenInVscodeMenuRow({ cwd, label, onClose, open, openInExplorer, openInPowerShell, t, eagerPointerActivation, }: OpenInVscodeMenuRowProps): import("react").JSX.Element | null;
/** Native row-menu slot entry. */
export declare function OpenInVscodeRow(props: OpenInVscodeRowProps): import("react").JSX.Element;
