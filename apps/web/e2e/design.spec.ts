import { expect, test } from "@playwright/test";
import { screens } from "./screens.ts";

// The measurable rules of docs/design.md, checked on every screen at phone and desktop size.
const MIN_TAP = 48; // px
const MIN_TEXT = 16; // px

for (const { path } of screens) {
  test(`${path} follows the design rules`, async ({ page }) => {
    await page.goto("/tasks");
    // Give the task list a row, so its controls are measured too.
    await page.getByLabel("New task").fill("Measure me");
    await page.getByRole("button", { name: "Add" }).click();
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const problems = await page.evaluate(
      ({ minTap, minText }) => {
        const found: string[] = [];
        const describe = (el: Element) =>
          `<${el.tagName.toLowerCase()}> "${(el.textContent ?? "").trim().slice(0, 30)}"`;

        // Tap targets: buttons, links and fields. A checkbox or radio counts its whole label.
        for (const el of document.querySelectorAll("button, a[href], input, select, textarea")) {
          const input = el as HTMLInputElement;
          const wrapsLabel = input.type === "checkbox" || input.type === "radio";
          const target = (wrapsLabel && input.labels?.[0]) || el;
          const box = target.getBoundingClientRect();
          if (box.width === 0) continue; // not shown
          if (box.width < minTap || box.height < minTap) {
            found.push(
              `tap target ${Math.round(box.width)}x${Math.round(box.height)}: ${describe(el)}`,
            );
          }
        }

        // Text size: every element that directly holds text.
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const parent = node.parentElement;
          if (!parent || !node.textContent?.trim()) continue;
          const size = parseFloat(getComputedStyle(parent).fontSize);
          if (size < minText) found.push(`text ${size}px: ${describe(parent)}`);
        }
        return found;
      },
      { minTap: MIN_TAP, minText: MIN_TEXT },
    );

    expect(problems).toEqual([]);
    // Nothing wider than the screen.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect(overflow).toBe(false);
  });
}
