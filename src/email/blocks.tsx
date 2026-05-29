import type { Config, Slot } from "@puckeditor/core";
import {
  Button,
  Container,
  Heading,
  Img,
  Section,
  Text,
} from "@react-email/components";

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
 *
 * Color fields are intentionally `type: "text"` for now. A swatch/color-picker
 * field is a deliberate planned improvement, not an oversight — it would be a
 * Puck custom field and is out of scope for the current tier.
 */

export type TextBlockProps = {
  content: string;
  color: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  lineHeight: number;
};

export type HeadingBlockProps = {
  content: string;
  level: "h1" | "h2" | "h3";
  color: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  lineHeight: number;
  textAlign: "left" | "center" | "right";
};

export type ButtonBlockProps = {
  label: string;
  href: string;
  backgroundColor: string;
  color: string;
  padding: number;
  borderRadius: number;
};

export type ImageBlockProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  borderRadius: number;
};

// `children: Slot` is Puck's native nested drop zone. In the field config it is
// `{ type: "slot" }`; at render time WithDeepSlots turns it into a SlotComponent
// (a real React component) so other blocks can be dropped inside and rendered.
// paddingX/paddingY are split because email layouts routinely need asymmetric
// horizontal vs vertical spacing.
export type ContainerBlockProps = {
  paddingX: number;
  paddingY: number;
  backgroundColor: string;
  children: Slot;
};

export type SectionBlockProps = {
  paddingX: number;
  paddingY: number;
  backgroundColor: string;
  textAlign: "left" | "center" | "right";
  children: Slot;
};

export type EmailBlocks = {
  Text: TextBlockProps;
  Heading: HeadingBlockProps;
  Button: ButtonBlockProps;
  Image: ImageBlockProps;
  Container: ContainerBlockProps;
  Section: SectionBlockProps;
};

// Shared select option sets, kept here so equivalent fields stay identical
// across blocks (single source of truth for the field UI, too).
const FONT_WEIGHT_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "Bold", value: "bold" },
];

const TEXT_ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

