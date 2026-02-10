# Project Structure

This document provides a detailed overview of the file and directory structure of the Stellarcade repository.

## 📂 Root Directory

| Name | Description |
| :--- | :--- |
| `.github/` | CI/CD workflows (GitHub Actions) and issue templates. |
| `backend/` | The Node.js/Express backend API. |
| `contracts/` | Soroban smart contracts (Rust). |
| `docs/` | Comprehensive project documentation. |
| `frontend/` | The React/Vite frontend application. |
| `scripts/` | Helper scripts for deployment and maintenance. |
| `docker-compose.yml` | Definition for running the entire stack locally with Docker. |
| `README.md` | The main entry point for the project. |
| `CONTRIBUTING.md` | Guidelines for contributors. |

## 📂 Backend Structure (`backend/`)

| Name | Description |
| :--- | :--- |
| `src/config/` | Configuration files (database, Stellar network, etc.). |
| `src/controllers/` | Request handlers for API endpoints. |
| `src/middleware/` | Custom Express middleware (auth, logging, etc.). |
| `src/models/` | Database models (PostgreSQL schemas). |
| `src/routes/` | API route definitions. |
| `src/services/` | Business logic and integrations (Stellar, etc.). |
| `src/utils/` | Shared utility functions. |
| `src/server.js` | The application entry point. |

## 📂 Contracts Structure (`contracts/`)

| Name | Description |
| :--- | :--- |
| `coin-flip/` | The Coin Flip game logic contract. |
| `prize-pool/` | Manages deposits, withdrawals, and prize payouts. |
| `random-generator/` | Provably fair RNG implementation. |
| `shared/` | Shared types and libraries common to all contracts. |

## 📂 Frontend Structure (`frontend/`)

*Note: The frontend is currently under active development.*

| Name | Description |
| :--- | :--- |
| `src/` | Source code for the React application. |
| `public/` | Static assets (images, fonts, etc.). |
| `vite.config.ts` | Configuration for the Vite bundler. |

---

*This document is automatically generated and should be updated as the project structure evolves.*
