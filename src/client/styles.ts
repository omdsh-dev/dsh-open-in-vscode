/** Workspace editor-launcher styles using Harness semantic tokens. */
const STYLE_ID = 'dsh-open-in-vscode-styles'

const css = `
.dsh-open-in-vscode-menu {
  display: block;
  width: 100%;
}
.dsh-open-in-vscode-row,
.dsh-open-in-vscode-split {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
}
.dsh-open-in-vscode-row,
.dsh-open-in-vscode-primary {
  gap: 8px;
  padding: 8px 10px;
  font-size: 14px;
  line-height: 22px;
  text-align: left;
}
.dsh-open-in-vscode-primary,
.dsh-open-in-vscode-chooser {
  display: flex;
  align-items: center;
  min-height: 40px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
.dsh-open-in-vscode-primary {
  flex: 1;
  min-width: 0;
  border-radius: 10px 0 0 10px;
}
.dsh-open-in-vscode-chooser {
  flex: none;
  width: 30px;
  justify-content: center;
  border-radius: 0 10px 10px 0;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-open-in-vscode-row:not(:disabled):hover,
.dsh-open-in-vscode-primary:not(:disabled):hover,
.dsh-open-in-vscode-chooser:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsh-open-in-vscode-row:focus-visible,
.dsh-open-in-vscode-primary:focus-visible,
.dsh-open-in-vscode-chooser:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -2px;
}
.dsh-open-in-vscode-row:disabled,
.dsh-open-in-vscode-primary:disabled {
  cursor: default;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-open-in-vscode-row .dsh-open-in-vscode-icon,
.dsh-open-in-vscode-primary .dsh-open-in-vscode-icon {
  display: inline-flex;
  flex: none;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-open-in-vscode-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
`

/** Inject the launcher stylesheet once; a second call is a no-op. */
export function adoptStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css
  document.head.appendChild(style)
}
