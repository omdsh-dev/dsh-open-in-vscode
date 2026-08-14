/** `open-in-vscode` locale namespace: workspace editor-launcher copy. */
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    'menu.openInEditor': string;
    'menu.openInEditor.aria': string;
    'menu.openWith.aria': string;
    'menu.loading': string;
    'menu.catalogFailed': string;
    'menu.unavailable': string;
};
/** The `open-in-vscode` namespace key union. */
export type OpenInVscodeKey = keyof typeof zh;
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    'menu.openInEditor': string;
    'menu.openInEditor.aria': string;
    'menu.openWith.aria': string;
    'menu.loading': string;
    'menu.catalogFailed': string;
    'menu.unavailable': string;
};
/** Locale namespace id registered under ctx.locale. */
export declare const NS = "open-in-vscode";
/** Fill one dictionary template's named placeholders. */
export declare function fmt(template: string, params: Record<string, string>): string;
