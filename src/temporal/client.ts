import { Client, Connection } from "@temporalio/client";

export const TASK_QUEUE = "email-task-queue";
export const NAMESPACE = "default";

/**
 * Build a Temporal Client for the API routes. Uses TEMPORAL_ADDRESS (defaults
 * to localhost:7233). Each route call opens a fresh connection; for this scope
 * that is simpler than a cached singleton and avoids stale-connection edge
 * cases in serverless.
 */
export async function getTemporalClient(): Promise<Client> {
  const connection = await Connection.connect({
    address: process.env.TEMPORAL_ADDRESS ?? "localhost:7233",
  });
  return new Client({ connection, namespace: NAMESPACE });
}
