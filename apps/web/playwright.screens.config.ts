import { defineConfig } from "@playwright/test";
import base from "./playwright.config.ts";

// `make screens`: takes screenshots (e2e/*.shots.ts) instead of running tests.
// Same production build and server as the browser tests.
export default defineConfig({
  ...base,
  testMatch: "**/*.shots.ts",
  projects: [{ name: "screens", use: { browserName: "chromium" } }],
});
