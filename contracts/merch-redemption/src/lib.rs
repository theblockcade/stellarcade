#![no_std]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env, Symbol};

use crate::storage::get_claim_window;
pub use types::{ClaimWindowSnapshot, ClaimWindowState, StockPressure, StockPressureLevel};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    ClaimWindow(Symbol),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
}

#[contract]
pub struct MerchRedemption;

#[contractimpl]
impl MerchRedemption {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Returns a structured claim-window snapshot for one merch item.
    ///
    /// Empty/missing behavior:
    /// - Unknown or not-yet-configured `item_id` returns `configured = false` and zero-value fields.
    pub fn claim_window_snapshot(env: Env, item_id: Symbol) -> ClaimWindowSnapshot {
        let maybe_state = get_claim_window(&env, &item_id);
        let now = env.ledger().timestamp();

        match maybe_state {
            Some(state) => {
                let remaining_stock = state.total_available.saturating_sub(state.claimed_count);
                let is_active = now >= state.start_time
                    && (state.end_time == 0 || now <= state.end_time)
                    && remaining_stock > 0;

                ClaimWindowSnapshot {
                    item_id,
                    configured: true,
                    is_active,
                    start_time: state.start_time,
                    end_time: state.end_time,
                    total_available: state.total_available,
                    claimed_count: state.claimed_count,
                    remaining_stock,
                }
            }
            None => ClaimWindowSnapshot {
                item_id,
                configured: false,
                is_active: false,
                start_time: 0,
                end_time: 0,
                total_available: 0,
                claimed_count: 0,
                remaining_stock: 0,
            },
        }
    }

    /// Returns stock pressure for one merch item using tracked claim-window aggregates.
    ///
    /// Zero-value conventions:
    /// - Unknown or not-yet-configured `item_id` returns `configured = false`,
    ///   `pressure_bps = 0`, and `pressure_level = None`.
    /// - `pressure_bps` is always clamped to `0..=10000`.
    pub fn stock_pressure(env: Env, item_id: Symbol) -> StockPressure {
        let snapshot = Self::claim_window_snapshot(env, item_id.clone());

        if !snapshot.configured || snapshot.total_available == 0 {
            return StockPressure {
                item_id,
                configured: false,
                claim_window_open: false,
                total_available: 0,
                claimed_count: 0,
                remaining_stock: 0,
                pressure_bps: 0,
                pressure_level: StockPressureLevel::None,
            };
        }

        let raw_bps = (snapshot.claimed_count as u128)
            .saturating_mul(10_000)
            .saturating_div(snapshot.total_available as u128);
        let pressure_bps = core::cmp::min(raw_bps, 10_000) as u32;

        let pressure_level = if pressure_bps >= 9_000 || snapshot.remaining_stock == 0 {
            StockPressureLevel::High
        } else if pressure_bps >= 7_000 {
            StockPressureLevel::Medium
        } else if pressure_bps >= 4_000 {
            StockPressureLevel::Low
        } else {
            StockPressureLevel::None
        };

        StockPressure {
            item_id,
            configured: true,
            claim_window_open: snapshot.is_active,
            total_available: snapshot.total_available,
            claimed_count: snapshot.claimed_count,
            remaining_stock: snapshot.remaining_stock,
            pressure_bps,
            pressure_level,
        }
    }
}
