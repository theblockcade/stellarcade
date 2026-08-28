use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Item {
    pub item_id: u64,
    pub merchant: Address,
    pub price: u128,
    pub total_stock: u32,
    pub remaining_stock: u32,
    pub max_per_user: u32,
    pub revenue: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ItemStockSummary {
    pub item_id: u64,
    pub merchant: Address,
    pub price: u128,
    pub total_stock: u32,
    pub remaining_stock: u32,
    pub max_per_user: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DispenseReceipt {
    pub item_id: u64,
    pub buyer: Address,
    pub quantity_requested: u32,
    pub quantity_dispensed: u32,
    pub amount_charged: u128,
    pub amount_refunded: u128,
}
