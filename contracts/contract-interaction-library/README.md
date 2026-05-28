# Contract Interaction Library

A reusable on-chain SDK and registry for composable, type-safe cross-contract interaction in StellarCade.

## Overview

This library contract provides three capabilities:

1. **Registry** — store and resolve canonical contract addresses by name, with version tracking and activation state.
2. **Upgrade management** — upgrade a registered contract to a new address while preserving the name-based routing.
3. **Call logging** — emit and persist immutable records of cross-contract call outcomes for auditability.

All other StellarCade contracts can resolve peer addresses through this registry rather than hard-coding addresses, enabling zero-downtime upgrades.

## Public Interface

### Administration

| Method | Caller | Description |
|---|---|---|
| `init(admin)` | Admin | Initialise the library once. |

### Registry

| Method | Caller | Description |
|---|---|---|
| `register_contract(name, address, version)` | Admin | Register a contract under a unique name. |
| `deactivate_contract(name)` | Admin | Mark a contract inactive (keeps record). |
| `upgrade_contract(name, new_address, new_version)` | Admin | Update address + version and reactivate. |
| `get_contract(name) -> ContractEntry` | Anyone | Return full entry. |
| `resolve(name) -> Address` | Anyone | Return address of an active contract. |

### Call Logging

| Method | Caller | Description |
|---|---|---|
| `log_call(callee_name, caller, success) -> u64` | Any contract | Append a call record and return its ID. |
| `get_call_log(log_id) -> CallRecord` | Anyone | Fetch a log entry by ID. |

### Registry-backed typed reads

| Method | Caller | Description |
|---|---|---|
| `read_prize_pool_config(address_registry) -> Result<PrizePoolConfigSnapshot, CoreReadError>` | Anyone | Resolve `prize-pool` from the registry and return its config snapshot. |
| `read_balance_account_summary(address_registry, user) -> Result<AccountSummary, CoreReadError>` | Anyone | Resolve `balance-management` from the registry and return a stable user account summary. |

## ContractEntry Fields

| Field | Type | Description |
|---|---|---|
| `name` | `String` | Unique human-readable identifier (max 32 chars). |
| `address` | `Address` | On-ledger contract address. |
| `version` | `u32` | Caller-supplied semantic version. |
| `active` | `bool` | Whether this entry is currently active. |

## CallRecord Fields

| Field | Type | Description |
|---|---|---|
| `callee_name` | `String` | Name of the called contract. |
| `caller` | `Address` | Originating address. |
| `timestamp` | `u64` | Ledger timestamp of the call. |
| `success` | `bool` | Whether the call succeeded. |

## Storage Schema

| Key | Type | Description |
|---|---|---|
| `Admin` | `Address` | Privileged administrator. |
| `Registry` | `Map<String, ContractEntry>` | Registry by name. |
| `CallCounter` | `u64` | Next log ID. |
| `CallLog` | `Map<u64, CallRecord>` | Immutable call log. |

## Events

| Topic | Data | Description |
|---|---|---|
| `init` | `(admin)` | Contract initialised. |
| `register` | `(name, address, version)` | New contract registered. |
| `deactivate` | `(name)` | Contract deactivated. |
| `logged` | `(id, callee_name, caller, success)` | Call logged. |

## Error Codes

| Code | Meaning |
|---|---|
| `NotInitialized` | `init` not called. |
| `AlreadyInitialized` | Duplicate `init`. |
| `Unauthorized` | Caller not admin. |
| `ContractNotFound` | Name not in registry. |
| `ContractInactive` | Registered but deactivated. |
| `InvalidName` | Empty or >32 char name. |
| `InvalidVersion` | Version is zero. |
| `DuplicateName` | Name already registered. |

## Invariants

- Names are unique; re-registration is rejected.
- Deactivated entries are retained for audit; they cannot be re-registered but can be upgraded.
- Log IDs are monotonically increasing and immutable once written.

## Integration Assumptions

- Other contracts should call `resolve(name)` at invocation time rather than caching addresses to benefit from upgrades.
- `log_call` may be called by any credentialed address — the contract itself performs `caller.require_auth()`.
- Backend services should index the `logged` event stream for off-chain analytics.

## Typed-read integration pattern

- **Address resolution**: callers pass the on-chain address of the Contract Address Registry as `address_registry`.
- **Normalized lookup failures**: helpers return `Result<_, CoreReadError>` so callers can handle registry lookup problems consistently.
- **Thin behavior**: helpers only resolve a contract address and forward a typed read to that target contract; they should not embed application policy.

## Dependencies

- `soroban-sdk` 25.x
- No upstream contract dependencies; this is a foundational library.

## Running Tests

```bash
cd contracts/contract-interaction-library
cargo test
```

Closes #37
