# 2. A command-line app next to the web app

**Status:** accepted, 2026-11-26

## Context

The agent's first job is to collect evidence about software products from the network and print it, run by one command. Foundation v0.3.1 only has `apps/web`, a browser app, which cannot fetch arbitrary sites (CORS) or run `claude -p`.

## Decision

- A new app, `apps/agent` (`@app/agent`): a Node 24 CLI. It runs the TypeScript sources directly (Node strips the types), so it needs no build step.
- The same layering as the web app: data shapes in `packages/shared`, rules that read HTML, statuses and archive rows in `packages/core` (pure, tested), and every network call in `apps/agent` (`http.ts`, `wayback.ts`, `search/`).
- Web search sits behind one `SearchProvider` interface, chosen by `SEARCH_PROVIDER` (`none`, `claude`, `tavily`).
- `packages/core` gets the Node types (`@types/node`) so it can use the standard `URL` class and read test fixtures. Its rule stays the same: no `fetch`, no storage, no clock inside.
- Politeness limits from the work order live in `packages/shared`: 1 request per second per host, at most 15 vendor pages per product.

## Given up

- A server or a browser-based tool. Either would be more to build and run, for no gain while the output is a JSON line.
- A bundler or `tsx` for the CLI. Not needed while Node's type stripping is enough. If the CLI ever needs syntax that can't be stripped (enums, parameter properties), add a build step then.
- An HTML parser library. Regular expressions are enough for links, the title and the copyright line on a home page. Switch to a parser if a rule needs the document structure.
