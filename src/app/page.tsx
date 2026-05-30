"use client";

import "@puckeditor/core/puck.css";

import { Puck, type Data } from "@puckeditor/core";
import { useState } from "react";

import { emailConfig, type EmailBlocks } from "@/email/blocks";
import { EmailPreview } from "@/email/preview";
import { SendPanel } from "@/email/send-panel";
import { TEMPLATES } from "@/email/templates";

const initialData: Data<EmailBlocks> = {
  content: [],
  root: { props: {} },
};

const templateButtonStyle: React.CSSProperties = {
  padding: "5px 12px",
  fontSize: 13,
  fontWeight: 600,
  borderRadius: 6,
  border: "1px solid #d1d5db",
  backgroundColor: "#ffffff",
  color: "#374151",
  cursor: "pointer",
};

export default function Home() {
  // Single source of editor state. Puck's onChange feeds the same `data` into
  // both the editor and the live preview — no separate store, no duplication.
  const [data, setData] = useState<Data<EmailBlocks>>(initialData);
  // Puck reads `data` only on mount. Bumping this counter (used as Puck's key)
  // forces a remount so a loaded template reinitializes the canvas. Only
  // loadData touches it — onChange edits must NOT remount.
  const [puckKey, setPuckKey] = useState(0);

  // Templates load by replacing the same Puck data state — no new state path.
  function loadData(next: Data<EmailBlocks>) {
    if (
      data.content.length > 0 &&
      !window.confirm("Replace the current canvas? Unsaved changes will be lost.")
    ) {
      return;
    }
    setData(next);
    setPuckKey((key) => key + 1);
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRight: "1px solid #e5e7eb",
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
            fontFamily: "sans-serif",
          }}
        >
          <span style={{ fontSize: 12, color: "#6b7280", marginRight: 4 }}>
            Templates:
          </span>
          {TEMPLATES.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => loadData(template.data)}
              style={templateButtonStyle}
            >
              {template.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => loadData(initialData)}
            style={{ ...templateButtonStyle, color: "#6b7280" }}
          >
            Blank
          </button>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          <Puck<typeof emailConfig>
            key={puckKey}
            config={emailConfig}
            data={data}
            onChange={setData}
            onPublish={setData}
          />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "#f3f4f6",
        }}
      >
        <SendPanel data={data} />
        <div style={{ flex: 1, overflow: "hidden" }}>
          <EmailPreview data={data} />
        </div>
      </div>
    </div>
  );
}
