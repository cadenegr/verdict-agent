// Design preset rules (docs/design.md), checked in every class string of the web app.
// Colors and sizes come from the tokens in apps/web/src/styles/index.css, so
// raw Tailwind palette colors, hex colors, `dark:` and text smaller than text-base are refused.

const palette =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|" +
  "indigo|violet|purple|fuchsia|pink|rose|black|white";

const forbidden = [
  {
    pattern: new RegExp(`(^|[\\s:])[a-z-]+-(${palette})(-\\d{2,3})?(\\/\\d+)?(?=$|[\\s"'\`])`),
    message:
      "Use a color token (canvas, surface, raised, ink, ink-muted, line, brand, danger, ...).",
  },
  {
    pattern: /(^|[\s:])[a-z-]+-\[(#|rgb|hsl|oklch)/,
    message: "No hard-coded colors. Add a token to styles/index.css if one is missing.",
  },
  {
    pattern: /(^|\s)dark:/,
    message: "No `dark:` classes: every color token already has a dark value.",
  },
  {
    pattern: /(^|[\s:])text-(xs|sm)(?=$|\s)/,
    message: "text-base is the smallest text size.",
  },
];

function check(context, node, text) {
  for (const { pattern, message } of forbidden) {
    if (pattern.test(text)) context.report({ node, message });
  }
}

const tokensOnly = {
  meta: { type: "problem", schema: [] },
  create(context) {
    return {
      Literal(node) {
        if (typeof node.value === "string") check(context, node, node.value);
      },
      TemplateElement(node) {
        check(context, node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

export default { rules: { "tokens-only": tokensOnly } };
