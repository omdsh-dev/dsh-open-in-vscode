/**
 * The open-in-vscode wire contract, shared verbatim by the host manifest
 * (`ctx.typert.register` in typert.ts) and the client contribution
 * (`ctx.remote.$mount` in client/remote.ts). The list endpoint publishes safe
 * editor metadata; the open endpoint accepts only a registered Workspace id
 * and an editor id from that catalog.
 */
import { z } from 'zod';
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol';
/** Wire codec: a stable Host Workspace id. */
export declare const workspaceIdSchema: z.ZodString;
/** Wire codec: an editor id from the Host-published catalog. */
export declare const editorIdSchema: z.ZodString;
/** Wire codec: one browser-safe editor view. */
export declare const editorViewSchema: z.ZodReadonly<z.ZodObject<{
    id: z.ZodString;
    label: z.ZodString;
    available: z.ZodBoolean;
    hint: z.ZodOptional<z.ZodString>;
}, z.core.$strip>>;
/** Wire codec: the Host editor catalog. */
export declare const editorCatalogSchema: z.ZodReadonly<z.ZodObject<{
    editors: z.ZodArray<z.ZodReadonly<z.ZodObject<{
        id: z.ZodString;
        label: z.ZodString;
        available: z.ZodBoolean;
        hint: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>>;
    defaultEditorId: z.ZodString;
}, z.core.$strip>>;
/** Wire codec: the open result — the editor launch was accepted. */
export declare const openResultSchema: z.ZodReadonly<z.ZodObject<{
    opened: z.ZodLiteral<true>;
}, z.core.$strip>>;
/** The openInVscode Remote namespace's strict invocation descriptors. */
export declare const OPEN_IN_VSCODE_INVOCATIONS: readonly InvocationDescriptor[];
