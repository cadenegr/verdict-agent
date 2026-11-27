// @vitest-environment node
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Checks the color tokens in index.css against the contrast rules in docs/design.md,
// in light and in dark. Change a color there and this test says if it is still readable.

const css = readFileSync(new URL("./index.css", import.meta.url), "utf8");

const tokens = new Map<string, { light: string; dark: string }>();
for (const [, name, light, dark] of css.matchAll(
  /--color-([a-z-]+):\s*light-dark\((#[0-9a-f]{6}),\s*(#[0-9a-f]{6})\)/gi,
)) {
  tokens.set(name!, { light: light!, dark: dark! });
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const TEXT = 7; // WCAG AAA for text
const NON_TEXT = 3; // borders, focus ring, icons

// [foreground, background, minimum]
const pairs: Array<[string, string, number]> = [
  ...["canvas", "surface", "raised"].flatMap((bg): Array<[string, string, number]> => [
    ["ink", bg, TEXT],
    ["ink-muted", bg, TEXT],
    ["brand", bg, TEXT],
    ["line", bg, NON_TEXT],
  ]),
  ["danger", "canvas", TEXT],
  ["danger", "surface", TEXT],
  ["on-brand", "brand", TEXT],
  ["on-brand", "brand-strong", TEXT],
  ["on-danger", "danger", TEXT],
];

describe("color tokens", () => {
  it("are all defined with a light and a dark value", () => {
    const names = new Set(pairs.flatMap(([fg, bg]) => [fg, bg]));
    for (const name of names) expect(tokens.has(name), `--color-${name}`).toBe(true);
  });

  for (const mode of ["light", "dark"] as const) {
    it.each(pairs)(`${mode}: %s on %s reaches %d:1`, (fg, bg, minimum) => {
      const ratio = contrast(tokens.get(fg)![mode], tokens.get(bg)![mode]);
      expect(ratio).toBeGreaterThanOrEqual(minimum);
    });
  }
});
