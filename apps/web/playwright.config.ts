import { defineConfig, devices } from "@playwright/test";

const port = 4173;
// 127.0.0.1 rather than "localhost", which can resolve to IPv6 and never answer.
const url = `http://127.0.0.1:${port}`;

// End-to-end tests run against the production build, where the PWA is active.
export default defineConfig({
  testDir: "e2e",
  use: { baseURL: url },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "phone", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --host 127.0.0.1 --port ${port} --strictPort`,
    url,
    reuseExistingServer: !process.env.CI,
  },
});
