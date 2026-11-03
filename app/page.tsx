import { UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { PlusIcon } from "lucide-react"
import { nanoid } from "nanoid"
import { Suspense } from "react"

import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

async function ProtectedPage() {
  // Redirects signed-out visitors to sign-in
  await auth.protect()

  return (
    <div className="flex min-h-svh flex-col p-6">
      <header className="flex items-center justify-end gap-2">
        <UserButton />
      </header>
      <Empty>
        <EmptyHeader>
          <EmptyMedia>
            {/* New seed on every request, so each refresh shows a new face */}
            <ChatAvatar seed={nanoid()} className="size-16" />
          </EmptyMedia>
          <EmptyTitle>Meet your first bot</EmptyTitle>
          <EmptyDescription>
            Every bot gets its own personality, memory, and face. Spin one up
            and start the conversation.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary">
            <PlusIcon data-icon="inline-start" />
            Create a new bot
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense>
      <ProtectedPage />
    </Suspense>
  )
}
