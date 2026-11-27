# 4. Verdict and eval targets, and a per-host queue in the fetcher

**Status:** accepted, 2026-11-27 (owner approved in the blueprint for PR B)

## Context

The work order asks for `make verdict IN=<file>` and `make eval`. Like `evidence` (decision 3),
they go into the foundation-owned `Makefile`. `make verdict` should judge several products without
breaking the politeness rule: at most one request per second per host.

## Decision

- Add `verdict` and `eval` targets next to `evidence`. Same pattern: `pnpm --filter @app/agent <script>`.
- The fetcher keeps a promise queue per host. Overlapping calls to one host start at least 1 s
  apart; different hosts don't wait for each other. Politeness lives in one place, the fetcher,
  so callers may run products side by side.
- `make verdict` judges up to 4 products at once (`mapWithLimit` in `apps/agent/src/pool.ts`) and
  rewrites `live/verdicts.jsonl` on every run, in input order.

## Given up

- Running products one after another (as `make evidence` did): simple, but a list of 50 products
  takes many minutes for no politeness gain.
- A library such as `p-limit`: 20 lines of our own code are enough and add no dependency.
- Appending to `verdicts.jsonl` across runs: `make eval` would then mix old and new verdicts.
