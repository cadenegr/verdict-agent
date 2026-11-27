# 3. An evidence target in the foundation-owned Makefile

**Status:** accepted, 2026-11-26 (owner approved in the blueprint)

## Context

The work order asks for `make evidence IN=<file>`. The `Makefile` belongs to the foundation: it holds the same commands in every project, and `copier update` rewrites it.

## Decision

Add one `evidence` target to this project's `Makefile`. It runs `pnpm --filter @app/agent evidence` with the file's absolute path.

## Given up

- `pnpm --filter @app/agent evidence <file>` without make. That would break the "same commands everywhere" habit that the order relies on.
- Waiting for the foundation. A hook for project-specific targets (for example `-include project.mk`) belongs there and would make this local change unnecessary. Until it exists, expect a small conflict in `Makefile` on each `copier update`.
