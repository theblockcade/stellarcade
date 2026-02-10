# Smart Contracts Documentation

This document explicitly details the functionality, public interface, and intended logic for the Stellarcade smart contracts.

> **Note**: These contracts are currently in the implementation phase.

## 1. Prize Pool (`contracts/prize-pool`)

The **Prize Pool** contract is the financial heart of Stellarcade. It acts as a vault for user funds and the source of game payouts.

### Key Features
*   **Deposits & Withdrawals**: Users can deposit tokens to play and withdraw their winnings.
*   **Fee Management**: Automatically deducts a house edge/platform fee from winnings.
*   **Access Control**: Only authorized game contracts can request payouts.

### Public Interface (Planned)

| Function | Arguments | Returns | Description |
| :--- | :--- | :--- | :--- |
| `initialize` | `admin: Address` | `void` | Sets the admin address. |
| `deposit` | `from: Address`, `amount: i128` | `void` | Deposits tokens from a user to the pool. |
| `withdraw` | `to: Address`, `amount: i128` | `void` | Withdraws tokens from the pool to a user. |
| `get_balance` | `user: Address` | `i128` | Returns the user's current balance in the pool. |
| `calculate_payout` | `amount: i128` | `i128` | Helper to calculate payout after fees. |

## 2. Random Generator (`contracts/random-generator`)

The **Random Generator** contract ensures that all game outcomes are provably fair and tamper-proof.

### Key Features
*   **Provably Fair**: Uses a commit-reveal scheme or verifiable random function (VRF) logic.
*   **Verifiable**: Players can verify the fairness of a result using the server seed and their client seed.

### Public Interface (Planned)

| Function | Arguments | Returns | Description |
| :--- | :--- | :--- | :--- |
| `generate_random` | `player: Address`, `client_seed: BytesN<32>` | `BytesN<32>` | Generates a random hash for a game round. |
| `verify_fairness` | `game_id: u32`, `server_seed: BytesN<32>` | `bool` | Verifies if a past game result was fair. |

## 3. Coin Flip (`contracts/coin-flip`)

The **Coin Flip** contract implements the game logic for the classic 50/50 game.

### Key Features
*   **Simple Logic**: Win or lose based on a random outcome.
*   **Integration**: Calls `PrizePool` for funds and `RandomGenerator` for outcomes.

### Public Interface (Planned)

| Function | Arguments | Returns | Description |
| :--- | :--- | :--- | :--- |
| `play` | `player: Address`, `amount: i128`, `choice: u32`, `seed: BytesN<32>` | `void` | Executes a coin flip game. `choice`: 0 (Heads) or 1 (Tails). |
| `get_game_result` | `game_id: u32` | `u32` | Returns the result of a specific game. |

---

## Shared Types (`contracts/shared`)

Common data structures used across contracts:
*   `GameResult`: Enum or Struct defining win/loss status.
*   `GameState`: Enum defining current status (Active, Completed, Disputed).
