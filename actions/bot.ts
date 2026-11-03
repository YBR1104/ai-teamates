"use server"

import { auth } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"

import { getDb } from "@/lib/db"
import { bots, insertBotSchema, type Bot } from "@/lib/db/schema"

export type CreateBotResult =
  | { ok: true; bot: Bot }
  | { ok: false; error: string }

export async function createBot(input: unknown): Promise<CreateBotResult> {
  // Signed-out callers never reach the insert
  const { userId } = await auth.protect()

  const parsed = insertBotSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid bot",
    }
  }

  const [bot] = await getDb()
    .insert(bots)
    .values({
      ...parsed.data,
      // Empty textarea means no instructions
      instructions: parsed.data.instructions || null,
      userId,
    })
    .returning()

  revalidatePath("/")
  return { ok: true, bot }
}
