import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// The .env file lives at the project root, shared by every app.
const envDir = "../..";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir);
  const title = env.VITE_APP_TITLE || "My App";
  const description = env.VITE_APP_DESCRIPTION || title;

  return {
    envDir,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        // Generates every app icon from one SVG at build time.
        pwaAssets: { image: "public/favicon.svg" },
        // Everything the app needs is cached, so it opens offline.
        // (The plugin adds manifest.webmanifest itself; listing it here would duplicate it.)
        workbox: { globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"] },
        manifest: {
          name: title,
          short_name: title,
          description,
          display: "standalone",
          start_url: "/",
          // Light values of --color-surface and --color-canvas (src/styles/index.css).
          theme_color: "#f3f5f8",
          background_color: "#ffffff",
        },
      }),
    ],
  };
});
