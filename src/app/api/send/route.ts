import { NextResponse } from "next/server";
import { Resend } from "resend";

import {
  renderEmailHtml,
  type EmailData,
  type SendResponse,
} from "@/email/render-email";

// Basic structural check — a full email parser is out of scope and a regex is
// enough to reject obviously malformed addresses before spending Resend quota.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmailData(value: unknown): value is EmailData {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.content) &&
    typeof candidate.root === "object" &&
    candidate.root !== null
  );
}

export async function POST(
  request: Request,
): Promise<NextResponse<SendResponse>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body is not valid JSON." }, {
      status: 400,
    });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Request body must be an object." }, {
      status: 400,
    });
  }

  const { to, subject, data } = body as Record<string, unknown>;

  // Validate everything before touching Resend so malformed requests fail fast
  // and never consume API quota.
  if (typeof to !== "string" || !EMAIL_PATTERN.test(to)) {
    return NextResponse.json(
      { error: "`to` must be a valid email address." },
      { status: 400 },
    );
  }
  if (typeof subject !== "string" || subject.trim() === "") {
    return NextResponse.json(
      { error: "`subject` must be a non-empty string." },
      { status: 400 },
    );
  }
  if (!isEmailData(data)) {
    return NextResponse.json(
      { error: "`data` must be a valid Puck data tree." },
      { status: 400 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error:
          "Email service is not configured (missing RESEND_API_KEY or RESEND_FROM_EMAIL).",
      },
      { status: 500 },
    );
  }

  try {
    // Same render path as the live preview — walk the Puck tree via emailConfig
    // and produce HTML with @react-email/render. No third render path.
    const html = await renderEmailHtml(data);
    const resend = new Resend(apiKey);
    const { data: sent, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    // Surface Resend's real error message rather than swallowing it.
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!sent) {
      return NextResponse.json(
        { error: "Resend returned no email ID." },
        { status: 500 },
      );
    }

    return NextResponse.json({ id: sent.id }, { status: 200 });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error ? cause.message : "Failed to send email.",
      },
      { status: 500 },
    );
  }
}
