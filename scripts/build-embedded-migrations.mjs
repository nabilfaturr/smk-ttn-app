#!/usr/bin/env node
/**
 * Build script: converts src/lib/db/migrations/*.sql → src/lib/db/migrations-embedded.ts
 *
 * Usage: node scripts/build-embedded-migrations.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { join, basename } from "node:path"

const MIGRATIONS_DIR = "src/lib/db/migrations"
const OUTPUT_FILE = "src/lib/db/migrations-embedded.ts"

const sqlFiles = readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith(".sql"))
  .sort()

if (sqlFiles.length === 0) {
  console.error("No .sql files found in", MIGRATIONS_DIR)
  process.exit(1)
}

const entries = sqlFiles.map((file) => {
  const name = basename(file, ".sql")
  const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf-8")
  return { name, sql }
})

const lines = []
lines.push("export interface Migration {")
lines.push("  name: string")
lines.push("  sql: string")
lines.push("}")
lines.push("")
lines.push("export const migrations: Migration[] = [")
for (const { name, sql } of entries) {
  const escaped = sql.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${")
  lines.push("  {")
  lines.push(`    name: "${name}",`)
  lines.push(`    sql: \`${escaped}\`,`)
  lines.push("  },")
}
lines.push("]")
lines.push("")

writeFileSync(OUTPUT_FILE, lines.join("\n"), "utf-8")
console.log(`✓ Wrote ${entries.length} migration(s) to ${OUTPUT_FILE}`)
for (const { name } of entries) {
  console.log(`  - ${name}`)
}
