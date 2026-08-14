/**
 * The hand-written host Typert manifest for the openInVscode Remote.
 * Registered through `ctx.typert.register` in the plugin body, it claims the
 * wire endpoint through the strict registry — the same path generated
 * `./typert` artifacts use — so the Host Gateway resolves and invokes
 * `openInVscode/open` without consulting the `@Remote` marker table. That
 * marker independence matters in the harness's source-launch development
 * environment, where the tsx-loaded gateway and a profile-loaded plugin
 * bundle can hold separate copies of the decorator module state.
 */
import type { TypertContribution } from '@deepseek-ai/dsh-typert-registry/types'
import { OPEN_IN_VSCODE_INVOCATIONS } from './contract.ts'

/** The openInVscode namespace's host manifest (strict codecs shared with the client). */
export const TYPERT_MANIFEST: TypertContribution = {
  package: 'dsh-open-in-vscode',
  face: 'host',
  schemas: [],
  model: {
    services: [
      {
        key: 'openInVscode',
        exportName: 'OpenInVscodeRuntime',
        description: 'List available local editors and open registered Workspaces in a selected editor.',
        tags: [],
        members: [
          {
            kind: 'method',
            name: 'list',
            signature: 'list(): EditorCatalog',
          },
          {
            kind: 'method',
            name: 'open',
            signature: 'open(workspaceId: string, editorId: string, signal?: AbortSignal): Promise<{ opened: true }>',
          },
        ],
        types: [],
      },
    ],
    events: [],
    objects: [],
  },
  invocations: OPEN_IN_VSCODE_INVOCATIONS,
}
