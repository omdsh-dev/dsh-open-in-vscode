/**
 * `open-in-vscode` locale namespace: the workspace overflow-menu row copy.
 * Chinese is the product copy; English mirrors it.
 */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'menu.openInVscode': '在 VSCode 中打开',
  'menu.openInVscode.aria': '在 VSCode 中打开 {name}',
  'menu.openInExplorer': '在资源管理器中打开',
  'menu.openInExplorer.aria': '在资源管理器中打开 {name}',
  'menu.openInPowerShell': '在 PowerShell 中打开',
  'menu.openInPowerShell.aria': '在 PowerShell 中打开 {name}',
} satisfies Record<string, string>

/** The `open-in-vscode` namespace key union. */
export type OpenInVscodeKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'menu.openInVscode': 'Open in VSCode',
  'menu.openInVscode.aria': 'Open {name} in VSCode',
  'menu.openInExplorer': 'Open in Explorer',
  'menu.openInExplorer.aria': 'Open {name} in Explorer',
  'menu.openInPowerShell': 'Open in PowerShell',
  'menu.openInPowerShell.aria': 'Open {name} in PowerShell',
} satisfies Record<OpenInVscodeKey, string>

/** Locale namespace id registered under ctx.locale. */
export const NS = 'open-in-vscode'

/**
 * Fill one dictionary template's `{name}`-style placeholders.
 * @param template - dictionary text.
 * @param params - placeholder values; absent params replace nothing.
 * @returns the filled text.
 */
export function fmt(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => params[key] ?? `{${key}}`)
}
