# Email Builder with Drag & Drop

**Nautilus Engineering · Full-Stack Engineer Take-Home**

## Getting Started

### Option A: Fork (recommended)

1. Click **Fork** on this repo to create your own copy
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/nautilus-email-builder.git
   cd nautilus-email-builder
   ```

### Option B: Clone directly

```bash
git clone https://github.com/xxxoooxoxo/nautilus-email-builder.git
cd nautilus-email-builder
```

> **⚠️ Important:** Do **not** push to this repository. Work on your own fork or a local copy only. If you cloned directly, remove the remote before starting:
>
> ```bash
> git remote remove origin
> ```

---

## Overview

A visual email builder that lets users compose, preview, and send emails using a drag-and-drop interface.

## Tech Stack

| Technology               | Purpose               |
| ------------------------ | --------------------- |
| Next.js 15+ (App Router) | Application framework |
| TypeScript (strict)      | Type safety           |
| React Email              | Email-safe components |
| Resend                   | Email delivery        |
| Puck Editor              | Drag & drop builder   |
| Temporal                 | Durable scheduling    |

## Setup

```bash
# Install dependencies
npm install

# Copy env vars
cp .env.example .env.local
# Fill in your RESEND_API_KEY, etc.

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable            | Description                                             |
| ------------------- | ------------------------------------------------------- |
| `RESEND_API_KEY`    | API key from [resend.com](https://resend.com)           |
| `RESEND_FROM_EMAIL` | Sender email address (default: `onboarding@resend.dev`) |
| `TEMPORAL_ADDRESS`  | Temporal server address (default: `localhost:7233`)     |

### Temporal (for scheduling)

```bash
# Install Temporal CLI: https://docs.temporal.io/cli
temporal server start-dev
```

### Running scheduling locally

Scheduling requires three processes running simultaneously, each in its own terminal tab:

```bash
# Terminal 1: Temporal server (web UI at http://localhost:8233)
temporal server start-dev

# Terminal 2: Temporal worker
npm run worker

# Terminal 3: Next.js dev server
npm run dev
```

The deployed Vercel demo cannot run the Temporal worker (serverless cannot host long-running processes), so scheduling is testable locally only. Immediate sends via Resend work on both local and deployed environments.

## Requirements

### Tier 1 — Must Have

- **Drag & Drop Email Builder** — Puck editor with React Email components (Button, Heading, Text, Image, Container, Section)
- **Component Property Editing** — Sidebar editing for colors, typography, sizing, image URLs, content & links
- **Live Email Preview** — Real-time preview updating as users edit
- **Email Sending** — Send via Resend with recipient input, subject line, status notifications

### Tier 2 — Expected

- **Email Scheduling** — Durable workflow via Temporal with date/time picker, scheduled email list, cancellation
- **Desktop & Mobile Preview** — Toggle between preview widths

### Tier 3 — Impress Us

- Undo / redo
- Starter template library (Welcome Email, Newsletter, Promo)
- Image upload, dark mode, keyboard shortcuts

## Architecture Decisions

### Bridging Puck and React Email

The central problem in this project is that Puck and React Email use different
representations. Puck stores the email as a serializable JSON tree describing
which component types are used, their prop values, and their order. React Email
needs actual React components that render down to email-safe, inline-styled
HTML.

My decision was to have each component defined once in the Puck config, and
that config entry's render function returns the matching React Email component
directly, fed by the same field values the user edits in the sidebar. I rejected the alternative of keeping two definitions (one render path for the editor, a separate mapping
layer for sending).

The tradeoff is that React Email components carry email-specific constraints
(inline styles, table-based layout, limited CSS) that normal web components do
not. By using them directly as the Puck render, the editor canvas inherits
those constraints rather than being a freer web-styled surface.

### Two render paths into one rendering function

The first implementation of the live preview mounted Puck's `<Render>`
component inside React Email's `render()` function. This caused a React error
("Multiple renderers concurrently rendering the same context provider") on
every preview update, because Puck's main renderer and React Email's static
renderer were both walking the same component tree and contending over Puck's
internal context provider.

I fixed this by walking the Puck data tree directly in the preview, each entry
calls `emailConfig.components[type].render(props)` and slot arrays are wrapped
into recursive `SlotComponent`s that re-enter the same walker. Puck's server-components guide states this pattern of using separate render paths for editor vs static contexts.

When I added Resend sending, I extracted the walker into a shared
`render-email.tsx` module. Both the preview and the `POST /api/send` route
import `renderEmailHtml(data)` from there. There is one function that turns
Puck data into email HTML, used by both the preview and the live send. The
same function is also called from the Temporal activity for scheduled sends,
so scheduled and immediate sends go through the exact same render and Resend
path.

### Scheduling with Temporal

I implemented email scheduling as a Temporal workflow plus an activity, with a
worker running as a separate process. The workflow file imports only
`@temporalio/workflow` runtime and type-only imports of the activity. The
workflow sleeps until the scheduled time using Temporal's cancellation-aware
`sleep()`, then calls the `sendEmail` activity. Cancellation is handled by
letting the `CancelledFailure` propagate (an initial version caught it and
returned a string, which Temporal interpreted as normal completion and marked
the workflow as Completed rather than Canceled; the propagation fix records
the correct status while still guaranteeing the send activity is never
reached).

I chose Temporal over a naive `setTimeout` or a database-backed cron because
a `setTimeout` is lost on server restart, an in-memory timer can't be cancelled cleanly from another process, and neither survives a deploy. Temporal persists workflow state, replays it after a crash, retries failed activities with configurable backoff, and supports
clean cancellation.

The scheduling route validates input before connecting to Temporal and
stores `to`, `subject`, and `sendAt` in the workflow memo so the list route
can render rows without re-fetching the full workflow input. Cancel uses
`workflow.cancel()` rather than `terminate()` so the workflow exits through
its `CancelledFailure` path cleanly.

## Assumptions

- **Color picker as future improvement.** Color fields are typed as plain text
  inputs that accept hex strings. A swatch/color-picker would be a Puck custom
  field, planned improvement.

- **Puck's `puck` and `id` props on activity render.** When the preview and
  send paths invoke `emailConfig.components[type].render(props)` directly,
  they supply an inert `PuckContext` stub for `puck` and a synthetic `id`
  because Puck's `PuckComponent` signature requires them. None of the six
  current block renders actually read those values. If a future block does
  read `puck.metadata` or `puck.renderDropZone`, the stub would need real
  values.

- **Walker treats array-valued props as slot content.** The recursive walker
  in `render-email.tsx` distinguishes slots from scalar props by
  `Array.isArray(value)`. This is true for the current field types but
  would need revisiting if a non-slot array field were added.

- **Temporal visibility query has eventual consistency.** The scheduled-email
  list is read from Temporal's visibility index, which lags actual workflow
  state by a few seconds. A newly-scheduled email may not appear in the list
  immediately, and a cancelled one may take a moment to disappear. In
  production I would have a strongly-consistent source.

- **Vercel demo cannot execute scheduled sends.** Temporal scheduling
  requires a long-running worker process, which serverless environments like
  Vercel cannot host. The deployed demo runs the editor, preview, and
  immediate send, but scheduling is functional only when the local worker
  (`npm run worker`) and Temporal server (`temporal server start-dev`) are
  running alongside the dev server.

- **npm overrides for Puck's Tiptap dependency.** `@puckeditor/core` 0.21
  pulls a broken transitive Tiptap 3.20.3. I added an `overrides` block in
  `package.json` pinning `@tiptap/*` to ^3.23.6, which is the minimum-blast
  fix; upgrading Puck would risk API drift in editor code.

- **`tsx` devDep for the worker.** The Temporal worker process needs to
  execute the same render path as the API routes (`renderEmailHtml`), which
  pulls in JSX from `blocks.tsx`. Node v25's native TypeScript support
  strips type annotations but doesn't parse JSX. I added `tsx` as a dev
  dependency to give the worker a JSX-capable runtime.

- **Editor canvas inherits React Email's email-rendering constraints.** The
  Puck canvas renders the React Email components directly, which means
  email-specific layout (table-based, inline styles) shows up in the editor
  view.

## Time Spent

Approximately 5 hours total, with this breakdown:

- ~30 min: project setup, CLAUDE.md, environment configuration
- ~1 hour: Tier 1, Puck/React Email bridge, six components, sidebar editing,
  live preview pane (including the multiple-renderers fix)
- ~30 min: Resend send flow with shared render module
- ~1.5 hours: Tier 2, Temporal scheduling (workflow, activity, worker,
  three API routes, scheduled-list UI), cancellation refinement
- ~15 min: desktop/mobile preview toggle
- ~30 min: Tier 3, starter template library and template-load remount bug fix
- ~10 min: confirmed Puck provides undo/redo natively
- ~45 min: cleanup pass, README, deploy

I worked iteratively with Claude Code, with small prompts at each
step, diff reviews before each commit, and logging decisions iteratively, as can be seen in the commit history.

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Puck Editor](https://puckeditor.com)
- [React Email](https://react.email)
- [Resend](https://resend.com)
- [Temporal](https://temporal.io)
