import { type OpenInVscodeMenuRowProps } from './row.tsx';
interface WorkspaceItem {
    title: string;
    path: string;
}
interface WorkspaceListSource {
    getSnapshot(): {
        items: readonly WorkspaceItem[];
    };
}
export interface LegacyWorkspaceMenuOptions {
    workspaces: WorkspaceListSource;
    workspaceT: WorkspaceTranslate;
    rowT: OpenInVscodeMenuRowProps['t'];
    open: (path: string) => Promise<void>;
    openInExplorer: (path: string) => Promise<void>;
    openInPowerShell: (path: string) => Promise<void>;
}
type WorkspaceTranslate = (key: 'actions.workspace.aria' | 'rename' | 'delete.workspace', params?: Record<string, unknown>) => string;
/**
 * Add the Open in VSCode row to the published rc.6 Workspace menu.
 * @returns disposer removing listeners, observers, and any mounted row.
 */
export declare function installLegacyWorkspaceMenu(options: LegacyWorkspaceMenuOptions): () => void;
export {};
