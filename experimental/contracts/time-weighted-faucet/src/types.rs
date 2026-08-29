//! Shared data types for the time-weighted faucet contract.

use soroban_sdk::contracttype;

/// Read-only external summary of the faucet's global configuration and
/// dispense totals.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FaucetSummary {
    /// Tokens dispensed per successful `request_drip` call.
    pub drip_amount: u128,
    /// Cooldown a recipient must wait between successful drips.
    pub cooldown_sec: u64,
    /// Maximum total tokens the faucet may dispense within a rolling
    /// `cooldown_sec`-independent calendar day counter (see
    /// `daily_dispensed` / `day_index` below).
    pub daily_cap: u128,
    /// Tokens currently held in the faucet reserve (refills add, drips
    /// subtract; bookkeeping-only, see module docs).
    pub reserve_balance: u128,
    /// Total tokens dispensed across the faucet's lifetime.
    pub total_dispensed: u128,
    /// Tokens dispensed so far within the current daily window.
    pub daily_dispensed: u128,
    /// Index of the current daily window (`unix_time / 86_400`).
    pub day_index: u64,
}
