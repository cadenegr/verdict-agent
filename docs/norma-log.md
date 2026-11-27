# Norma log

Every finding from Norma's `live_check` while building, and what was done with it. `DEFENCE.md`
is written from this log.

| Date       | PR  | Author   | Rule                      | File                                                 | Outcome      | Reason                                                                                                                                                                                                                          |
| ---------- | --- | -------- | ------------------------- | ---------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-27 | A   | cadenegr | `js-pipeline-allocations` | `apps/agent/src/cli.ts` (`readUrls`)                 | **fixed**    | `.map().filter().map()` became one loop. Re-check: the finding is gone.                                                                                                                                                         |
| 2026-11-27 | A   | cadenegr | `js-scl-await-in-loop`    | `apps/agent/src/cli.ts`, `apps/agent/src/collect.ts` | **accepted** | Sequential on purpose: politeness allows one request per second per host, and the fetcher's gap only holds when calls don't overlap. Running them in parallel would hammer vendor sites. Each loop has a comment that says why. |
| 2026-11-27 | A   | cadenegr | `node-no-test-framework`  | `package.json` (root)                                | **accepted** | pnpm monorepo: vitest is a dev dependency of each package and app, and `pnpm -r test` runs the tests from the root. The root file comes from the foundation template.                                                           |
| 2026-11-27 | A   | cadenegr | `node-no-lint-config`     | `apps/agent/package.json`                            | **accepted** | ESLint and Prettier are configured once at the root (`eslint.config.js`) and cover every package. `make lint` runs them.                                                                                                        |
| 2026-11-27 | B   | neodgri  | `js-console-log-only`     | `apps/agent/src/eval.ts`                             | **accepted** | `make eval` is a command-line program and the printed table is its output, not debug output left behind. Errors go to `console.error`.                                                                                          |
| 2026-11-27 | B   | neodgri  | `node-no-lint-config`     | `apps/agent/package.json`                            | **accepted** | Same reason as author A: ESLint and Prettier are configured once at the root and `make lint` covers every package.                                                                                                              |

Clean on the first check: `packages/shared/src/verdict.ts`, `packages/core/src/verdict.ts`,
`packages/core/src/evidence.ts`, `apps/agent/src/http.ts`, `apps/agent/src/wayback.ts`,
`apps/agent/src/search/*.ts`.

Clean on the first check (PR B): `apps/agent/src/verdict.ts`, `apps/agent/src/pool.ts`,
`apps/agent/src/run.ts`, `apps/agent/src/http.ts` (per-host queue), `packages/core/src/products.ts`,
`packages/core/src/score.ts`, `packages/shared/src/testset.ts`. Author B checked these before
comparing with author A's rows, but knew A's await-in-loop decision beforehand (same session built
PR A, and the work order stated it).

Not checked by `live_check`: the `apps/web` files, which come unchanged from the foundation
template, and `pnpm-lock.yaml` (too large for one call). The Norma GitHub App checks the whole PR.

## Clashes between the two authors

None yet. A clash is only logged here if one really happens (rule, file, what each author did, why).
