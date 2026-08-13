/**
 * `open-in-vscode` locale namespace: the workspace overflow-menu row copy.
 * Chinese is the product copy; English mirrors it.
 */
/** Simplified Chinese dictionary (the key-set source of truth). */
export declare const zh: {
    'menu.openInVscode': string;
    'menu.openInVscode.aria': string;
};
/** The `open-in-vscode` namespace key union. */
export type OpenInVscodeKey = keyof typeof zh;
/** English dictionary, checked complete against the zh key set. */
export declare const en: {
    'menu.openInVscode': string;
    'menu.openInVscode.aria': string;
};
/** Locale namespace id registered under ctx.locale. */
export declare const NS = "open-in-vscode";
/**
 * Fill one dictionary template's `{name}`-style placeholders.
 * @param template - dictionary text.
 * @param params - placeholder values; absent params replace nothing.
 * @returns the filled text.
 */
export declare function fmt(template: string, params: Record<string, string>): string;
