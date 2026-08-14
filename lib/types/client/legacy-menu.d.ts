import { type OpenInVscodeMenuRowProps } from './row.tsx';
interface WorkspaceItem {
    workspaceId: string;
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
    listEditors: OpenInVscodeMenuRowProps['listEditors'];
    open: OpenInVscodeMenuRowProps['open'];
}
type WorkspaceTranslate = (key: 'actions.workspace.aria' | 'rename' | 'delete.workspace', params?: Record<string, unknown>) => string;
/**
 * Add the editor launcher to the published rc.6 Workspace menu.
 * @returns disposer removing listeners, observers, and any mounted row.
 */
export declare function installLegacyWorkspaceMenu(options: LegacyWorkspaceMenuOptions): () => void;
export {};
