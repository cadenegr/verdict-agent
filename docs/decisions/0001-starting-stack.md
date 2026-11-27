# 1. Starting stack

**Status:** accepted (from the foundation template)

## Context

The app has a UI that must be easy to change and must also work as an installable app on phones and desktops.

## Decision

- TypeScript everywhere, in a pnpm workspace monorepo.
- React + Vite for the UI, Tailwind for styling.
- PWA through vite-plugin-pwa: installable, works offline, icons generated from `apps/web/public/favicon.svg`.
- Logic in `packages/core`, data shapes in `packages/shared` (zod), UI in `apps/web`.
- Vitest for unit tests, Playwright for browser tests.

## Given up

- No backend: data lives in the browser (`localStorage`) and isn't shared between devices. Add a backend when that's needed.
- No app-store presence. Add Capacitor when an app needs the stores or phone hardware.

## Writing new decisions

Copy this file as `NNNN-short-title.md` with the next number. Keep it short: context, decision, what was given up.
