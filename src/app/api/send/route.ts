import { NextResponse } from "next/server";

import type { SendResponse } from "@/email/render-email";
import { sendRenderedEmail } from "@/email/send";
import { EMAIL_PATTERN, isEmailData } from "@/email/validation";

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

  try {
    // Shared render + Resend path — identical to the scheduled send's activity.
    const id = await sendRenderedEmail({ to, subject, data });
    return NextResponse.json({ id }, { status: 200 });
  } catch (cause) {
    // Surface the real error message rather than swallowing it.
    return NextResponse.json(
      {
        error:
          cause instanceof Error ? cause.message : "Failed to send email.",
      },
      { status: 500 },
    );
  }
}
