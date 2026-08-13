/**
 * Host plugin configuration: which editor CLI opens the directory. Only
 * deployment-varying choices live here; the endpoint, codecs, and result
 * shape are protocol constants in contract.ts.
 */

/** Configuration after schema defaults are applied. */
export interface ResolvedConfig {
  /** Executable that opens a directory, resolved through PATH (default `code`). */
  command: string
  /** Extra arguments passed before the directory path. */
  args: string[]
}
