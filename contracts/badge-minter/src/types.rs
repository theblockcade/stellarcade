#![no_std]

use soroban_sdk::{contracttype, Address, Env, String, Vec, BytesN};

// Types for badge-minter contract

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BadgeDefinition {
    pub badge_id: u64,
    pub name: String,
    pub description: String,
    pub max_supply: u64,
    pub mint_price: i128,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MintedSupplySnapshot {
    pub badge_id: u64,
    pub total_minted: u64,
    pub max_supply: u64,
    pub remaining_supply: u64,
    pub is_active: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimEligibilitySnapshot {
    pub user: Address,
    pub badge_id: u64,
    pub is_eligible: bool,
    pub eligibility_reason: String,
    pub mint_price: i128,
    pub can_mint: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UserMintRecord {
    pub user: Address,
    pub badge_id: u64,
    pub minted_at: u64,
    pub quantity: u64,
}

/// Wallet holder summary for a badge-owning address.
///
/// Missing users return zero counts. `last_minted_at` is the largest ledger
/// sequence in the user's mint records, or 0 when no mints are recorded.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct HolderSummary {
    pub user: Address,
    pub configured: bool,
    pub badge_count: u32,
    pub mint_record_count: u32,
    pub total_quantity: u64,
    pub last_minted_at: u64,
}

/// Expiry-risk read model for a badge-owning address.
///
/// Badge definitions currently have no per-badge expiry timestamp, so
/// `expiry_supported = false` and all risk counters are zero. This explicit
/// fallback keeps frontend/backend consumers stable until expiries are added.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ExpiryRiskAccessor {
    pub user: Address,
    pub configured: bool,
    pub expiry_supported: bool,
    pub held_badges: u32,
    pub expiring_badges: u32,
    pub expired_badges: u32,
    pub nearest_expiry_at: u64,
    pub risk_bps: u32,
}
