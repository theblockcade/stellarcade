# Contributing to Stellarcade

Thanks for contributing to Stellarcade.

## How to Contribute

1. Find an issue to work on.
2. Fork and clone the repository.
3. Create a focused branch for your work.
4. Implement the change and add or update tests.
5. Run the local checks.
6. Open a pull request against `main`.

## Development Setup

### Smart Contracts

- Install [Rust](https://www.rust-lang.org/tools/install).
- Install Soroban CLI: `cargo install --locked soroban-cli`
- Run tests in the touched crate with `cargo test`.

### Backend

- Install Node.js.
- Install dependencies with `cd backend && npm install`.
- Start the dev server with `npm run dev`.

### Frontend

- Install Node.js.
- Install dependencies with `cd frontend && npm install`.
- Start the dev server with `npm run dev`.

### Infrastructure

- Install Docker and Docker Compose.
- Start local services with `docker-compose up -d`.

## Git Hooks

- Enable the shared repo hooks right after cloning.
- macOS/Linux: `bash scripts/setup-hooks.sh`
- Windows PowerShell: `powershell -ExecutionPolicy Bypass -File scripts/setup-hooks.ps1`
- Verify the setup with `git config --get core.hooksPath`
- The hooks catch common contract, backend, and frontend failures before push.

## Code Style

- JavaScript and TypeScript: follow the ESLint configuration.
- Rust: use `snake_case` and run `cargo fmt`.
- SQL: use `snake_case` for table and column names.

## Pull Request Process

- Keep each PR focused on one change area.
- Update docs when behavior changes.
- Run the repo hooks before pushing so CI failures are caught locally.
- Ensure CI checks pass before requesting review.

### Pull Request Template

Please use the following format for pull requests:

```markdown
## Description
<High-level summary of what was implemented and why>

Closes #<Issue Number>
Closes #<Issue Number>

## Changes proposed

### What were you told to do?
<Summarize the task requirements from the issues>

### What did I do?
#### <Logical Grouping Header 1>
- <Bullet points of specific changes>

## Check List (Check all the applicable boxes)
- [x] My code follows the code style of this project.
- [x] This PR does not contain plagiarized content.
- [x] The title and description of the PR is clear and explains the approach.
- [x] I am making a pull request against the main branch (left side).
- [x] My commit messages styles matches our requested structure.
- [x] The implementation was reviewed and confirmed to work as intended.
- [x] I am only making changes to files I was requested to.

## Screenshots / Validation Evidence
<Relevant validation evidence: build output, logic confirmation, or description of verified behavior.>
```

## Issue Reporting

- Use the issue templates in `.github/ISSUE_TEMPLATE/`.
- Include reproduction steps for bugs and exact scope for features.
