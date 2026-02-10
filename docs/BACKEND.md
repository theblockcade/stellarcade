# Backend Documentation

The Stellarcade backend is a RESTful API built with **Node.js** and **Express**, serving as the bridge between the frontend application, the database, and the Stellar network.

## 🏗 Architecture

The backend follows a standard MVC (Model-View-Controller) pattern, though "Views" are JSON responses.

*   **Controllers (`src/controllers`)**: Handle incoming HTTP requests, validate input, and send responses.
*   **Services (`src/services`)**: Contain the core business logic. They interact with the database and external APIs (Stellar Horizon).
*   **Models (`src/models`)**: Define the database schema and interact with PostgreSQL.
*   **Routes (`src/routes`)**: Define the API endpoints and map them to controllers.

## 🗄 Database Schema (PostgreSQL)

The primary database stores user data, game history, and transaction logs.

*   **Users Table**: Stores user profiles, authentication details (if applicable), and linked Stellar addresses.
*   **Games Table**: Records every game played, including the player, bet amount, outcome, and transaction hash.
*   **Transactions Table**: Logs all deposits and withdrawals.

## ⚡ Caching (Redis)

Redis is used for:
1.  **Session Management**: Storing active user sessions to reduce database load.
2.  **Rate Limiting**: Tracking request counts to prevent abuse (see `middleware/rateLimiter.js`).
3.  **Real-time Updates**: potentially used for Pub/Sub features if we add WebSockets.

## 🌐 Stellar Integration

The backend uses the **Stellar SDK** to interact with the Soroban contracts.
*   It submits transactions on behalf of users (if using a managed wallet) or monitors transactions submitted by user wallets.
*   It listens for contract events to update the local database state.

## 🧪 Testing

We use **Jest** for testing.

### Running Tests
```bash
cd backend
npm test
```

### Test Structure
*   `tests/unit`: Tests for individual functions and utilities.
*   `tests/integration`: Tests for API endpoints, involving database and mock Stellar responses.
