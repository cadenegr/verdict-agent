import { test } from "@playwright/test";
import type { Settings } from "@app/shared";
import { STORAGE_KEY } from "../src/features/settings/settingsStorage.ts";
import { screens } from "./screens.ts";

// `make screens`: a picture of every screen at the sizes and themes in docs/design.md,
// saved to apps/web/screenshots/<screen>-<width>-<textsize>-<theme>.png.
// It only takes pictures: it never fails on how a screen looks. Not part of `make e2e`.

const sizes = [
  { width: 360, height: 780, textSize: "extra-large", mobile: true },
  { width: 390, height: 844, textSize: "standard", mobile: true },
  { width: 1280, height: 860, textSize: "standard", mobile: false },
] as const satisfies ReadonlyArray<{ textSize: Settings["textSize"] } & Record<string, unknown>>;

const themes = ["light", "dark"] as const satisfies ReadonlyArray<Settings["theme"]>;

for (const size of sizes) {
  for (const theme of themes) {
    test(`${size.width}px ${size.textSize} ${theme}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        deviceScaleFactor: size.mobile ? 2 : 1,
        isMobile: size.mobile,
        hasTouch: size.mobile,
        colorScheme: theme,
      });
      // The same saved settings the Settings screen writes; the app applies them on load.
      const settings: Settings = { theme, textSize: size.textSize };
      await context.addInitScript(([key, value]) => localStorage.setItem(key, value), [
        STORAGE_KEY,
        JSON.stringify(settings),
      ] as const);

      const page = await context.newPage();
      for (const screen of screens) {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.goto(screen.path);
        await page.getByRole("heading", { level: 1 }).waitFor();
        await page.evaluate(() => document.fonts.ready);
        // Show the whole screen. Growing the window (rather than a fullPage screenshot)
        // keeps the sticky header and footer where they really are: top and bottom.
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width: size.width, height: Math.max(size.height, height) });
        await page.screenshot({
          path: `screenshots/${screen.name}-${size.width}-${size.textSize}-${theme}.png`,
        });
      }
      await context.close();
    });
  }
}
