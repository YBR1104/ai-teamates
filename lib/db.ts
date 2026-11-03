import { attachDatabasePool } from "@vercel/functions"
import { parseEnv } from "@neon/env"
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import config from "../neon"
import * as schema from "./db/schema"

// Neon + Vercel (Fluid compute): node-postgres pool, attached so Vercel can
// drain idle connections before the function is suspended.
const globalForDb = globalThis as unknown as {
  pgPool?: Pool
  drizzleDb?: NodePgDatabase<typeof schema>
}

function createPool() {
  const { postgres } = parseEnv(config, ["DATABASE_URL"])
  const pool = new Pool({ connectionString: postgres.databaseUrl })
  attachDatabasePool(pool)
  return pool
}

export function getPool() {
  globalForDb.pgPool ??= createPool()
  return globalForDb.pgPool
}

// Drizzle client on the shared pool. Lazy, so importing this module does not
// open a connection (e.g. during `next build`).
export function getDb() {
  globalForDb.drizzleDb ??= drizzle({ client: getPool(), schema })
  return globalForDb.drizzleDb
}

export { schema }
