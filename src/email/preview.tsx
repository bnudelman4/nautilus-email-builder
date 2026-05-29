"use client";

import { useEffect, useState } from "react";

import { renderEmailHtml, type EmailData } from "./render-email";

type EmailPreviewProps = {
  data: EmailData;
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

  if (error) {
    return (
      <div style={{ padding: 16, color: "#b91c1c", fontFamily: "sans-serif" }}>
        Preview error: {error}
      </div>
    );
  }

  return (
    <iframe
      title="Email preview"
      srcDoc={html}
      style={{ width: "100%", height: "100%", border: "none" }}
    />
  );
}
