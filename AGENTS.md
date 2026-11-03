<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Git

-Never create branches , worktress , or commit automatically. Only do so when the user expicitly asks for that specific actions in the current request.
-Leave changes uncommited in the working tree on the current branch and let the user decide when and how to commit.

## Database

- Only apply schema changes with `npm run db:push` (`drizzle-kit push`). Never use migrations: do not run `drizzle-kit generate` or `drizzle-kit migrate`, and do not create or commit a `drizzle/` migrations folder or SQL migration files.
- This is a development project. There is no backward compatibility and the data is worthless. Prefer data loss: never backfill, migrate, or preserve existing rows, and never spend effort on keeping old data working. Every schema change means a clean slate.

## Forms

Reference implementation: `lib/db/schema.ts` (`insertBotSchema`), `actions/bot.ts` (`createBot`), `components/bot-dialog.tsx`. Copy its shape for new forms.

**One schema, validated twice**
- Derive the insert schema from the Drizzle table with `createInsertSchema` from `drizzle-zod`, and export it from `lib/db/schema.ts` next to the table. Do not hand-write a second zod schema for a table that already exists.
- Override columns with refinements to add the user-facing rules: `trim()`, `min(1, "message")` and `max(n, "message")`, with a short, human error message.
- `.omit()` every column the client must not control: `id`, `userId`, third-party ids such as `sandboxId`, and timestamps. Those are set on the server.
- Export `z.input` and `z.output` types (`BotInput`, `BotValues`). Use the input type for form values and the output type for the submit handler, so `useForm<Input, unknown, Output>`.
- The same schema runs on the client (`zodResolver`) and again in the server action. Never trust the client validation alone.

**Server actions** (`actions/<name>.ts`, `"use server"`)
- Take `input: unknown`, not the typed values, and `safeParse` it with the insert schema.
- Get the owner from Clerk on the server with `const { userId } = await auth.protect()`. Never accept a `userId` from the form or the client.
- Return a result object (`{ ok: true, ... } | { ok: false, error }`) for expected failures instead of throwing. Show errors in the form or as a toast.
- Call `revalidatePath` after a write so server-rendered pages refresh.
- Write through `getDb()` from `@/lib/db`. Turn an empty optional string into `null` before inserting.

**Client forms**
- Use `react-hook-form` with `zodResolver(schema)` from `@hookform/resolvers/zod`. Mark the file `"use client"`.
- Build fields with the shadcn `Field`, `FieldLabel`, `FieldError` and `FieldGroup` primitives. Wrap each input in `Controller` and spread `field` onto it. Set `data-invalid` on `Field` and `aria-invalid` on the input from `fieldState.invalid`, and give each input an `id` that matches its label's `htmlFor`.
- Follow the shadcn skill and `.agents/skills/shadcn/rules/forms.md`. Use the project's existing components (`Input`, `Textarea`, `ToggleGroup`, `Item`, `Spinner`, `Dialog`) and a `Button` with `data-icon="inline-start"` on its icon. Check `components/ui/` before adding anything.
- Read form values for display with `useWatch`, not `watch`. Set values programmatically with `setValue(name, value, { shouldDirty: true, shouldValidate: formState.isSubmitted })`.
- Reset the form with fresh defaults each time a dialog opens (`reset(...)` in `onOpenChange`), so no stale text or old seed carries over.
- Disable the submit button while `formState.isSubmitting` and show a `Spinner` in it. Report the outcome with `toast.add(...)` from `@/components/ui/toast`, and close the dialog on success only.
- A shortcut that fills one field (a preset chip, a suggestion) must fill every field it implies. Check what the user sees afterwards: no half-filled form. Toggling a preset off clears only the field it controls.
- Placeholders show an example value from the design. They are not default values.
- Random values the user can reroll (like the avatar seed) live in a form field, generated with `nanoid()`. They are validated for length only.

**Checks before calling a form done**
- `npm run typecheck`, `npm run lint -- <changed files>`, and `npm run build` all pass.
- Open the form in the running app while signed in and exercise it: empty submit shows every error, a valid submit creates the row, cancel and reopen starts clean. Say plainly if you could not do this.

## DiceBear

Use DiceBear 10. Documentation: https://www.dicebear.com/llms.txt

There are seven native cores with identical output, not one library with
wrappers. Use the one matching this project's language. Do not reach for the
JavaScript core when the project is written in something else:

    JavaScript  @dicebear/core + @dicebear/styles
    PHP         dicebear/core + dicebear/styles
    Python      dicebear-core + dicebear-styles
    Rust        dicebear-core + dicebear-styles
    Go          github.com/dicebear/dicebear-go/v10 + github.com/dicebear/styles/v10
    Dart        dicebear_core + dicebear_styles
    C#          DiceBear.Core + DiceBear.Styles

Every style page carries a loading snippet for all seven, for example
https://www.dicebear.com/styles/lorelei/index.md

HTTP API: https://api.dicebear.com/10.x/<style>/svg?seed=<seed> The seed is a
query parameter, not a path segment. Options are query parameters too; array
values are separated by commas.

Options named after a component end in Variant: eyesVariant, not eyes. This
holds in all seven cores and in the HTTP API. Look up the options of a style at
https://api.dicebear.com/10.x/<style>/options.json

Write these forms, not the ones on the left. The left column is pre-10 and the
API does not reject it, so an outdated call runs and silently does the wrong
thing:

    avatars.dicebear.com/api/<style>/<seed>.svg  ->  api.dicebear.com/10.x/<style>/svg?seed=<seed>
    api.dicebear.com/9.x/<style>/svg             ->  api.dicebear.com/10.x/<style>/svg
    npm install @dicebear/collection             ->  npm install @dicebear/styles
    npm install @dicebear/lorelei                ->  npm install @dicebear/styles
    createAvatar(lorelei, { seed })              ->  new Avatar(new Style(definition), { seed })
    { eyes: ['variant01'] }                      ->  { eyesVariant: ['variant01'] }
    ?radius=50                                   ->  ?borderRadius=50

Only JavaScript and the HTTP API have a pre-10 form. The other six cores were
released in 2026 and never had one, so any older-looking PHP, Python, Rust, Go,
Dart or C# API attributed to DiceBear is invented rather than outdated.