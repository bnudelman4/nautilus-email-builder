import type { SendRequest } from "@/email/render-email";
import { sendRenderedEmail } from "@/email/send";

/**
 * Temporal activity: the only place side effects (rendering + Resend) happen.
 * Delegates to the shared sendRenderedEmail helper so the scheduled path and
 * the immediate-send route deliver through one identical code path.
 */
export async function sendEmail(input: SendRequest): Promise<string> {
  return sendRenderedEmail(input);
}
