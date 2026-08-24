# Experimental Incubator (`experimental/`)

Welcome to the **StellarCade Experimental Incubator**!

This directory is an isolated sandbox for community contributions, new smart contract prototypes, experimental UI widgets, and developer tools.

---

## 🎯 Purpose

- **Isolate community & prototype work** from the core production branches and modules (`contracts/`, `apps/web/`, `backend/`).
- **Rapid experimentation**: build, iterate, and test new mechanics without affecting core CI/CD pipelines.
- **Incubator for graduation**: thoroughly tested and vetted modules in `experimental/` can be promoted to the main codebase.

---

## 📁 Directory Structure

```text
experimental/
├── contracts/       # Prototype Soroban smart contracts, game engines, and mechanics
├── ui/              # Experimental React/Next.js components, dashboards, and UI widgets
└── tools/           # Automation scripts, bots, testing utilities, and indexers
```

---

## 📋 Contributor Guidelines

1. **Keep Contributions Contained**:
   - All experimental work, tests, and local configs must reside within your assigned subfolder under `experimental/` (e.g., `experimental/contracts/<my-feature>/`).
   - Do **not** modify production code in `contracts/`, `apps/`, or `backend/` in experimental PRs unless explicitly instructed in the issue.

2. **Testing & Code Quality**:
   - Every experimental contract must include its own unit tests (`src/test.rs` or `tests/`).
   - Every experimental UI component should include standalone props and fallback states.
   - Code must pass standard formatting and lint checks.

3. **Graduation Path**:
   - Once an experimental feature meets the acceptance criteria, passes comprehensive testing, and is reviewed by maintainers, a separate PR will integrate/graduate it into the core architecture.

---

## 🤝 Questions & Support

If you have any questions about implementing an experimental feature, please comment directly on your assigned GitHub issue or reach out in the community channels.
