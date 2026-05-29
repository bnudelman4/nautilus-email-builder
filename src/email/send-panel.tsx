"use client";

import { useEffect, useState } from "react";

import type { EmailData, SendRequest, SendResponse } from "./render-email";

type SendStatus =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; id: string }
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

export function SendPanel({ data }: SendPanelProps) {
  // Recipient and subject persist across attempts; only `status` resets.
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState<SendStatus>({ kind: "idle" });

  // Auto-reset back to idle 4s after a successful send.
  useEffect(() => {
    if (status.kind !== "sent") return;
    const timer = setTimeout(() => setStatus({ kind: "idle" }), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  const canSend =
    status.kind !== "sending" && to.trim() !== "" && subject.trim() !== "";

  async function handleSend() {
    setStatus({ kind: "sending" });
    const payload: SendRequest = { to, subject, data };
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result: SendResponse = await response.json();
      if (response.ok && "id" in result) {
        setStatus({ kind: "sent", id: result.id });
      } else {
        setStatus({
          kind: "error",
          message: "error" in result ? result.error : "Failed to send email.",
        });
      }
    } catch (cause) {
      setStatus({
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
      <button
        type="button"
        onClick={handleSend}
        disabled={!canSend}
        style={{
          padding: "8px 14px",
          border: "none",
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 600,
          color: "#ffffff",
          backgroundColor: canSend ? "#2563eb" : "#9ca3af",
          cursor: canSend ? "pointer" : "not-allowed",
        }}
      >
        {status.kind === "sending" ? "Sending…" : "Send email"}
      </button>

      {status.kind === "sent" && (
        <p style={{ margin: 0, color: "#15803d", fontSize: 13 }}>
          Sent ✓ (id: {status.id})
        </p>
      )}
      {status.kind === "error" && (
        <p style={{ margin: 0, color: "#b91c1c", fontSize: 13 }}>
          {status.message}
        </p>
      )}
    </div>
  );
}
