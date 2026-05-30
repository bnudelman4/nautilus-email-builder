"use client";

import { useEffect, useState } from "react";

import { renderEmailHtml, type EmailData } from "./render-email";

type EmailPreviewProps = {
  data: EmailData;
};

// Viewport simulation only — these widths constrain the iframe wrapper, never
// the rendered HTML. 600px is the email content-width standard React Email's
// <Container> targets; 375px is a representative phone width.
type PreviewMode = "desktop" | "mobile";
const PREVIEW_WIDTHS: Record<PreviewMode, number> = {
  desktop: 600,
  mobile: 375,
};

/**
 * Live inbox preview.
 *
 * Bridge continuity: rendering goes through renderEmailHtml — the single shared
 * path that walks the Puck Data tree using emailConfig and produces HTML via
 * @react-email/render. The same function backs the Resend send flow, so preview
 * and sent email are byte-for-byte the same render. The HTML is shown in an
 * <iframe srcDoc> so the email's styles are isolated, the way an inbox renders.
 */
export function EmailPreview({ data }: EmailPreviewProps) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<PreviewMode>("desktop");

  useEffect(() => {
    let cancelled = false;

    renderEmailHtml(data)
      .then((output) => {
        if (cancelled) return;
        setHtml(output);
        setError(null);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setError(
          cause instanceof Error ? cause.message : "Failed to render preview.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, [data]);

  const width = PREVIEW_WIDTHS[mode];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderBottom: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
        }}
      >
        <ModeButton
          label="Desktop"
          active={mode === "desktop"}
          onClick={() => setMode("desktop")}
        />
        <ModeButton
          label="Mobile"
          active={mode === "mobile"}
          onClick={() => setMode("mobile")}
        />
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          {mode === "desktop" ? "Desktop" : "Mobile"} · {width}px
        </span>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        {error ? (
          <div style={{ color: "#b91c1c" }}>Preview error: {error}</div>
        ) : (
          // Centered, width-constrained wrapper — this is what simulates the
          // viewport. The iframe's srcDoc HTML is identical in both modes.
          <div
            style={{
              maxWidth: width,
              width: "100%",
              margin: "0 auto",
              height: "100%",
            }}
          >
            <iframe
              title="Email preview"
              srcDoc={html}
              style={{
                width: "100%",
                height: "100%",
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

type ModeButtonProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function ModeButton({ label, active, onClick }: ModeButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "5px 12px",
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 6,
        border: active ? "1px solid #2563eb" : "1px solid #d1d5db",
        backgroundColor: active ? "#2563eb" : "#ffffff",
        color: active ? "#ffffff" : "#374151",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
