import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import type { ScheduleResponse } from "@/email/render-email";
import { EMAIL_PATTERN, isEmailData } from "@/email/validation";
import { getTemporalClient, TASK_QUEUE } from "@/temporal/client";
// Type-only import (erased) — gives a typed workflow handle without bundling
// the workflow's runtime into this serverless route.
import type { scheduleEmailWorkflow } from "@/temporal/workflows";

export async function POST(
  request: Request,
): Promise<NextResponse<ScheduleResponse>> {
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

  const { to, subject, data, sendAt } = body as Record<string, unknown>;

  // Same validation as the immediate-send route, plus a future-datetime check.
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
  if (typeof sendAt !== "string") {
    return NextResponse.json(
      { error: "`sendAt` must be an ISO datetime string." },
      { status: 400 },
    );
  }
  const sendAtMs = Date.parse(sendAt);
  if (Number.isNaN(sendAtMs)) {
    return NextResponse.json(
      { error: "`sendAt` is not a parseable datetime." },
      { status: 400 },
    );
  }
  if (sendAtMs <= Date.now()) {
    return NextResponse.json(
      { error: "`sendAt` must be in the future." },
      { status: 400 },
    );
  }

  try {
    const client = await getTemporalClient();
    const workflowId = `email-${randomUUID()}`;

    // Reference the workflow by name (string) so the runtime isn't imported,
    // but type the handle via the erased import for arg safety. memo carries
    // the human-facing fields so the list route can render rows without
    // fetching workflow input.
    await client.workflow.start<typeof scheduleEmailWorkflow>(
      "scheduleEmailWorkflow",
      {
        taskQueue: TASK_QUEUE,
        workflowId,
        args: [{ to, subject, data, sendAt }],
        // Generous ceiling so sends scheduled far ahead are allowed to wait.
        workflowExecutionTimeout: "365 days",
        memo: { to, subject, sendAt },
      },
    );

    return NextResponse.json({ workflowId }, { status: 200 });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Failed to schedule email.",
      },
      { status: 500 },
    );
  }
}
