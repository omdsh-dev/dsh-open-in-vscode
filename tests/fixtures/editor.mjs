/* global process */
import { writeFileSync } from 'node:fs'

const [markerPath, workspacePath] = process.argv.slice(2)
if (markerPath === undefined || workspacePath === undefined) {
  throw new Error('usage: editor.mjs <marker-path> <workspace-path>')
}
writeFileSync(markerPath, `${workspacePath}\n`, 'utf8')
