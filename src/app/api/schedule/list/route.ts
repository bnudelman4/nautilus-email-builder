import { NextResponse } from "next/server";

import type { ListResponse, ScheduledEmail } from "@/email/render-email";
import { getTemporalClient } from "@/temporal/client";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function GET(): Promise<NextResponse<ListResponse>> {
  try {
    const client = await getTemporalClient();
    const scheduled: ScheduledEmail[] = [];

    // Visibility query: only workflows still waiting to send.
    for await (const wf of client.workflow.list({
      query: 'ExecutionStatus="Running"',
    })) {
      const memo = wf.memo ?? {};
      scheduled.push({
        workflowId: wf.workflowId,
        to: asString(memo.to),
        subject: asString(memo.subject),
        sendAt: asString(memo.sendAt),
      });
    }

    return NextResponse.json({ scheduled }, { status: 200 });
  } catch (cause) {
    return NextResponse.json(
      {
        error:
          cause instanceof Error
            ? cause.message
            : "Failed to list scheduled emails.",
      },
      { status: 500 },
    );
  }
}
