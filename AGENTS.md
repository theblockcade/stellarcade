# Repository Agent Standards

This file defines the minimum engineering standards that AI agents must follow
when working in this repository. These rules exist to prevent lint debt, weak
typing, build regressions, and workflow bypasses.

## Git and Hook Policy

- Never use `git commit --no-verify`.
- Never use `git push --no-verify`.
- Do not bypass, disable, or delete a failing hook. Fix the underlying issue
  instead.
- Direct pushes to `main` are never allowed, for anyone. Always work on a
  feature branch and open a pull request.
- Hooks live under `.githooks/` (version-controlled, not `.git/hooks/`) and
  are enabled via `git config core.hooksPath .githooks`. If
  `git config core.hooksPath` doesn't print `.githooks`, run that command
  before doing anything else — an unset hooksPath means every check below is
  silently skipped, with no error.
- `pre-commit` formats/lints only what's staged (touched `contracts/<crate>/`
  via `cargo fmt`; touched `backend/` via `npm run format && npm run lint -- --fix`).
- `pre-push` runs scoped checks based on what changed since the last push:
  - Any touched `contracts/<crate>/` — `cargo fmt --check`,
    `cargo clippy --all-targets --all-features -- -D warnings`, `cargo test`,
    plus a contract-doc sync check if `contracts/` or `docs/contracts/`
    changed.
  - Any touched `backend/` — `npm run lint`, `npm run openapi:validate`,
    `npm test`.
  - Any touched `apps/web/` or `packages/tokens/` — `pnpm --filter
    @stellarcade/web run lint`, `run typecheck`, `run test`.
- Confirm every applicable check above passes locally before pushing. If a
  check cannot be satisfied, report the blocker clearly instead of claiming
  the task is complete.

## Delivery Standard

Do not treat a task as complete until every check relevant to what you
changed passes:

- Contracts (run from inside the specific `contracts/<crate>/` directory):
  `cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test`
- Backend: `cd backend && npm run lint && npm run openapi:validate && npm test`
- Web: `pnpm --filter @stellarcade/web run lint && pnpm --filter @stellarcade/web run typecheck && pnpm --filter @stellarcade/web run test`

CI additionally lints/tests the **entire** contracts workspace (not just
touched crates), builds the web app, and runs Playwright e2e tests. Those
aren't required locally before every push, but a change that would obviously
break them (an unresolvable import, a broken route, a change that affects
other crates) should still be caught by you before pushing — when in doubt,
`cd contracts && cargo clippy --workspace --locked -- -D warnings` matches CI
exactly, it's just slower than the per-touched-crate hook check.

## Commit Message Standard

- Use the imperative mood in the subject line (e.g. `Fix settlement race`,
  not `Fixed` or `Fixes`).
- Keep the subject line to 50 characters or fewer where practical.
- Do not end the subject line with a period.
- Only add a body when it conveys information the subject line can't —
  don't restate the subject.
