#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};
use types::{DispenseReceipt, Item, ItemStockSummary};

#[contract]
pub struct EscrowVendingMachineContract;

#[contractimpl]
impl EscrowVendingMachineContract {
    pub fn list_item(
        env: Env,
        merchant: Address,
        item_id: u64,
        price: u128,
        initial_stock: u32,
        max_per_user: u32,
    ) {
        merchant.require_auth();

        if price == 0 {
            panic!("price must be > 0");
        }
        if max_per_user == 0 {
            panic!("max_per_user must be > 0");
        }
        if storage::get_item(&env, item_id).is_some() {
            panic!("item_id already listed");
        }

        let item = Item {
            item_id,
            merchant,
            price,
            total_stock: initial_stock,
            remaining_stock: initial_stock,
            max_per_user,
            revenue: 0,
        };

        storage::set_item(&env, &item);
    }

    /// Purchases up to `quantity` units, capped by remaining stock and the
    /// buyer's remaining per-user allowance. Any requested-but-unfulfillable
    /// units are simply not charged (auto-refund by never taking payment for
    /// them), rather than reverting the whole purchase.
    pub fn purchase_item(env: Env, buyer: Address, item_id: u64, quantity: u32) -> DispenseReceipt {
        buyer.require_auth();

        if quantity == 0 {
            panic!("quantity must be > 0");
        }

        let mut item = storage::get_item(&env, item_id).expect("item not found");

        let already_purchased = storage::get_user_purchases(&env, item_id, &buyer);
        let user_allowance = item.max_per_user.saturating_sub(already_purchased);

        let dispensable = quantity.min(item.remaining_stock).min(user_allowance);

        if dispensable == 0 {
            panic!("no units available: out of stock or per-user limit reached");
        }

        let amount_charged = item.price * (dispensable as u128);
        let requested_amount = item.price * (quantity as u128);
        let amount_refunded = requested_amount - amount_charged;

        item.remaining_stock -= dispensable;
        item.revenue += amount_charged;
        storage::set_item(&env, &item);
        storage::set_user_purchases(&env, item_id, &buyer, already_purchased + dispensable);

        DispenseReceipt {
            item_id,
            buyer,
            quantity_requested: quantity,
            quantity_dispensed: dispensable,
            amount_charged,
            amount_refunded,
        }
    }

    pub fn restock_item(env: Env, merchant: Address, item_id: u64, additional_stock: u32) {
        merchant.require_auth();

        let mut item = storage::get_item(&env, item_id).expect("item not found");
        if item.merchant != merchant {
            panic!("only the listing merchant can restock");
        }
        if additional_stock == 0 {
            panic!("additional_stock must be > 0");
        }

        item.total_stock += additional_stock;
        item.remaining_stock += additional_stock;
        storage::set_item(&env, &item);
    }

    pub fn withdraw_revenue(env: Env, merchant: Address, item_id: u64) -> u128 {
        merchant.require_auth();

        let mut item = storage::get_item(&env, item_id).expect("item not found");
        if item.merchant != merchant {
            panic!("only the listing merchant can withdraw revenue");
        }

        let amount = item.revenue;
        item.revenue = 0;
        storage::set_item(&env, &item);

        amount
    }

    pub fn get_item_inventory(env: Env, item_id: u64) -> ItemStockSummary {
        let item = storage::get_item(&env, item_id).expect("item not found");
        ItemStockSummary {
            item_id: item.item_id,
            merchant: item.merchant,
            price: item.price,
            total_stock: item.total_stock,
            remaining_stock: item.remaining_stock,
            max_per_user: item.max_per_user,
        }
    }
}

#[cfg(test)]
mod test;
