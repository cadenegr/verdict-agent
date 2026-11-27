import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import design from "./eslint.design.js";

export default tseslint.config(
  {
    ignores: [
      "**/dist",
      "**/dev-dist",
      "**/coverage",
      "**/playwright-report",
      "**/test-results",
      "**/screenshots",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Principle 3: small files, one job each.
  {
    rules: {
      "max-lines": ["warn", { max: 300, skipBlankLines: true, skipComments: true }],
    },
  },

  // Principle 1: core logic never depends on the interface.
  {
    files: ["packages/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "react/*", "@app/web", "@app/web/*"],
              message: "packages/ hold pure logic and types. UI code belongs in apps/.",
            },
          ],
        },
      ],
    },
  },

  // The web app: browser globals and React rules.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  // Design preset: screens use the tokens and sizes from styles/index.css (docs/design.md).
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    ignores: ["**/*.test.{ts,tsx}"],
    plugins: { design },
    rules: { "design/tokens-only": "error" },
  },

  // Config files run in Node.
  {
    files: ["**/*.config.{js,ts}", "eslint.design.js"],
    languageOptions: { globals: globals.node },
  },
);
