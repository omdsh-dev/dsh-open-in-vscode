/**
 * The open-in-vscode wire contract, shared verbatim by the host manifest
 * (`ctx.typert.register` in typert.ts) and the client contribution
 * (`ctx.remote.$mount` in client/remote.ts). The endpoints open one absolute
 * directory in the configured editor CLI, in Windows Explorer, or in a
 * detached PowerShell window; the workspace row's directory travels as a
 * plain JSON string (no Host object lookup needed).
 */
import { z } from 'zod';
import type { InvocationDescriptor } from '@deepseek-ai/dsh-typert-protocol';
/** Wire codec: the absolute directory path to open. */
export declare const pathSchema: z.ZodString;
/** Wire codec: the open result — the launch was accepted. */
export declare const openResultSchema: z.ZodReadonly<z.ZodObject<{
    opened: z.ZodLiteral<true>;
}, z.core.$strip>>;
/** The openInVscode Remote namespace's strict invocation descriptors. */
export declare const OPEN_IN_VSCODE_INVOCATIONS: readonly InvocationDescriptor[];
