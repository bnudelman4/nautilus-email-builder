import { proxyActivities, sleep } from "@temporalio/workflow";

import type * as activities from "./activities";
// Type-only import (erased at compile time) — the workflow bundle never pulls
// in Resend, React Email, or any other non-deterministic/runtime code.
import type { ScheduleRequest } from "@/email/render-email";

// proxyActivities is the ONLY way the workflow reaches the activity. The
// workflow imports just the activity's TYPE, never its implementation.
const { sendEmail } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
  retry: {
    maximumAttempts: 3,
    initialInterval: "2s",
    backoffCoefficient: 2,
  },
});

/**
 * Durable scheduled send. Sleeps until `sendAt`, then runs the sendEmail
 * activity. Replay-safe: no Resend import, no wall-clock side effects.
 *
 * Note on time: @temporalio/workflow patches the global `Date` so that
 * `Date.now()` inside a workflow returns the deterministic, replay-safe event
 * time (it is NOT the host wall clock). This SDK version exposes no separate
 * `workflow.now()`; the patched `Date.now()` is the sanctioned primitive and
 * satisfies the replay-safety rule.
 *
 * Cancellation: `sleep` is cancellation-aware. If the workflow is cancelled
 * before the delay elapses, `sleep` rejects with a CancelledFailure which we
 * let propagate. sendEmail is never reached, so no email is sent, and Temporal
 * records the workflow as Canceled (not Completed).
 */
export async function scheduleEmailWorkflow(
  input: ScheduleRequest,
): Promise<string> {
  const delayMs = Date.parse(input.sendAt) - Date.now();

  // sleep(0) returns immediately for past/now times; negative is clamped.
  await sleep(Math.max(delayMs, 0));

  const { to, subject, data } = input;
  return sendEmail({ to, subject, data });
}
