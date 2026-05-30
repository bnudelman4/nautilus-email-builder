/**
 * Temporal worker — the long-running process that executes scheduleEmailWorkflow
 * and the sendEmail activity off the "email-task-queue".
 *
 * Local setup:
 *   1. Start a local Temporal dev server (Temporal CLI):
 *        temporal server start-dev
 *      (installs via `brew install temporal` or see https://docs.temporal.io/cli)
 *      This serves the gRPC frontend on localhost:7233 and the Web UI on :8233.
 *   2. Ensure .env.local has RESEND_API_KEY and RESEND_FROM_EMAIL (the activity
 *      sends through Resend) and optionally TEMPORAL_ADDRESS.
 *   3. Run the worker:
 *        npm run worker
 *
 * Production note: scheduling requires THIS worker to run as a persistent,
 * always-on process (a VM, container, or a Temporal Cloud worker) alongside a
 * reachable Temporal server. The Vercel demo is serverless and cannot host a
 * long-running worker, so the deployed demo does not execute scheduled sends —
 * the scheduling code is fully implemented regardless (per the assessment brief).
 */
import { fileURLToPath } from "node:url";

import { NativeConnection, Worker } from "@temporalio/worker";

import * as activities from "./activities";
import { NAMESPACE, TASK_QUEUE } from "./client";

async function run(): Promise<void> {
  const connection = await NativeConnection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
  });

  const worker = await Worker.create({
    connection,
    namespace: NAMESPACE,
    taskQueue: TASK_QUEUE,
    workflowsPath: fileURLToPath(new URL("./workflows.ts", import.meta.url)),
    activities,
  });

  console.log(`Worker listening on task queue "${TASK_QUEUE}"…`);
  await worker.run();
}

run().catch((err) => {
  console.error("Worker failed:", err);
  process.exit(1);
});
