"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ShuffleIcon } from "lucide-react"
import { nanoid } from "nanoid"
import { Controller, useForm, useWatch } from "react-hook-form"

import { createBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  insertBotSchema,
  type BotInput,
  type BotValues,
} from "@/lib/db/schema"

// Each suggestion fills the name, job and instructions in one click
const PRESETS = [
  {
    job: "Research assistant",
    name: "Ada",
    instructions:
      "Answer briefly, cite sources, and ask before running anything destructive.",
  },
  {
    job: "Code reviewer",
    name: "Grace",
    instructions:
      "Review changes for bugs, security issues, and unclear code. Point to the exact line, suggest a fix, and skip style nitpicks.",
  },
  {
    job: "Writing editor",
    name: "Maya",
    instructions:
      "Tighten the prose and keep my voice. Flag unclear sentences and explain each change in one line.",
  },
  {
    job: "Tutor",
    name: "Sage",
    instructions:
      "Explain step by step at my level, ask one check-in question at a time, and let me try before giving the answer.",
  },
]

function emptyBot(): BotInput {
  return { name: "", job: "", instructions: "", avatar: nanoid() }
}

export function BotDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const form = useForm<BotInput, unknown, BotValues>({
    resolver: zodResolver(insertBotSchema),
    defaultValues: emptyBot(),
  })
  const { control, handleSubmit, reset, setValue, formState } = form
  const avatar = useWatch({ control, name: "avatar" })
  const job = useWatch({ control, name: "job" })

  function applyPreset(selectedJob: string | undefined) {
    const options = { shouldDirty: true, shouldValidate: formState.isSubmitted }
    const preset = PRESETS.find((p) => p.job === selectedJob)
    if (!preset) {
      // Chip toggled off: clear the job, leave what the user typed
      setValue("job", "", options)
      return
    }
    setValue("job", preset.job, options)
    setValue("name", preset.name, options)
    setValue("instructions", preset.instructions, options)
  }

  function onOpenChange(next: boolean) {
    setOpen(next)
    // Fresh face and empty fields every time the dialog opens
    if (next) reset(emptyBot())
  }

  const onSubmit = handleSubmit(async (values) => {
    const result = await createBot(values)
    if (!result.ok) {
      toast.add({
        title: "Couldn't create the bot",
        description: result.error,
        type: "error",
      })
      return
    }
    toast.add({
      title: "Bot created",
      description: `${result.bot.name} is ready.`,
      type: "success",
    })
    setOpen(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button variant="secondary" />}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} className="contents">
          <DialogHeader>
            <DialogTitle>New bot</DialogTitle>
            <DialogDescription>
              Give it a face, a name, and a job to do.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <ToggleGroup
              variant="outline"
              className="w-full flex-wrap"
              aria-label="Suggested jobs"
              value={PRESETS.some((p) => p.job === job) ? [job] : []}
              onValueChange={(value) => applyPreset(value[0])}
            >
              {PRESETS.map((preset) => (
                <ToggleGroupItem
                  key={preset.job}
                  value={preset.job}
                  className="rounded-full"
                >
                  {preset.job}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            <Item className="px-0">
              <ItemMedia>
                <ChatAvatar seed={avatar ?? ""} className="size-10" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Face</ItemTitle>
                <ItemDescription>Shuffle until you find one you like.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue("avatar", nanoid())}
                >
                  <ShuffleIcon data-icon="inline-start" />
                  Shuffle
                </Button>
              </ItemActions>
            </Item>

            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bot-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="bot-name"
                    placeholder="Ada"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="job"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bot-job">Job</FieldLabel>
                  <Input
                    {...field}
                    id="bot-job"
                    placeholder="Research assistant"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />

            <Controller
              name="instructions"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bot-instructions">
                    How it should work
                  </FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    id="bot-instructions"
                    rows={4}
                    placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && (
                <Spinner data-icon="inline-start" />
              )}
              Create bot
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
