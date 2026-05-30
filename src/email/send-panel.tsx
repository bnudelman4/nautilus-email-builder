"use client";

import { useCallback, useEffect, useState } from "react";

import type {
  CancelResponse,
  EmailData,
  ListResponse,
  ScheduledEmail,
  ScheduleRequest,
  ScheduleResponse,
  SendRequest,
  SendResponse,
} from "./render-email";

type SendStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; id: string }
  | { kind: "error"; message: string };

type ScheduleStatus =
  | { kind: "idle" }
  | { kind: "scheduling" }
  | { kind: "scheduled"; workflowId: string }
  | { kind: "error"; message: string };

type CancelStatus =
  | { kind: "idle" }
  | { kind: "cancelling"; workflowId: string }
  | { kind: "cancelled"; workflowId: string }
  | { kind: "error"; message: string };

type SendPanelProps = {
  data: EmailData;
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: 14,
  boxSizing: "border-box",
};

function buttonStyle(enabled: boolean, color: string): React.CSSProperties {
  return {
    padding: "8px 14px",
    border: "none",
    borderRadius: 6,
    fontSize: 14,
    fontWeight: 600,
    color: "#ffffff",
    backgroundColor: enabled ? color : "#9ca3af",
    cursor: enabled ? "pointer" : "not-allowed",
  };
}

