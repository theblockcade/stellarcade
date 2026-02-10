# Contributing to Stellarcade

First off, thank you for considering contributing to Stellarcade! It's people like you that make Stellarcade such a great tool.

## 🌟 Welcome Message

We are excited to have you here! Stellarcade is a community-driven project aiming to bring the best arcade experience to the Stellar blockchain. Whether you're a back-end wizard, a front-end artist, a smart contract expert, or a documentation enthusiast, there's a place for you.

> For detailed technical guidelines, code review processes, and branch strategies, please check our [Extended Contribution Guide](docs/CONTRIBUTING_GUIDE.md).

## 🚀 How to Contribute

1.  **Find an Issue**: Check out our [Issues](https://github.com/stellar/stellarcade/issues) page. Look for "good first issue" labels if you're new!
2.  **Fork & Clone**: Fork the repository and clone it to your local machine.
3.  **Branch**: Create a new branch for your work (e.g., `feat/add-new-game` or `fix/payout-bug`).
4.  **Implement**: Write your code! Follow our style guidelines and add tests.
5.  **Test**: Ensure everything works as expected.
6.  **Pull Request**: Submit a PR back to the `main` branch with a clear description of your changes.

## 🛠 Development Setup

### Smart Contracts (Rust/Soroban)

- Install [Rust](https://www.rust-lang.org/tools/install).
- Install Soroban CLI: `cargo install --locked soroban-cli`.
- Run tests: `cargo test` in the specific contract directory.

### Backend (Node.js)

- Install Node.js v18+.
- Install dependencies: `cd backend && npm install`.
- Run dev server: `npm run dev`.

### Infrastructure

- Install Docker and Docker Compose.
- Start local services: `docker-compose up -d`.

## 📜 Code Style Guidelines

- **JavaScript/Node.js**: Use camelCase for variables/functions. Follow the ESLint configuration.
- **Rust**: Use snake_case for variables/functions. Run `cargo fmt` before committing.
- **SQL**: Use snake_case for table names and columns.

## 🚜 Pull Request Process

- Keep PRs focused. One feature/fix per PR is preferred.
- Update documentation if you're changing functionality.
- Ensure CI checks pass.
- A maintainer will review your PR and provide feedback.

## 🐛 Issue Reporting

- Use the provided [Issue Templates](.github/ISSUE_TEMPLATE/).
- Be as descriptive as possible. Include steps to reproduce for bugs.

## 🗺 Areas Needing Help

- **Smart Contracts**: Complex game logic and security optimizations.
- **Backend**: Scaling the API and managing large prize pools.
- **Frontend**: Creating a "wow" UI (Work in Progress).
- **Documentation**: Improving guides and tutorials.
- **Testing**: Expanding our test suites.

## 🏆 Recognition

Contributors will be featured in our project README and Discord!

---

_Thank you for being part of the Stellarcade journey!_
