/** `open-in-vscode` locale namespace: workspace editor-launcher copy. */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'menu.openInEditor': '在 {editor} 中打开',
  'menu.openInEditor.aria': '在 {editor} 中打开 {name}',
  'menu.openWith.aria': '选择用于打开 {name} 的编辑器',
  'menu.loading': '正在检测编辑器…',
  'menu.catalogFailed': '无法加载编辑器',
  'menu.unavailable': '不可用',
} satisfies Record<string, string>

/** The `open-in-vscode` namespace key union. */
export type OpenInVscodeKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'menu.openInEditor': 'Open in {editor}',
  'menu.openInEditor.aria': 'Open {name} in {editor}',
  'menu.openWith.aria': 'Choose an editor for {name}',
  'menu.loading': 'Detecting editors…',
  'menu.catalogFailed': 'Editors unavailable',
  'menu.unavailable': 'Unavailable',
} satisfies Record<OpenInVscodeKey, string>

/** Locale namespace id registered under ctx.locale. */
export const NS = 'open-in-vscode'

/** Fill one dictionary template's named placeholders. */
export function fmt(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => params[key] ?? `{${key}}`)
}
