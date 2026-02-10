# 🌌 Stellarcade

[![Stellar](https://img.shields.io/badge/Stellar-Soroban-black.svg?style=for-the-badge&logo=stellar)](https://stellar.org)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=for-the-badge)](https://github.com/stellar/stellarcade)
[![Test Coverage](https://img.shields.io/badge/coverage-85%25-blue.svg?style=for-the-badge)](https://github.com/stellar/stellarcade)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**Stellarcade** is a decentralized arcade platform built on the Stellar network using Soroban smart contracts. We provide provably fair games, community prize pools, and a seamless gaming experience using Stellar's fast and low-cost infrastructure.

## ✨ Key Features

- **Provably Fair Gaming**: Our Random Number Generator (RNG) contract ensures every game result is verifiable and fair.
- **Decentralized Prize Pools**: Play and win from pools managed entirely by smart contracts.
- **Stellar Speed**: Lightning-fast transactions and minimal fees.
- **Multiple Games**: Coin Flip, Trivia, and more—all on-chain.
- **Open Source**: Built by the community, for the community.

## 🛠 Tech Stack

- **Smart Contracts**: Rust & Soroban SDK
- **Backend**: Node.js, Express, PostgreSQL, Redis
- **Frontend**: Vite + React (Coming Soon)
- **Infrastructure**: Docker, GitHub Actions

## 🚀 Quick Start

### Prerequisites

- [Rust & Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)
- [Node.js (v18+)](https://nodejs.org/)
- [Docker](https://www.docker.com/)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/stellar/stellarcade.git
   cd stellarcade
   ```
2. Install dependencies:

   ```bash
   # Backend
   cd backend && npm install

   # Contracts
   cd ../contracts/prize-pool && cargo build
   ```

3. Run with Docker:
   ```bash
   docker-compose up -d
   ```

## 📚 Documentation

Detailed documentation can be found in the [docs/](docs/) folder:

- [Architecture](docs/ARCHITECTURE.md)
- [Project Structure](docs/PROJECT_STRUCTURE.md)
- [Smart Contracts](docs/CONTRACTS.md)
- [Backend Guide](docs/BACKEND.md)
- [Game Rules](docs/GAME_RULES.md)
- [API Reference](docs/API_DOCUMENTATION.md)
- [Setup Guide](docs/SETUP.md)
- [Environment Variables](docs/ENVIRONMENT.md)

## 🤝 Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to get started.

## 🛡 Security

For security concerns, please refer to our [SECURITY.md](SECURITY.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Community

- [Discord Placeholder](#)
- [Twitter / X Placeholder](#)
- [Stellar Developers Foundation](https://stellar.org/developers)

---

_Created with ❤️ for the Stellar Ecosystem (2026)_
