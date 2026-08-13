/**
 * The menu-row stylesheet, injected once by the client apply. The row copies
 * the harness menu-cell geometry (figma .Menu_cell: min-h 40, r10, pad 10/8,
 * 14/22, gap 8) and is styled ONLY with `--dsw-alias-*` semantic tokens, so
 * it follows the system theme exactly like the built-in menu rows.
 */
const STYLE_ID = 'dsh-open-in-vscode-styles'

const css = `
.dsh-open-in-vscode-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 8px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-primary);
  text-align: left;
}
.dsh-open-in-vscode-row:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-open-in-vscode-row:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -2px;
}
.dsh-open-in-vscode-row .dsh-open-in-vscode-icon {
  display: inline-flex;
  flex: none;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-open-in-vscode-row .dsh-open-in-vscode-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`

/** Inject the row stylesheet once; a second call is a no-op. */
export function adoptStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}
