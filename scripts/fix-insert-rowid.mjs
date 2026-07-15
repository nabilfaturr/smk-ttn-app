#!/usr/bin/env node
/**
 * Fix `Number(result.lastInsertRowid)` patterns in IPC handlers.
 *
 * Transforms:
 *   const result = db.insert(X).values({...}).run()
 *   const id = Number(result.lastInsertRowid)
 *
 * Into:
 *   const result = db.insert(X).values({...}).returning().get()
 *   const id = result.id
 *
 * Also handles:
 *   addToSyncLog("X", Number(result.lastInsertRowid), "insert")
 *   → addToSyncLog("X", result.id, "insert")
 *
 * Also handles:
 *   const newId = Number(result.lastInsertRowid)
 *   → const newId = result.id
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const IPC_DIR = "electron/ipc"
const files = readdirSync(IPC_DIR).filter((f) => f.endsWith(".handlers.ts"))

let totalFixed = 0

for (const file of files) {
  const path = join(IPC_DIR, file)
  let content = readFileSync(path, "utf-8")
  const original = content
  let fileFixed = 0

  // Pattern 1: `.values({...}).run()` → `.values({...}).returning().get()`
  // Match `.values(` followed by any content (non-greedy), then `).run()`
  content = content.replace(
    /\.values\(([\s\S]*?)\)\s*\.run\(\)/g,
    (match, inner) => `.values(${inner}).returning().get()`,
  )

  // Pattern 2: `const id = Number(result.lastInsertRowid)` → `const id = result.id`
  content = content.replace(
    /const\s+id\s*=\s*Number\(([a-zA-Z_][a-zA-Z0-9_]*)\.lastInsertRowid\)/g,
    (match, varName) => `const id = ${varName}.id`,
  )

  // Pattern 3: `const newId = Number(result.lastInsertRowid)` → `const newId = result.id`
  content = content.replace(
    /const\s+newId\s*=\s*Number\(([a-zA-Z_][a-zA-Z0-9_]*)\.lastInsertRowid\)/g,
    (match, varName) => `const newId = ${varName}.id`,
  )

  // Pattern 4: inline `Number(varName.lastInsertRowid)` (in addToSyncLog)
  content = content.replace(
    /Number\(([a-zA-Z_][a-zA-Z0-9_]*)\.lastInsertRowid\)/g,
    (match, varName) => `${varName}.id`,
  )

  if (content !== original) {
    // Count how many fixes
    const matches = original.match(/Number\([a-zA-Z_][a-zA-Z0-9_]*\.lastInsertRowid\)/g)
    fileFixed = matches ? matches.length : 0
    writeFileSync(path, content, "utf-8")
    totalFixed += fileFixed
    console.log(`✓ ${file}: ${fileFixed} fix(es)`)
  }
}

console.log(`\nTotal: ${totalFixed} fix(es) across ${files.length} file(s)`)
