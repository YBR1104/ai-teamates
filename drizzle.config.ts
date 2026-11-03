import { defineConfig } from "drizzle-kit"

// drizzle-kit does not load Next.js env files itself.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file)
  } catch {
    // file missing: fall back to the real environment
  }
}

// Migrations use the direct (unpooled) connection, as Neon recommends.
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED or DATABASE_URL must be set")
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url },
})
