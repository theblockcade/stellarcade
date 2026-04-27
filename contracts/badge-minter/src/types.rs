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
