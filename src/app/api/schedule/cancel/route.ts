import { NextResponse } from "next/server";

import type { CancelResponse } from "@/email/render-email";
import { getTemporalClient } from "@/temporal/client";

export async function POST(
  request: Request,
): Promise<NextResponse<CancelResponse>> {
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

  const { workflowId } = body as Record<string, unknown>;
  if (typeof workflowId !== "string" || workflowId.trim() === "") {
    return NextResponse.json(
      { error: "`workflowId` must be a non-empty string." },
      { status: 400 },
    );
  }

  try {
    const client = await getTemporalClient();
    // Cancellation (not termination) so the workflow exits cleanly via its
    // sleep → CancelledFailure path, before the activity runs.
    await client.workflow.getHandle(workflowId).cancel();
    return NextResponse.json({ cancelled: true }, { status: 200 });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error ? cause.message : "Failed to cancel email.",
      },
      { status: 500 },
    );
  }
}
