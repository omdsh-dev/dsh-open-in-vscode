# AGENTS.md — dsh-open-in-vscode

An out-of-tree DeepSeek Harness plugin: the host half registers one strict
Typert Remote (`openInVscode/open`) that spawns the configured editor CLI on
the workspace directory; the client half registers into the harness's
`sidebar.workspaces.row-menu` slot (ui-workspace) and renders the
locale-following menu row.

## Conventions

- The wire contract lives in one module (`src/contract.ts`) shared by the
  host manifest (`src/typert.ts`) and the client contribution
  (`src/client/remote.ts`) — one source pins the endpoint, codecs, and
  result shape.
- The harness owns the slot declaration; this repo only registers into it.
  The slot, Menu's node entry kind, and their tests live in the harness
  checkout (packages/client/ui-workspace + ui-primitives).
- Registrations are effects: `ctx.effect` / `ctx.typert.register` /
  `ctx.slots.inject` — disposal is asserted in tests.
- Product copy is Chinese via the locale dictionary; code comments and JSDoc
  are English. Model-facing text is English.
- `pnpm run check` = typecheck + lint + test + build before every commit;
  commit `lib/` (file: profile installs run without a build).
