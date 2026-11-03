import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"
import { createInsertSchema } from "drizzle-zod"
import { nanoid } from "nanoid"
import type { z } from "zod"

export const bots = pgTable(
  "bots",
  {
    id: text("id").primaryKey().$defaultFn(() => nanoid()),
    // Third-party (Clerk) user id of the owner
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    // Seed for the bot's face
    avatar: text("avatar")
      .notNull()
      .$defaultFn(() => nanoid()),
    // What the bot is for, in a phrase
    job: text("job").notNull(),
    // How it should go about the job
    instructions: text("instructions"),
    // Third-party sandbox id, created lazily later
    sandboxId: text("sandbox_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("bots_user_id_idx").on(table.userId)]
)

export type Bot = typeof bots.$inferSelect
export type NewBot = typeof bots.$inferInsert

// What a user may submit when creating a bot. The owner (userId, from Clerk),
// the id, the sandbox and the timestamp are set on the server, never by the
// client.
export const insertBotSchema = createInsertSchema(bots, {
  name: (schema) =>
    schema.trim().min(1, "Give your bot a name").max(40, "Keep it under 40"),
  job: (schema) =>
    schema.trim().min(1, "Describe the job").max(80, "Keep it under 80"),
  instructions: (schema) => schema.trim().max(2000, "Keep it under 2000"),
  avatar: (schema) => schema.trim().min(1).max(64),
}).omit({ id: true, userId: true, sandboxId: true, createdAt: true })

export type BotInput = z.input<typeof insertBotSchema>
export type BotValues = z.output<typeof insertBotSchema>
