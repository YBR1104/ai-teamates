import { NextResponse } from "next/server"

import { getPool } from "@/lib/db"

export const dynamic = "force-dynamic"

// Proves Neon Postgres works end to end: a read, and a write + read-back in a
// session-scoped temp table (nothing is persisted).
export async function GET() {
  const client = await getPool().connect()
  try {
    const read = await client.query("select now() as now, current_database() as db")
    await client.query("create temp table db_health (id serial primary key, note text)")
    await client.query("insert into db_health (note) values ($1)", ["hello neon"])
    const write = await client.query("select count(*)::int as rows, max(note) as note from db_health")
    return NextResponse.json({
      ok: true,
      database: read.rows[0].db,
      serverTime: read.rows[0].now,
      writeCheck: write.rows[0],
    })
  } catch (error) {
    console.error("db-health failed", error)
    return NextResponse.json({ ok: false }, { status: 500 })
  } finally {
    client.release()
  }
}
