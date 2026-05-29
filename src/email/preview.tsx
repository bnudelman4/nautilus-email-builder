"use client";

import type { Data, PuckContext, SlotComponent } from "@puckeditor/core";
import { render } from "@react-email/components";
import { Fragment, useEffect, useState, type JSX, type ReactNode } from "react";

import { emailConfig, type EmailBlocks } from "./blocks";

type EmailData = Data<EmailBlocks>;
type BlockContent = EmailData["content"];
type BlockProps = BlockContent[number]["props"];
type BlockName = keyof EmailBlocks;

type EmailPreviewProps = {
  data: EmailData;
};

// None of the six block render() functions read `puck` or `id`, but
// PuckComponent's signature requires them. Supplying inert values lets us call
// the SAME render functions directly, without mounting Puck's <Render> (which
// is what caused two renderers to contend over Puck's context provider).
const PUCK_CONTEXT: PuckContext = {
  renderDropZone: () => null,
  metadata: {},
  isEditing: false,
  dragRef: null,
};

function isBlockName(type: string): type is BlockName {
  return type in emailConfig.components;
}

/**
 * Walk the Puck Data tree and rebuild the React Email element tree by calling
 * each block's own render() from emailConfig — the single source of truth. We
 * do NOT redefine any component here; we invoke the exact definitions Puck uses.
 */
function walk(content: BlockContent): ReactNode {
  return content.map((entry, index) =>
    isBlockName(entry.type) ? (
      <Fragment key={index}>{renderBlock(entry.type, entry.props)}</Fragment>
    ) : null,
  );
}

function renderBlock(type: BlockName, props: BlockProps): JSX.Element {
  const component = emailConfig.components[type];
  const renderProps: Record<string, unknown> = {
    id: `preview-${type}`,
    puck: PUCK_CONTEXT,
  };

  for (const [key, value] of Object.entries(props)) {
    // Slot data is the only array-valued prop in emailConfig. Puck swaps it for
    // a SlotComponent at render time; we reproduce that so a block's render()
    // can mount nested children via this same walker (recursive bridge).
    renderProps[key] = Array.isArray(value)
      ? makeSlotComponent(value as BlockContent)
      : value;
  }

  // `component.render` is a union of PuckComponent<...> across block types;
  // renderProps was rebuilt to match the active member. TS can't verify a
  // union call, so we invoke through a structural callable — not `any`.
  const renderFn = component.render as unknown as (
    props: Record<string, unknown>,
  ) => JSX.Element;
  return renderFn(renderProps);
}

function makeSlotComponent(slotContent: BlockContent): SlotComponent {
  return function Slot() {
    return <>{walk(slotContent)}</>;
  };
}

/**
 * Live inbox preview.
 *
 * Bridge continuity: the component tree is rebuilt by calling the render()
 * functions defined once in emailConfig (see walk/renderBlock above). That tree
 * is handed to @react-email/render's render() to produce inbox-safe, inline-
 * styled HTML, shown in an <iframe srcDoc> so the email's styles are isolated
 * from the app — the way an inbox renders email.
 */
export function EmailPreview({ data }: EmailPreviewProps) {
  const [html, setHtml] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    render(<>{walk(data.content)}</>)
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
