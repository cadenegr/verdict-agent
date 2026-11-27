# Norma log

Every finding from Norma's `live_check` while building, and what was done with it. `DEFENCE.md`
is written from this log.

| Date       | PR  | Author   | Rule                      | File                                                 | Outcome      | Reason                                                                                                                                                                                                                          |
| ---------- | --- | -------- | ------------------------- | ---------------------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-27 | A   | cadenegr | `js-pipeline-allocations` | `apps/agent/src/cli.ts` (`readUrls`)                 | **fixed**    | `.map().filter().map()` became one loop. Re-check: the finding is gone.                                                                                                                                                         |
| 2026-11-27 | A   | cadenegr | `js-scl-await-in-loop`    | `apps/agent/src/cli.ts`, `apps/agent/src/collect.ts` | **accepted** | Sequential on purpose: politeness allows one request per second per host, and the fetcher's gap only holds when calls don't overlap. Running them in parallel would hammer vendor sites. Each loop has a comment that says why. |
| 2026-11-27 | A   | cadenegr | `node-no-test-framework`  | `package.json` (root)                                | **accepted** | pnpm monorepo: vitest is a dev dependency of each package and app, and `pnpm -r test` runs the tests from the root. The root file comes from the foundation template.                                                           |
| 2026-11-27 | A   | cadenegr | `node-no-lint-config`     | `apps/agent/package.json`                            | **accepted** | ESLint and Prettier are configured once at the root (`eslint.config.js`) and cover every package. `make lint` runs them.                                                                                                        |

Clean on the first check: `packages/shared/src/verdict.ts`, `packages/core/src/verdict.ts`,
`packages/core/src/evidence.ts`, `apps/agent/src/http.ts`, `apps/agent/src/wayback.ts`,
`apps/agent/src/search/*.ts`.

Not checked by `live_check`: the `apps/web` files, which come unchanged from the foundation
template, and `pnpm-lock.yaml` (too large for one call). The Norma GitHub App checks the whole PR.

## Clashes between the two authors

None yet. A clash is only logged here if one really happens (rule, file, what each author did, why).
