import type { EmailData } from "./render-email";

/**
 * Static starter templates. Each is a plain EmailData value — the exact shape
 * page.tsx holds in state — built only from the block types defined in
 * emailConfig (Heading, Text, Button, Image, Container). Loading a template is
 * just replacing the Puck data state; there is no separate representation.
 */
export type Template = { name: string; data: EmailData };

const welcome: EmailData = {
  root: { props: {} },
  content: [
    {
      type: "Heading",
      props: {
        id: "welcome-heading",
        content: "Welcome aboard",
        level: "h1",
        color: "#111827",
        fontSize: 32,
        fontWeight: "bold",
        lineHeight: 1.2,
        textAlign: "left",
      },
    },
    {
      type: "Text",
      props: {
        id: "welcome-text",
        content:
          "We're thrilled to have you. Your account is ready, take a quick look around and set things up the way you like.",
        color: "#374151",
        fontSize: 16,
        fontWeight: "normal",
        lineHeight: 1.6,
      },
    },
    {
      type: "Button",
      props: {
        id: "welcome-button",
        label: "Get started",
        href: "https://example.com/get-started",
        backgroundColor: "#2563eb",
        color: "#ffffff",
        padding: 14,
        borderRadius: 8,
      },
    },
  ],
};

const newsletter: EmailData = {
  root: { props: {} },
  content: [
    {
      type: "Heading",
      props: {
        id: "news-title",
        content: "The Monthly Dispatch",
        level: "h1",
        color: "#111827",
        fontSize: 30,
        fontWeight: "bold",
        lineHeight: 1.2,
        textAlign: "center",
      },
    },
    {
      type: "Container",
      props: {
        id: "news-section-1",
        paddingX: 24,
        paddingY: 20,
        backgroundColor: "#f9fafb",
        children: [
          {
            type: "Heading",
            props: {
              id: "news-section-1-heading",
              content: "Top story",
              level: "h2",
              color: "#111827",
              fontSize: 22,
              fontWeight: "bold",
              lineHeight: 1.3,
              textAlign: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "news-section-1-text",
              content:
                "This month we shipped a faster editor, three new templates, and a preview that mirrors exactly what lands in the inbox.",
              color: "#374151",
              fontSize: 15,
              fontWeight: "normal",
              lineHeight: 1.6,
            },
          },
        ],
      },
    },
    {
      type: "Container",
      props: {
        id: "news-section-2",
        paddingX: 24,
        paddingY: 20,
        backgroundColor: "#ffffff",
        children: [
          {
            type: "Heading",
            props: {
              id: "news-section-2-heading",
              content: "Quick links",
              level: "h2",
              color: "#111827",
              fontSize: 22,
              fontWeight: "bold",
              lineHeight: 1.3,
              textAlign: "left",
            },
          },
          {
            type: "Text",
            props: {
              id: "news-section-2-text",
              content:
                "Read the changelog, browse the docs, or reply to this email with what you'd like to see next.",
              color: "#374151",
              fontSize: 15,
              fontWeight: "normal",
              lineHeight: 1.6,
            },
          },
        ],
      },
    },
    {
      type: "Button",
      props: {
        id: "news-button",
        label: "Read the full issue",
        href: "https://example.com/newsletter",
        backgroundColor: "#111827",
        color: "#ffffff",
        padding: 12,
        borderRadius: 6,
      },
    },
  ],
};

const promo: EmailData = {
  root: { props: {} },
  content: [
    {
      type: "Heading",
      props: {
        id: "promo-heading",
        content: "50% OFF — Today only",
        level: "h1",
        color: "#dc2626",
        fontSize: 44,
        fontWeight: "bold",
        lineHeight: 1.1,
        textAlign: "center",
      },
    },
    {
      type: "Image",
      props: {
        id: "promo-image",
        src: "https://react.email/static/logo-without-background.png",
        alt: "Featured product",
        width: 320,
        height: 320,
        borderRadius: 12,
      },
    },
    {
      type: "Text",
      props: {
        id: "promo-text",
        content:
          "Our biggest sale of the season ends at midnight. Use code SAVE50 at checkout - no minimum, everything included.",
        color: "#1f2937",
        fontSize: 18,
        fontWeight: "bold",
        lineHeight: 1.5,
      },
    },
    {
      type: "Button",
      props: {
        id: "promo-button",
        label: "Shop the sale →",
        href: "https://example.com/sale",
        backgroundColor: "#dc2626",
        color: "#ffffff",
        padding: 16,
        borderRadius: 10,
      },
    },
  ],
};

export const TEMPLATES: readonly Template[] = [
  { name: "Welcome", data: welcome },
  { name: "Newsletter", data: newsletter },
  { name: "Promo", data: promo },
];
