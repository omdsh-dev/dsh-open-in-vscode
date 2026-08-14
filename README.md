# dsh-open-in-vscode

Open a registered DeepSeek Harness Workspace in an installed local editor from the Web GUI. The Workspace **…** menu launches the preferred editor directly and exposes an editor chooser when more than one launch target is available.

English | [中文](README.zh.md)

## What it does

- The Host detects installed VS Code, Cursor, Windsurf, Zed, common JetBrains IDEs, the platform terminal, and the platform file manager where a reliable launch route exists. Operator-configured profiles extend that list.
- The primary row opens the Workspace in the configured or browser-remembered editor. Its chevron opens the available-editor menu; a selection launches that editor and becomes the browser's preferred choice.
- Missing configured editors remain visible as disabled rows with a resolution hint. Missing automatic candidates stay out of the menu.
- The client uses `sidebar.workspaces.row-menu` when the Host declares it and otherwise installs the scoped compatibility adapter required by the published DSH `0.1.0-rc.6` Web UI.
- Editor processes detach after launch and outlive the DSH Web server.

## Supported launch targets

| Platform | Automatically detected targets |
| --- | --- |
| macOS | VS Code, Cursor, Windsurf, Zed, IntelliJ IDEA, WebStorm, PyCharm, Terminal, Finder |
| Windows | VS Code, Cursor, Windsurf, Zed, IntelliJ IDEA, WebStorm, PyCharm, Windows Terminal, File Explorer |
| Linux | VS Code, Cursor, Windsurf, Zed, IntelliJ IDEA, WebStorm, PyCharm, `x-terminal-emulator`, `xdg-open` |

PATH lookup applies on every platform. macOS and Windows also probe the standard application locations encoded by each built-in profile. Detection runs when the Host plugin loads; restart DSH after installing an editor or changing configuration.

## Prerequisites

- At least one detected built-in or configured editor executable.
- DSH `0.1.0-rc.6` or newer. A newer runtime may provide the native Workspace row-menu slot; `rc.6` uses the compatibility adapter.

## Install

Add the plugin to the Web profile:

```sh
dsh plugin --profile web add https://github.com/omdsh-dev/dsh-open-in-vscode/archive/refs/tags/v0.2.0.tar.gz
```

Restart the Web server with `SIGTERM`, wait for it to exit, and refresh the page. Never use `kill -9`; it can interrupt a Session zstd write. Confirm the installed version with:

```sh
dsh plugin --profile web list dsh-open-in-vscode --depth 0
```

## Configuration

All deployment choices are validated Cordis configuration fields:

| Key | Default | Meaning |
| --- | --- | --- |
| `command` | `code` | Backward-compatible default editor executable. |
| `args` | `[]` | Arguments before the Workspace directory for the default editor. |
| `label` | `Visual Studio Code` | Display label for the default editor. |
| `autoDetect` | `true` | Add available platform built-ins. |
| `editors` | `[]` | Additional allowlisted `{ id, label, command, args }` profiles. |
| `defaultEditor` | `vscode` | Preferred id until this browser records a selection. |

Example:

```yaml
- id: dsh-open-in-vscode
  name: dsh-open-in-vscode
  config:
    defaultEditor: cursor
    editors:
      - id: fleet
        label: Fleet
        command: fleet
        args: []
```

Editor ids use lowercase letters, numbers, dots, underscores, and hyphens. Duplicate ids, empty labels, and invalid ids fail plugin load. A custom `vscode` id is rejected because the backward-compatible default profile owns it.

## Capability boundary

The browser receives only editor ids, labels, availability, and resolution hints. Commands and arguments never cross the wire. An open request carries only a Workspace id and an editor id; the Host resolves the Workspace through `ctx.workspaceRegistry` and the editor through its validated allowlist before spawning anything.

The plugin opens only a currently registered Workspace whose directory still exists. It never reads, writes, clones, synchronizes, or uploads Workspace files. It registers no model tool, skill, prompt, or model-visible event. The launch needs no Agent approval because it follows an explicit user click in the Workspace menu.

The preferred editor is browser-local state. Different browsers can choose different defaults without changing Host configuration.

## Development

The repository expects a sibling DeepSeek Harness checkout at `../dsh` for linked development dependencies.

```sh
pnpm install
pnpm run check
```

`pnpm run check` runs typecheck, lint, tests, and the production build. Commit `lib/` because file-profile installs do not build the package.

The strict Typert descriptors in `src/contract.ts` are shared by the Host manifest and client Remote contribution. The Host editor registry owns executable discovery and command privacy; the Workspace registry owns id-to-path resolution. The Harness owns the row-menu slot declaration, while the plugin keeps a narrow typed adapter until that declaration reaches the published client package.

## License

MIT
