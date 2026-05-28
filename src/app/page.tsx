"use client";

import "@puckeditor/core/puck.css";

import { Puck, type Data } from "@puckeditor/core";
import { useState } from "react";

import { emailConfig, type EmailBlocks } from "@/email/blocks";

const initialData: Data<EmailBlocks> = {
  content: [],
  root: { props: {} },
};

export default function Home() {
  const [data, setData] = useState<Data<EmailBlocks>>(initialData);

  return (
    <Puck<typeof emailConfig>
      config={emailConfig}
      data={data}
      onChange={setData}
      onPublish={setData}
    />
  );
}