export function SendPanel({ data }: SendPanelProps) {
  // Recipient and subject persist across attempts; only statuses reset.
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [sendAt, setSendAt] = useState("");

  const [sendStatus, setSendStatus] = useState<SendStatus>({ kind: "idle" });
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus>({
    kind: "idle",
  });
  const [cancelStatus, setCancelStatus] = useState<CancelStatus>({
    kind: "idle",
  });
  const [scheduled, setScheduled] = useState<ScheduledEmail[]>([]);
  // Current time as state so the render stays pure (no Date.now() in render);
  // seeded once via the lazy initializer and refreshed periodically to keep the
  // future-datetime check live.
  const [nowMs, setNowMs] = useState(() => Date.now());

  const refreshList = useCallback(async () => {
    try {
      const response = await fetch("/api/schedule/list");
      const result: ListResponse = await response.json();
      if (response.ok && "scheduled" in result) {
        setScheduled(result.scheduled);
      }
    } catch {
      // List refresh is best-effort; per-action errors are surfaced elsewhere.
    }
  }, []);

  // Fetch the list on mount. setState lives inside the promise callback (not
  // the effect body) to keep the effect free of direct synchronous setState.
  useEffect(() => {
    fetch("/api/schedule/list")
      .then((response) => response.json() as Promise<ListResponse>)
      .then((result) => {
        if ("scheduled" in result) setScheduled(result.scheduled);
      })
      .catch(() => {
        // Best-effort; per-action errors surface via their own status.
      });
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Auto-reset back to idle 4s after a successful send.
  useEffect(() => {
    if (sendStatus.kind !== "sent") return;
    const timer = setTimeout(() => setSendStatus({ kind: "idle" }), 4000);
    return () => clearTimeout(timer);
  }, [sendStatus]);

  useEffect(() => {
    if (scheduleStatus.kind !== "scheduled") return;
    const timer = setTimeout(() => setScheduleStatus({ kind: "idle" }), 4000);
    return () => clearTimeout(timer);
  }, [scheduleStatus]);

  const hasRecipientAndSubject = to.trim() !== "" && subject.trim() !== "";
  const sendAtMs = sendAt === "" ? Number.NaN : new Date(sendAt).getTime();
  const isFutureDatetime = !Number.isNaN(sendAtMs) && sendAtMs > nowMs;

  const canSend = sendStatus.kind !== "sending" && hasRecipientAndSubject;
  const canSchedule =
    scheduleStatus.kind !== "scheduling" &&
    hasRecipientAndSubject &&
    isFutureDatetime;

  async function handleSend() {
    setSendStatus({ kind: "sending" });
    const payload: SendRequest = { to, subject, data };
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: SendResponse = await response.json();
      if (response.ok && "id" in result) {
        setSendStatus({ kind: "sent", id: result.id });
      } else {
        setSendStatus({
          kind: "error",
          message: "error" in result ? result.error : "Failed to send email.",
        });
      }
    } catch (cause) {
      setSendStatus({
        kind: "error",
        message:
          cause instanceof Error ? cause.message : "Network request failed.",
      });
    }
  }

  async function handleSchedule() {
    setScheduleStatus({ kind: "scheduling" });
    // datetime-local is local wall time; normalize to ISO for the wire.
    const payload: ScheduleRequest = {
      to,
      subject,
      data,
      sendAt: new Date(sendAt).toISOString(),
    };
    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: ScheduleResponse = await response.json();
      if (response.ok && "workflowId" in result) {
        setScheduleStatus({ kind: "scheduled", workflowId: result.workflowId });
        await refreshList();
      } else {
        setScheduleStatus({
          kind: "error",
          message:
            "error" in result ? result.error : "Failed to schedule email.",
        });
      }
    } catch (cause) {
      setScheduleStatus({
        kind: "error",
        message:
          cause instanceof Error ? cause.message : "Network request failed.",
      });
    }
  }

  async function handleCancel(workflowId: string) {
    setCancelStatus({ kind: "cancelling", workflowId });
    try {
      const response = await fetch("/api/schedule/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId }),
      });
      const result: CancelResponse = await response.json();
      if (response.ok && "cancelled" in result) {
        setCancelStatus({ kind: "cancelled", workflowId });
        await refreshList();
      } else {
        setCancelStatus({
          kind: "error",
          message:
            "error" in result ? result.error : "Failed to cancel email.",
        });
      }
    } catch (cause) {
      setCancelStatus({
        kind: "error",
        message:
          cause instanceof Error ? cause.message : "Network request failed.",
      });
    }
  }

  return (
    <div
      style={{
        padding: 16,
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <input
        type="email"
        placeholder="Recipient email"
        value={to}
        onChange={(event) => setTo(event.target.value)}
        style={inputStyle}
      />
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        style={inputStyle}
      />
      <input
        type="datetime-local"
        value={sendAt}
        onChange={(event) => setSendAt(event.target.value)}
        style={inputStyle}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          style={buttonStyle(canSend, "#2563eb")}
        >
          {sendStatus.kind === "sending" ? "Sending…" : "Send now"}
        </button>
        <button
          type="button"
          onClick={handleSchedule}
          disabled={!canSchedule}
          style={buttonStyle(canSchedule, "#7c3aed")}
        >
          {scheduleStatus.kind === "scheduling" ? "Scheduling…" : "Schedule"}
        </button>
      </div>

      {sendStatus.kind === "sent" && (
        <p style={{ margin: 0, color: "#15803d", fontSize: 13 }}>
          Sent ✓ (id: {sendStatus.id})
        </p>
      )}
      {sendStatus.kind === "error" && (
        <p style={{ margin: 0, color: "#b91c1c", fontSize: 13 }}>
          {sendStatus.message}
        </p>
      )}
      {scheduleStatus.kind === "scheduled" && (
        <p style={{ margin: 0, color: "#15803d", fontSize: 13 }}>
          Scheduled ✓
        </p>
      )}
      {scheduleStatus.kind === "error" && (
        <p style={{ margin: 0, color: "#b91c1c", fontSize: 13 }}>
          {scheduleStatus.message}
        </p>
      )}

      <div style={{ marginTop: 8 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 13, color: "#374151" }}>
          Scheduled emails
        </h3>
        {scheduled.length === 0 ? (
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>
            None scheduled.
          </p>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {scheduled.map((email) => {
              const cancelling =
                cancelStatus.kind === "cancelling" &&
                cancelStatus.workflowId === email.workflowId;
              return (
                <li
                  key={email.workflowId}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    padding: "6px 0",
                    borderTop: "1px solid #f3f4f6",
                    fontSize: 13,
                  }}
                >
                  <span style={{ minWidth: 0 }}>
                    <strong>{email.subject || "(no subject)"}</strong>
                    {" → "}
                    {email.to}
                    <br />
                    <span style={{ color: "#6b7280" }}>
                      {email.sendAt
                        ? new Date(email.sendAt).toLocaleString()
                        : "unknown time"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCancel(email.workflowId)}
                    disabled={cancelling}
                    style={buttonStyle(!cancelling, "#b91c1c")}
                  >
                    {cancelling ? "Cancelling…" : "Cancel"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {cancelStatus.kind === "error" && (
          <p style={{ margin: "6px 0 0", color: "#b91c1c", fontSize: 13 }}>
            {cancelStatus.message}
          </p>
        )}
      </div>
    </div>
  );
}
