#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{LiquidationBufferSnapshot, PoolTotals, UtilizationSnapshot};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    LiquidationBufferBps,
    PoolTotals,
}

#[contract]
pub struct LendingPool;

#[contractimpl]
impl LendingPool {
    pub fn init(env: Env, admin: Address, liquidation_buffer_bps: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        validate_bps(liquidation_buffer_bps);
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::LiquidationBufferBps, &liquidation_buffer_bps);
    }

    pub fn set_pool_totals(env: Env, admin: Address, total_supplied: i128, total_borrowed: i128) {
        require_admin(&env, &admin);
        assert!(total_supplied >= 0, "Invalid supplied");
        assert!(total_borrowed >= 0, "Invalid borrowed");
        assert!(total_borrowed <= total_supplied, "Borrow exceeds supply");
        storage::set_pool_totals(
            &env,
            &PoolTotals {
                total_supplied,
                total_borrowed,
            },
        );
    }

    pub fn set_liquidation_buffer(env: Env, admin: Address, liquidation_buffer_bps: u32) {
        require_admin(&env, &admin);
        validate_bps(liquidation_buffer_bps);
        env.storage()
            .instance()
            .set(&DataKey::LiquidationBufferBps, &liquidation_buffer_bps);
    }

    /// Uses basis points with floor division (`borrowed * 10_000 / supplied`).
    /// Returns zeroed fields when the pool is not initialized or has no tracked totals yet.
    pub fn utilization_snapshot(env: Env) -> UtilizationSnapshot {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let Some(totals) = storage::get_pool_totals(&env) else {
            return UtilizationSnapshot {
                configured,
                total_supplied: 0,
                total_borrowed: 0,
                available_liquidity: 0,
                utilization_bps: 0,
            };
        };

        let available_liquidity = totals
            .total_supplied
            .checked_sub(totals.total_borrowed)
            .expect("Overflow");
        let utilization_bps = if totals.total_supplied == 0 {
            0
        } else {
            ((totals.total_borrowed * 10_000i128) / totals.total_supplied) as u32
        };

        UtilizationSnapshot {
            configured,
            total_supplied: totals.total_supplied,
            total_borrowed: totals.total_borrowed,
            available_liquidity,
            utilization_bps,
        }
    }

    pub fn liquidation_buffer_snapshot(env: Env) -> LiquidationBufferSnapshot {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let liquidation_buffer_bps = env
            .storage()
            .instance()
            .get(&DataKey::LiquidationBufferBps)
            .unwrap_or(0);
        let has_borrow_exposure = storage::get_pool_totals(&env)
            .map(|totals| totals.total_borrowed > 0)
            .unwrap_or(false);

        LiquidationBufferSnapshot {
            configured,
            liquidation_buffer_bps,
            has_borrow_exposure,
        }
    }
}

fn require_admin(env: &Env, admin: &Address) {
    admin.require_auth();
    let stored: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    assert!(stored == *admin, "Unauthorized");
}

fn validate_bps(value: u32) {
    assert!(value <= 10_000, "Bps out of range");
}

#[cfg(test)]
mod test;
