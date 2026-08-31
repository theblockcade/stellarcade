use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ItemCategory {
    Cosmetic,
    PowerUp,
    Badge,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RegisteredItem {
    pub item_id: String,
    pub category: ItemCategory,
    pub metadata_uri: String,
    pub supported_games: Vec<Address>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct InventoryItemSummary {
    pub item_id: String,
    pub quantity: u32,
}
