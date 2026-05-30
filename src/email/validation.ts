import type { EmailData } from "./render-email";

// Basic structural check — a full email parser is out of scope and a regex is
// enough to reject obviously malformed addresses before spending Resend quota.
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmailData(value: unknown): value is EmailData {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.content) &&
    typeof candidate.root === "object" &&
    candidate.root !== null
  );
}