export const emailConfig: Config<EmailBlocks> = {
  components: {
    Text: {
      label: "Text",
      fields: {
        content: { type: "textarea", label: "Content" },
        color: { type: "text", label: "Color" },
        fontSize: { type: "number", label: "Font size (px)", min: 8, max: 96 },
        fontWeight: {
          type: "select",
          label: "Font weight",
          options: FONT_WEIGHT_OPTIONS,
        },
        lineHeight: {
          type: "number",
          label: "Line height",
          min: 1,
          max: 3,
          step: 0.1,
        },
      },
      defaultProps: {
        content: "Edit this text in the sidebar.",
        color: "#111827",
        fontSize: 16,
        fontWeight: "normal",
        lineHeight: 1.5,
      },
      // Bridge point: field values flow in as `props` and are forwarded
      // verbatim to the React Email <Text> component. No translation layer.
      render: ({ content, color, fontSize, fontWeight, lineHeight }) => (
        <Text style={{ color, fontSize: `${fontSize}px`, fontWeight, lineHeight, margin: 0 }}>
          {content}
        </Text>
      ),
    },

    Heading: {
      label: "Heading",
      fields: {
        content: { type: "textarea", label: "Content" },
        level: {
          type: "select",
          label: "Level",
          options: [
            { label: "H1", value: "h1" },
            { label: "H2", value: "h2" },
            { label: "H3", value: "h3" },
          ],
        },
        color: { type: "text", label: "Color" },
        fontSize: { type: "number", label: "Font size (px)", min: 8, max: 96 },
        fontWeight: {
          type: "select",
          label: "Font weight",
          options: FONT_WEIGHT_OPTIONS,
        },
        lineHeight: {
          type: "number",
          label: "Line height",
          min: 1,
          max: 3,
          step: 0.1,
        },
        textAlign: {
          type: "select",
          label: "Text align",
          options: TEXT_ALIGN_OPTIONS,
        },
      },
      defaultProps: {
        content: "Your headline here",
        level: "h1",
        color: "#111827",
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 1.2,
        textAlign: "left",
      },
      // `level` selects the React Email <Heading as=...> tag; the remaining
      // fields are forwarded straight through as inline style.
      render: ({ content, level, color, fontSize, fontWeight, lineHeight, textAlign }) => (
        <Heading
          as={level}
          style={{ color, fontSize: `${fontSize}px`, fontWeight, lineHeight, textAlign, margin: 0 }}
        >
          {content}
        </Heading>
      ),
    },

    Button: {
      label: "Button",
      fields: {
        label: { type: "text", label: "Label" },
        href: { type: "text", label: "Link URL" },
        backgroundColor: { type: "text", label: "Background color" },
        color: { type: "text", label: "Text color" },
        padding: { type: "number", label: "Padding (px)", min: 0, max: 64 },
        borderRadius: {
          type: "number",
          label: "Border radius (px)",
          min: 0,
          max: 64,
        },
      },
      defaultProps: {
        label: "Click me",
        href: "https://example.com",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        padding: 12,
        borderRadius: 6,
      },
      render: ({ label, href, backgroundColor, color, padding, borderRadius }) => (
        <Button
          href={href}
          style={{
            backgroundColor,
            color,
            padding: `${padding}px`,
            borderRadius: `${borderRadius}px`,
          }}
        >
          {label}
        </Button>
      ),
    },

    Image: {
      label: "Image",
      fields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt text" },
        width: { type: "number", label: "Width (px)", min: 1, max: 1200 },
        height: { type: "number", label: "Height (px)", min: 1, max: 1200 },
        borderRadius: {
          type: "number",
          label: "Border radius (px)",
          min: 0,
          max: 64,
        },
      },
      defaultProps: {
        src: "https://react.email/static/logo-without-background.png",
        alt: "Placeholder image",
        width: 200,
        height: 200,
        borderRadius: 0,
      },
      render: ({ src, alt, width, height, borderRadius }) => (
        <Img
          src={src}
          alt={alt}
          width={width}
          height={height}
          style={{ borderRadius: `${borderRadius}px` }}
        />
      ),
    },

    Container: {
      label: "Container",
      fields: {
        paddingX: {
          type: "number",
          label: "Padding X (px)",
          min: 0,
          max: 96,
        },
        paddingY: {
          type: "number",
          label: "Padding Y (px)",
          min: 0,
          max: 96,
        },
        backgroundColor: { type: "text", label: "Background color" },
        // Native Puck nested drop zone — no hand-rolled nesting.
        children: { type: "slot", label: "Content" },
      },
      defaultProps: {
        paddingX: 24,
        paddingY: 24,
        backgroundColor: "#f9fafb",
        children: [],
      },
      // `children` arrives as a SlotComponent; rendering <Children /> mounts the
      // dropped blocks inside the React Email <Container>.
      render: ({ paddingX, paddingY, backgroundColor, children: Children }) => (
        <Container style={{ padding: `${paddingY}px ${paddingX}px`, backgroundColor }}>
          <Children />
        </Container>
      ),
    },

    Section: {
      label: "Section",
      fields: {
        paddingX: {
          type: "number",
          label: "Padding X (px)",
          min: 0,
          max: 96,
        },
        paddingY: {
          type: "number",
          label: "Padding Y (px)",
          min: 0,
          max: 96,
        },
        backgroundColor: { type: "text", label: "Background color" },
        textAlign: {
          type: "select",
          label: "Text align",
          options: TEXT_ALIGN_OPTIONS,
        },
        // Native Puck nested drop zone — no hand-rolled nesting.
        children: { type: "slot", label: "Content" },
      },
      defaultProps: {
        paddingX: 24,
        paddingY: 24,
        backgroundColor: "#ffffff",
        textAlign: "left",
        children: [],
      },
      render: ({ paddingX, paddingY, backgroundColor, textAlign, children: Children }) => (
        <Section style={{ padding: `${paddingY}px ${paddingX}px`, backgroundColor, textAlign }}>
          <Children />
        </Section>
      ),
    },
  },
};
