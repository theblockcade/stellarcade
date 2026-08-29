//! Shared data types for the lootbox generator contract.

use soroban_sdk::{contracttype, Address};

/// Weighted rarity tiers.
#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Rarity {
    Common = 0,
    Rare = 1,
    Epic = 2,
    Legendary = 3,
}

/// One row in a drop table.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LootItem {
    pub item_id: u64,
    pub weight: u32,
    pub rarity: Rarity,
}

/// Normalized probability view of a drop-table row (basis points).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TableProbability {
    pub item_id: u64,
    pub weight: u32,
    pub probability_bps: u32,
    pub rarity: Rarity,
}

/// Result of opening a lootbox.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LootResult {
    pub player: Address,
    pub table_id: u64,
    pub item_id: u64,
    pub rarity: Rarity,
}

/// A player inventory stack of one item id.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InventoryEntry {
    pub item_id: u64,
    pub quantity: u32,
}
