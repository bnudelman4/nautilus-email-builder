First design decision: the central problem is that Puck and React Email use different representations. Puck stores the email as a serializable JSON tree describing which component types are used, their prop values, and their order. React Email needs actual React components that render down to email-safe, inline-styled HTML. My decision is to have each component defined once in the Puck config, and that config entry's render function returns the matching React Email component directly, fed by the same field values the user edits in the sidebar. The props edited in Puck are the exact props React Email receives. There is no separate "editor version" and "email version" of a component. I rejected the alternative of keeping two definitions, one render path for the live editor and a separate mapping layer, because the two paths drift. Sending follows from this, where Puck hands back the JSON tree, the React Email components render from it, React Email's render function turns that into an HTML string, and the string goes to Resend. Because the preview and the final email come from the same components, what the user sees is what gets delivered.
The tradeoff is that React Email components carry email-specific constraints (inline styles, table-based layout, limited CSS) that normal web components do not. By using them directly as the Puck render, the editor canvas inherits those constraints rather than being a freer web-styled surface.
Update: after implementing the Text block, the design remained the same. The single definition is in emailConfig.components.Text in src/email/blocks.tsx. The three fields of content, color, fontSize go straight into the React Email <Text> render. Important note, should read the diff rather than trusting the summary to make sure changes were proper.

All six React Email components are now registered as Puck blocks. The nesting was verified and every component was tested. Bridge invariant holds across all six: each
component defined exactly once in its config entry's render, field values
forwarded directly to React Email components with no translation layer. As an extra step, I removed default dark-mode CSS to keep editor canvas consistently light to improve visual quality.

Property editing complete. Verified via DOM inspection that
all Text fields (fontSize, lineHeight, color, fontWeight, margin) flow from
Puck data through the bridge to the actual rendered <p> element with correct
inline styles. Container nesting also verified, however it seems that padding cannot be seen visually easily.

Follow up for the last update: the initial preview implementation triggered a React
"Multiple renderers concurrently rendering the same context provider" error
on every preview update, caused by mounting Puck's <Render> component inside
@react-email/render's static renderer (two renderers contending over Puck's
context provider).

I fixed this issue by walking the Puck Data tree directly in the preview, where each entry
calls emailConfig.components[type].render(props) and slot arrays are wrapped
into recursive SlotComponents that re-enter the same walker.

The Bridge invariant still holds, that components are still defined exactly once in
emailConfig; the preview just invokes those definitions via a different code
path than the editor does. Two assumptions documented in code: none of the
current block renders read puck.\* or id; if a future block does, the inert
PuckContext stub will need actual values. The second assumption is that the walker treats array-valued props as slot content, which is true given the current field types but would
need revisiting if a non-slot array field were ever added.

Next step complete, completing Tier 1. Resend send flow added with shared render
path: extracted the walker from preview.tsx into render-email.tsx, exported
renderEmailHtml() consumed by both preview and the new POST /api/send route.
Bridge invariant extends from architecture to operational code: there is one
function that turns Puck data into email HTML, used by both views.

Validation runs before the Resend call (JSON parse, type checks, email
regex, env var presence) so malformed requests can't burn API quota.
Resend's error.message is returned to the client and rendered in
the red error state.

Send button state machine: idle / sending / sent / error, auto-reset to idle 4s after success. Recipient and subject persist across attempts. Then I tested this, and a real send to verified inbox succeeded; malformed address triggered 400 validation correctly, and the sent email matched.

Update: scheduling fully implemented with Temporal.

Architecture:
Workflow imports only @temporalio/workflow runtime plus type-only imports. Sleeps via Temporal's cancellation-aware sleep(); CancelledFailure propagates so Temporal records cancelled workflows as Canceled (not Completed), while still guaranteeing the send activity is never reached when cancellation fires during sleep.

Activitydelegates to the shared sendRenderedEmail helper, so scheduled and immediate sends go through the exact same render and Resend path.

Worker runs as a separate process. Uses tsx to handle JSX in the render chain.

Schedule route validates everything before using Temporal, stores user-facing fields in
workflow memo so the list route can render rows without fetching input.

Cancel uses workflow.cancel() (not terminate) to trigger the workflow's
CancelledFailure path, ensuring no email is sent.

Tradeoff: Temporal visibility query has eventual consistency, which is fine for a demo but in production I'd shadow scheduled emails to the app's own database for the UI listing.

Testing done locally:
Scheduled 2min ahead, email arrived on time, workflow completed in Web UI.
Cancelled before fire, no email sent, workflow status = Canceled, event history shows no ActivityTaskScheduled (sendEmail was never reached).
Datetime picker prevents past times in the UI; API also returns 400 if a past sendAt is sent directly.

Cancellation changes: initial implementation caught CancelledFailure in
the workflow and returned a string, which Temporal interpreted as normal
completion and recorded the status as Completed. Functional guarantee was
correct (no email sent) but the status display was technically semantically wrong.
Changed to let CancelledFailure propagate so Temporal records cancelled
workflows as Canceled. Verified by re-running the cancel test and checking
the Web UI.

Tier 2 complete: Desktop/mobile preview toggle added to preview pane,
600px (email content-width standard) vs 375px (representative phone width),
applied as max-width on a centered wrapper around the iframe. Rendering
path was not changed. PreviewMode is a literal union, widths stored in a typed Record so future modes are a one-line addition.
