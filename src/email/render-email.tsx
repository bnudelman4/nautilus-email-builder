import type { Data, PuckContext, SlotComponent } from "@puckeditor/core";
import { render } from "@react-email/components";
import { Fragment, type JSX, type ReactNode } from "react";

import { emailConfig, type EmailBlocks } from "./blocks";

export type EmailData = Data<EmailBlocks>;
type BlockContent = EmailData["content"];
type BlockProps = BlockContent[number]["props"];
type BlockName = keyof EmailBlocks;

// Shared request/response contract for POST /api/send. Imported by both the
// route handler (server) and the send panel (client), so the wire shape has a
// single definition.
export type SendRequest = { to: string; subject: string; data: EmailData };
export type SendSuccess = { id: string };
export type SendFailure = { error: string };
export type SendResponse = SendSuccess | SendFailure;

// None of the six block render() functions read `puck` or `id`, but
// PuckComponent's signature requires them. Supplying inert values lets us call
// the SAME render functions directly, without mounting Puck's <Render> (which
// would make two renderers contend over Puck's context provider).
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
 * each block's own render() from emailConfig — the single source of truth. No
 * component is redefined here; we invoke the exact definitions Puck uses. This
 * is the one render path shared by the live preview and the Resend send flow.
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
    id: `email-${type}`,
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

/** Build the React Email element tree for a Puck Data tree. */
export function buildEmailTree(data: EmailData): ReactNode {
  return <>{walk(data.content)}</>;
}

/** Render a Puck Data tree to inbox-safe, inline-styled HTML via React Email. */
export function renderEmailHtml(data: EmailData): Promise<string> {
  return render(<>{buildEmailTree(data)}</>);
}
