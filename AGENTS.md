# AGENTS.md — dsh-open-in-vscode

An out-of-tree DeepSeek Harness plugin: the host half registers strict
`openInVscode/list` and `openInVscode/open` Typert Remotes, resolves a
registered Workspace id plus an allowlisted editor id, and launches the
editor; the client half contributes the locale-following split action to the
Workspace row menu.

## Conventions

- The wire contract lives in one module (`src/contract.ts`) shared by the
  host manifest (`src/typert.ts`) and the client contribution
  (`src/client/remote.ts`) — one source pins the endpoint, codecs, and
  result shape.
- The harness owns the slot declaration; this repo only registers into it.
  Until the declaration reaches the published package, the client uses a
  narrow type adapter plus the rc.6 DOM compatibility implementation.
- Browser requests never carry paths, commands, or arguments. The Host owns
  Workspace lookup, editor discovery, availability, and launch plans.
- Registrations are effects: `ctx.effect` / `ctx.typert.register` /
  `ctx.slots.inject` — disposal is asserted in tests.
- Product copy is Chinese via the locale dictionary; code comments and JSDoc
  are English. Model-facing text is English.
- `pnpm run check` = typecheck + lint + test + build before every commit;
  commit `lib/` (file: profile installs run without a build).
