import type { Config } from "@puckeditor/core";
import { Text } from "@react-email/components";

/**
 * Puck <-> React Email bridge.
 *
 * Each entry in this Config is the SINGLE definition used for both:
 *  1. Editing in Puck (fields drive the sidebar, defaultProps seed the block).
 *  2. Final email rendering (the same props object is passed straight to the
 *     React Email component inside `render`).
 *
 * There is no parallel "editor view" vs "email view" component. The block
 * the user manipulates on canvas is the same React Email component that will
 * be handed to React Email's render() to produce inbox-safe HTML.
 */

export type TextBlockProps = {
  content: string;
  color: string;
  fontSize: number;
};

export type EmailBlocks = {
  Text: TextBlockProps;
};

export const emailConfig: Config<EmailBlocks> = {
  components: {
    Text: {
      label: "Text",
      fields: {
        content: { type: "textarea", label: "Content" },
        color: { type: "text", label: "Color" },
        fontSize: { type: "number", label: "Font size (px)", min: 8, max: 96 },
      },
      defaultProps: {
        content: "Edit this text in the sidebar.",
        color: "#111827",
        fontSize: 16,
      },
      // Bridge point: field values flow in as `props` and are forwarded
      // verbatim to the React Email <Text> component. No translation layer.
      render: ({ content, color, fontSize }) => (
        <Text style={{ color, fontSize: `${fontSize}px`, margin: 0 }}>
          {content}
        </Text>
      ),
    },
  },
};
