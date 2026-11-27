# Norma log

Every finding from Norma's `live_check` while building, and what was done with it. `DEFENCE.md`
is written from this log.

| Date       | PR  | Author   | Rule                       | File                                                 | Outcome                             | Reason                                                                                                                                                                                                                          |
| ---------- | --- | -------- | -------------------------- | ---------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-27 | A   | cadenegr | `js-pipeline-allocations`  | `apps/agent/src/cli.ts` (`readUrls`)                 | **fixed**                           | `.map().filter().map()` became one loop. Re-check: the finding is gone.                                                                                                                                                         |
| 2026-11-27 | A   | cadenegr | `js-scl-await-in-loop`     | `apps/agent/src/cli.ts`, `apps/agent/src/collect.ts` | **accepted**                        | Sequential on purpose: politeness allows one request per second per host, and the fetcher's gap only holds when calls don't overlap. Running them in parallel would hammer vendor sites. Each loop has a comment that says why. |
| 2026-11-27 | A   | cadenegr | `node-no-test-framework`   | `package.json` (root)                                | **accepted**                        | pnpm monorepo: vitest is a dev dependency of each package and app, and `pnpm -r test` runs the tests from the root. The root file comes from the foundation template.                                                           |
| 2026-11-27 | A   | cadenegr | `node-no-lint-config`      | `apps/agent/package.json`                            | **accepted**                        | ESLint and Prettier are configured once at the root (`eslint.config.js`) and cover every package. `make lint` runs them.                                                                                                        |
| 2026-11-27 | B   | neodgri  | `js-console-log-only`      | `apps/agent/src/eval.ts`                             | **accepted**                        | `make eval` is a command-line program and the printed table is its output, not debug output left behind. Errors go to `console.error`.                                                                                          |
| 2026-11-27 | B   | neodgri  | `node-no-lint-config`      | `apps/agent/package.json`                            | **accepted**                        | Same reason as author A: ESLint and Prettier are configured once at the root and `make lint` covers every package.                                                                                                              |
| 2026-11-27 | B   | neodgri  | `js-scl-await-in-loop`     | `apps/agent/src/cli.ts`, `apps/agent/src/collect.ts` | **fixed** (settles the clash below) | A's accepted loops replaced by `mapWithLimit`: 4 products, 2 links at once. The fetcher's per-host queue keeps 1 request/s per host. Re-check: clean.                                                                           |
| 2026-11-27 | B   | neodgri  | `js-unbounded-promise-all` | `apps/agent/src/collect.ts`                          | **fixed**                           | The first settle attempt used `Promise.all` over the links (HIGH). Replaced by `mapWithLimit(toCheck, 2, …)`. Re-check: clean.                                                                                                  |
| 2026-11-27 | C   | cadenegr | `js-console-log-only`      | `apps/agent/src/eval.ts`                             | **accepted**                        | Same reason as author B in PR B: `make eval` is a command-line program and the table (now with a rating column and a wanted-vs-got table) is its output. Both authors now handle this rule the same way.                        |

Clean on the first check: `packages/shared/src/verdict.ts`, `packages/core/src/verdict.ts`,
`packages/core/src/evidence.ts`, `apps/agent/src/http.ts`, `apps/agent/src/wayback.ts`,
`apps/agent/src/search/*.ts`.

Clean on the first check (PR B): `apps/agent/src/verdict.ts`, `apps/agent/src/pool.ts`,
`apps/agent/src/run.ts`, `apps/agent/src/http.ts` (per-host queue), `packages/core/src/products.ts`,
`packages/core/src/score.ts`, `packages/shared/src/testset.ts`. Author B checked these before
comparing with author A's rows, but knew A's await-in-loop decision beforehand (same session built
PR A, and the work order stated it).

Clean on the first check (PR C): `packages/shared/src/verdict.ts`, `packages/shared/src/stackgini.ts`,
`packages/core/src/verdict.ts`, `packages/core/src/score.ts`, `packages/core/src/stackgini.ts`,
`apps/agent/src/wayback.ts`, `apps/agent/src/lines.ts`, `apps/agent/src/export.ts`. `verdict.ts` was
checked again after the inspector's fix (no gap for a failed home page): clean.

Clean on the first check (PR D, neodgri): `packages/core/src/risk.ts` (new: risk rules, name and
topic guards, dynamic RegExp built from an escaped name), `apps/agent/src/run.ts`. The other PR D
files (`verdict.ts`, `products.ts`, `evidence.ts`, `collect.ts`, `search/claude.ts`, `verdict.ts` CLI)
were left to the Norma GitHub App on the PR, to save the owner's token budget.

Not checked by `live_check`: the `apps/web` files, which come unchanged from the foundation
template, and `pnpm-lock.yaml` (too large for one call). The Norma GitHub App checks the whole PR.

## Clashes between the two authors

### Clash 1: sequential loops vs. a per-host queue (`js-scl-await-in-loop`)

- **Files:** `apps/agent/src/cli.ts`, `apps/agent/src/collect.ts` (A); `apps/agent/src/verdict.ts`,
  `apps/agent/src/http.ts` (B).
- **Author A (cadenegr, PR A):** kept the loops sequential and **accepted** the finding. Reason: the
  fetcher's 1-second gap per host only held when calls did not overlap, so parallel calls could hit
  a vendor too fast.
- **Author B (neodgri, PR B):** needed `make verdict` to judge many products, so it put the
  politeness rule into the fetcher itself, as a promise queue per host (tested with a fake clock),
  and ran products side by side with a concurrency limit. Its loop raised no finding.
- **What conflicted:** one repo with two rules for the same thing. A said "callers must not
  overlap", B said "callers may overlap, the fetcher spaces requests". A's comments in `cli.ts` and
  `collect.ts` described a limit that B's change had removed.
- **Settled:** B's way, for the whole repo. A's reason was right for the fetcher A had and wrong
  for the fetcher after B's change. Keeping politeness in one place (the fetcher) is safer than
  asking every caller to stay sequential. `cli.ts` and `collect.ts` now use `mapWithLimit`, and
  their old comments are gone. The first try used `Promise.all` and Norma flagged it
  (`js-unbounded-promise-all`, HIGH), so every fan-out now goes through the same limiter.
  Re-check: clean. Decision: `docs/decisions/0004-verdict-and-eval-targets.md`.
- **Given up:** A's simpler mental model (one request at a time, nothing to reason about).
- **Honest note:** B was not blind to A's choice. The same session built PR A, and the work order
  named A's decision. B's code and its first check came before the comparison.
