# Defence

Two authors built this repo: `cadenegr` (PRs #3, #5, #7) and `neodgri` (PRs #4, #6). Both ran
Norma's `live_check` on their files before each commit, and the Norma GitHub App checked every PR.
Every finding and what we did with it is in [`docs/norma-log.md`](docs/norma-log.md). No code was
deleted to hide a finding. Norma's last scan of the repo shows no open issues.

Links point to the code at
[`e6c2d78`](https://github.com/cadenegr/verdict-agent/tree/e6c2d78be62c55c3efd08430386e7ff2b5e5bcc2).

## 1. Found and fixed: `js-unbounded-promise-all` (HIGH)

- **File:** [`apps/agent/src/collect.ts`, line 59](https://github.com/cadenegr/verdict-agent/blob/e6c2d78be62c55c3efd08430386e7ff2b5e5bcc2/apps/agent/src/collect.ts#L59)
- **Norma said:** the links on a vendor's site were checked with a `Promise.all` that has no limit.
- **What we did:** author `neodgri` replaced it with `mapWithLimit(toCheck, 2, …)`. Checked again:
  clean. PR [#4](https://github.com/cadenegr/verdict-agent/pull/4).
- **Why:** an unbounded fan-out sends every request to one vendor at once. The event rules say
  not to hammer vendor sites, so every fan-out in the repo now goes through the same limiter.
- **Also fixed:** `js-pipeline-allocations` in
  [`apps/agent/src/cli.ts`](https://github.com/cadenegr/verdict-agent/blob/e6c2d78be62c55c3efd08430386e7ff2b5e5bcc2/apps/agent/src/cli.ts#L17)
  (author `cadenegr`, PR [#3](https://github.com/cadenegr/verdict-agent/pull/3)):
  `.map().filter().map()` became one loop (`readUrls` in `packages/core`). Checked again: clean.

## 2. Tradeoff accepted: `js-console-log-only`

- **File:** [`apps/agent/src/eval.ts`, lines 15-26](https://github.com/cadenegr/verdict-agent/blob/e6c2d78be62c55c3efd08430386e7ff2b5e5bcc2/apps/agent/src/eval.ts#L15-L26)
- **Norma said:** `console.log` in source code.
- **What we did:** kept it. Both authors accepted it for the same reason:
  `neodgri` in PR [#4](https://github.com/cadenegr/verdict-agent/pull/4), and `cadenegr` in
  PR [#5](https://github.com/cadenegr/verdict-agent/pull/5).
- **Why:** `make eval` is a command-line program. The score table it prints is its output, not
  debug output left behind. Errors go to `console.error`. Swapping in a logger would add a
  dependency and hide the result the owner needs to read.

## 3. Clash between the authors: `js-scl-await-in-loop`

- **Files:** [`apps/agent/src/cli.ts`](https://github.com/cadenegr/verdict-agent/blob/e6c2d78be62c55c3efd08430386e7ff2b5e5bcc2/apps/agent/src/cli.ts#L15-L17),
  [`apps/agent/src/collect.ts`](https://github.com/cadenegr/verdict-agent/blob/e6c2d78be62c55c3efd08430386e7ff2b5e5bcc2/apps/agent/src/collect.ts#L57-L59),
  [`apps/agent/src/http.ts`](https://github.com/cadenegr/verdict-agent/blob/e6c2d78be62c55c3efd08430386e7ff2b5e5bcc2/apps/agent/src/http.ts#L46)
- **Norma said:** `await` inside a loop runs the requests one after another.
- **Author `cadenegr` (PR #3) accepted it:** the loops ran one after another on purpose. The
  fetcher's one-second gap per host only held when calls didn't overlap, so running them in
  parallel could hit a vendor too fast.
- **Author `neodgri` (PR #4) fixed it:** `make verdict` has to judge many products, so the
  politeness rule moved into the fetcher itself, as a queue per host (tested with a fake clock).
  The products then run side by side with a limit.
- **Settled:** `neodgri`'s way, for the whole repo (commit
  [`b5f2cae`](https://github.com/cadenegr/verdict-agent/commit/b5f2cae)). `cadenegr`'s reason
  was right for the old fetcher and wrong for the new one. Politeness kept in one place, the
  fetcher, is safer than asking every caller to stay sequential. The fix's first try used
  `Promise.all`, which became case 1.
- **Given up:** the simpler model of one request at a time, with nothing to reason about.
- **Honest note:** `neodgri` knew about `cadenegr`'s choice, since the same session built both PRs.

## Other accepted findings

`node-no-test-framework` and `node-no-lint-config` (`package.json` files): this is a pnpm monorepo.
Vitest is installed in each package, and ESLint and Prettier are configured once at the root.
`make test` and `make lint` cover every package. Both authors gave the same reason.
