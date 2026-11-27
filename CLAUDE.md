# Working in this project

## Commands

- `make dev`: run the app. `make test`: unit tests. `make e2e`: browser tests. `make lint`: style and types. `make screens`: screenshots of every screen into `apps/web/screenshots/`.
- Run `make lint && make test` before calling a change done.
- Package manager is pnpm (through corepack). Never use npm or yarn here.

## Structure rules

- `packages/core`: business logic as pure functions. No React, no `localStorage`, no `fetch`. Every function has unit tests next to it (`*.test.ts`).
- `packages/shared`: zod schemas and the types inferred from them. Used by `core` and `web`.
- `apps/web/src/features/<name>/`: one folder per feature. Components render; a `use<Name>` hook wires them to `core`; a `<name>Storage.ts` adapter is the only code that touches storage or the network.
- `apps/web/src/app/`: the shell (header, body, footer), routes and the list of sections only.
- `apps/web/src/components/ui/`: the design preset's base components. Build screens from them.
- Never copy code between folders. Move it to a package and import it.
- Keep files under about 300 lines; the linter warns past that.

## Design

- Follow `docs/design.md`: the look, the tokens, the components and the checks. Read it before building or changing a screen.
- Colors, font, sizes and spacing come from the tokens in `apps/web/src/styles/index.css` (`@theme`). Never raw Tailwind colors, hex colors or `dark:`; the linter refuses them.
- Every screen starts with `<Page title="...">` and uses the components in `components/ui/`.
- A new screen gets a route in `src/app/App.tsx`, an entry in `src/app/sections.ts` (if it is a section) and an entry in `apps/web/e2e/screens.ts`.
- Tailwind classes in components, mobile first (base classes for phone, `sm:`/`md:` for bigger screens).

## Settings

- App settings come from `.env`; add every new variable to `.env.example`.

## Norma

This repo is linked to Norma (`remote_url`: `git@github.com:cadenegr/verdict-agent.git`).

- Run `live_check` on every file a change touches (code, config, `package.json`, `pnpm-lock.yaml`), all in one call, and again until it is clean. Skip docs (`*.md`) and data files.
- When the task is done, record it with `register_applied_actions`, using `rule_id`s from `get_rulesets` / `get_rules_for_ruleset`.
- A change is done when `make lint && make test` pass and Norma is clean and recorded.

## Decisions

Record any choice someone might later ask "why?" about in `docs/decisions/`.
