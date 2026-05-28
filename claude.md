# CLAUDE.md

Project context and working rules for Claude Code. Read this fully before making changes.

## What this is

A visual drag-and-drop email builder. Users compose an email by dragging components onto a canvas, edit their properties in a sidebar, see a live preview, then send or schedule it. This is a take-home assessment graded on architecture, code quality, product thinking, completeness, and README communication.

## The core challenge (most important section)

The single most architecturally important thing in this project is bridging the drag-and-drop editor (Puck) with React Email's rendering model. These were not built to talk to each other:

- Puck holds editor state as a serializable JSON tree (a `Data` object describing component types and their props).
- React Email needs real React components that render to email-safe, inline-styled HTML for inboxes.

The bridge between these two is where the review focuses. Treat the Puck component config and the React Email components as one shared definition where possible: each builder block maps to a React Email component, props edited in the Puck sidebar are the same props passed to the React Email component at render time. Do not maintain two divergent representations. When you generate the final email, render the React Email components from the Puck data tree and use React Email's render function to produce the HTML that gets sent via Resend.

Every structural decision should serve a clean, single-source-of-truth mapping from Puck data to React Email output. Call out this mapping explicitly in code comments where it happens.

## Stack (do not substitute)

These are fixed for this project. Do not swap any of them, do not introduce alternatives, do not add competing libraries.

- Next.js 15+ with the App Router
- TypeScript in strict mode
- React Email for all email components and HTML rendering
- Resend for email delivery
- Puck Editor for the drag-and-drop builder
- Temporal for durable scheduling

If a task seems to call for a different drag library, workflow engine, or email tool, stop and flag it rather than introducing one.

## Build order (strict, do not skip ahead)

Complete and verify each tier before starting the next. A solid Tier 1 + 2 matters more than a scattered attempt at everything. Depth over breadth.

Tier 1 (must have, get this airtight first):
1. Puck editor rendering with a single React Email component on the canvas.
2. Add React Email components one at a time as Puck blocks: Button, Heading, Text, Image, Container, Section.
3. Sidebar property editing: colors, typography, sizing, image URLs, content, links.
4. Live preview that re-renders immediately as components are edited.
5. Send via Resend: recipient input, subject line, and real status notifications (sending / sent / error).

Tier 2 (expected):
6. Email scheduling via a durable Temporal workflow: date/time picker, list of scheduled emails, cancellation.
7. Desktop and mobile preview toggle (width switch).

Tier 3 (only after 1 and 2 are solid, pick one or two, do not chase all):
8. Undo/redo and a starter template library (Welcome, Newsletter, Promo) are the highest value for least effort. Prefer these over image upload, dark mode, or keyboard shortcuts.

Do not move to the next tier until the current one works end to end.

## Hard rules

- Strict TypeScript. Never use `any`. If a type is genuinely unavoidable, use `unknown` and narrow it, and add a comment explaining why a precise type was not possible.
- Leverage what the libraries already provide. Do not hand-roll anything Puck, React Email, or Resend already handles. Before writing custom logic for editor behavior, rendering, or sending, check whether the library exposes it. Reinventing framework features is an explicit failure mode for this project.
- Graceful error handling on every API call (Resend, Temporal) and every user input. No silent failures. Surface clear, user-facing error states, never just a console log.
- Single source of truth for the Puck-to-React-Email mapping. No duplicated or divergent component definitions.
- Keep it lightweight. The best version of this feels small because the tools do the heavy lifting. Prefer deleting code over adding it.
- Comment where intent is not obvious, especially at the editor-to-email bridge. Do not comment obvious lines.
- Do not add dependencies beyond the fixed stack without flagging it first.
- Do not generate dead code, placeholder stubs, or speculative abstractions for features not in the current tier.

## Workflow rules

- Work in small, scoped steps that map to a single build-order item. After each, stop so the change can be reviewed and committed before continuing.
- Make meaningful, incremental commits. Commit history is graded and should show progress tier by tier, not one large dump.
- After any change, the project must still pass `npm run build` with strict TypeScript and no lint errors before the step is considered done.
- When you make a structural choice (state management, how the bridge is implemented, how scheduling is wired), state the tradeoff briefly so it can go into the README's Architecture Decisions section.
- If a requirement is ambiguous, ask rather than guess.

## Environment and constraints

- Secrets live in `.env.local` at the project root and must never be committed or hard-coded. Confirm `.env*.local` stays in `.gitignore`.
- Resend uses `onboarding@resend.dev` as the sender in development; testing can only send to the account's own verified email. Assume a verified domain would be needed in production and note this as an assumption.
- The deployed demo (Vercel) does not need Temporal running, but scheduling must be fully implemented in the codebase. Build scheduling for real; do not stub it just because the live demo cannot execute it.

## README sections to keep updated

As decisions get made, keep notes for these README sections so they can be written truthfully at the end: Architecture Decisions (lead with the Puck-to-React-Email bridge), Assumptions, and Time Spent.