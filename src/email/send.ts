import { Resend } from "resend";

import { renderEmailHtml, type SendRequest } from "./render-email";

/**
 * The single code path for actually delivering an email through Resend. Both
 * the immediate-send route and the Temporal sendEmail activity go through here,
 * so rendering (renderEmailHtml) and delivery have one definition each.
 *
 * Returns the Resend email id on success; throws Error with a real message on
 * failure so callers can surface it (route → 500 body, activity → retry/fail).
 */
export async function sendRenderedEmail(input: SendRequest): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error(
      "Email service is not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL).",
    );
  }

  // Same render path as the live preview — no parallel email-rendering logic.
  const html = await renderEmailHtml(input.data);
  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    html,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Resend returned no email ID.");
  return data.id;
}
