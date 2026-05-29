"use client";

import "@puckeditor/core/puck.css";

import { Puck, type Data } from "@puckeditor/core";
import { useState } from "react";

import { emailConfig, type EmailBlocks } from "@/email/blocks";
import { EmailPreview } from "@/email/preview";

const initialData: Data<EmailBlocks> = {
  content: [],
  root: { props: {} },
};

export default function Home() {
  // Single source of editor state. Puck's onChange feeds the same `data` into
  // both the editor and the live preview — no separate store, no duplication.
  const [data, setData] = useState<Data<EmailBlocks>>(initialData);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100vh" }}>
      <div style={{ overflow: "auto", borderRight: "1px solid #e5e7eb" }}>
        <Puck<typeof emailConfig>
          config={emailConfig}
          data={data}
          onChange={setData}
          onPublish={setData}
        />
      </div>
      <div style={{ overflow: "hidden", backgroundColor: "#f3f4f6" }}>
        <EmailPreview data={data} />
      </div>
    </div>
  );
}
