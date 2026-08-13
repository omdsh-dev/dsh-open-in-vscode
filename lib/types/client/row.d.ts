import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
import { type OpenInVscodeKey } from './locales.ts';
/** The row's business face: the host Remote call behind the menu action. */
export interface OpenInVscodeInjected {
    /**
     * Open one absolute directory in the configured editor.
     * @param path - absolute directory path.
     * @returns fulfillment after the editor launch is accepted.
     */
    open: (path: string) => Promise<void>;
}
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** The workspace overflow-menu row copy. */
        'open-in-vscode': OpenInVscodeKey;
    }
}
/** Full row props: the slot's owner share + the locale seat + the inject face. */
export type OpenInVscodeRowProps = PropsRuntime<'sidebar.workspaces.row-menu'> & PropsLocale<'open-in-vscode'> & OpenInVscodeInjected;
/**
 * Render the locale-following editor row for one Workspace row.
 * @param props - owner share (row identity + close), locale seat, open face.
 * @returns the menu row, or nothing for a row without a directory.
 */
export declare function OpenInVscodeRow({ cwd, label, onClose, open, t }: OpenInVscodeRowProps): import("react").JSX.Element | null;
