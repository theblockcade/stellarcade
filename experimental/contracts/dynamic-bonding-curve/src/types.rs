//! Shared data types for the dynamic bonding curve contract.

use soroban_sdk::contracttype;

/// Read-only snapshot of the pool.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolStatusSummary {
    /// Whole tokens currently minted.
    pub supply: u128,
    /// Deposit units held in reserve; always equals the discrete integral
    /// of the curve from 0 to `supply`.
    pub reserve: u128,
    /// Price of the next token to be minted: `m * (supply + 1)^k`.
    pub spot_price: u128,
    /// `reserve / (spot_price * supply)` in basis points (0 when supply
    /// is zero). Approaches `10_000 / (k + 1)` as supply grows.
    pub reserve_ratio_bps: u128,
    /// Curve slope coefficient `m`.
    pub slope: u128,
    /// Curve exponent `k`.
    pub exponent: u32,
}
