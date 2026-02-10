# Environment Variables

The application requires specific environment variables to be set for configuration. These should be defined in a `.env` file in the `backend/` directory.

> **Warning**: Never commit your real `.env` file to version control.

## General Configuration

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | The port the backend server will listen on. | `3000` |
| `NODE_ENV` | The environment mode (`development`, `production`, `test`). | `development` |
| `LOG_LEVEL` | The verbosity of logging (`debug`, `info`, `warn`, `error`). | `info` |

## Database (PostgreSQL)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `DB_HOST` | Hostname of the PostgreSQL server. | `localhost` |
| `DB_PORT` | Port of the PostgreSQL server. | `5432` |
| `DB_NAME` | Name of the database. | `stellarcade` |
| `DB_USER` | Database username. | `postgres` |
| `DB_PASSWORD` | Database password. | `postgres` |
| `DATABASE_URL` | Full connection string (overrides individual fields if present). | `postgres://user:pass@localhost:5432/db` |

## Redis

| Variable | Description | Example |
| :--- | :--- | :--- |
| `REDIS_URL` | Connection string for the Redis server. | `redis://localhost:6379` |

## Stellar Network

| Variable | Description | Example |
| :--- | :--- | :--- |
| `STELLAR_NETWORK` | The Stellar network to connect to (`testnet`, `public`). | `testnet` |
| `HORIZON_URL` | URL of the Horizon API server. | `https://horizon-testnet.stellar.org` |
| `NETWORK_PASSPHRASE`| The network passphrase for transaction signing. | `Test SDF Network ; September 2015` |

## Smart Contracts

| Variable | Description |
| :--- | :--- |
| `PRIZE_POOL_CONTRACT_ID` | The deployed ID of the Prize Pool contract. |
| `RNG_CONTRACT_ID` | The deployed ID of the Random Generator contract. |
| `COIN_FLIP_CONTRACT_ID` | The deployed ID of the Coin Flip contract. |

## Authentication

| Variable | Description |
| :--- | :--- |
| `JWT_SECRET` | Secret key used to sign and verify JWT tokens. **Must be strong in production.** |
