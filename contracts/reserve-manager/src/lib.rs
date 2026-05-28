#![no_std]

mod types;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contractevent, Address, Env, Vec, contracterror};
use crate::types::{ManagerConfig, ReserveState, ReserveStatus, ReserveSnapshot};
use crate::storage::{get_config, set_config, get_assets, set_assets, get_reserve_state, set_reserve_state};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    Paused = 4,
    Overflow = 5,
}

#[contractevent]
pub struct ReserveUpdated {
    #[topic]
    pub asset: Address,
    pub new_balance: i128,
    pub status: ReserveStatus,
}

#[contract]
pub struct ReserveManager;

#[contractimpl]
impl ReserveManager {
    /// Initialize the reserve manager.
    pub fn init(env: Env, admin: Address, treasury: Address) -> Result<(), Error> {
        if get_config(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();

        let config = ManagerConfig {
            admin,
            treasury,
            is_paused: false,
        };
        set_config(&env, &config);
        Ok(())
    }

    /// Set the paused state. Admin only.
    pub fn set_pause(env: Env, paused: bool) -> Result<(), Error> {
        let mut config = get_config(&env).ok_or(Error::NotInitialized)?;
        config.admin.require_auth();
        config.is_paused = paused;
        set_config(&env, &config);
        Ok(())
    }

    /// Update an asset's reserve targets and current balance. Admin only.
    pub fn update_reserve(env: Env, asset: Address, balance: i128, target: i128) -> Result<(), Error> {
        let config = get_config(&env).ok_or(Error::NotInitialized)?;
        if config.is_paused {
            return Err(Error::Paused);
        }
        config.admin.require_auth();

        let mut assets = get_assets(&env);
        if !assets.contains(&asset) {
            assets.push_back(asset.clone());
            set_assets(&env, &assets);
        }

        let status = if balance >= target {
            ReserveStatus::Healthy
        } else if balance >= target / 2 {
            ReserveStatus::BelowTarget
        } else {
            ReserveStatus::Critical
        };

        let state = ReserveState {
            asset: asset.clone(),
            balance,
            target_balance: target,
            status: status.clone(),
            last_audit_ledger: env.ledger().sequence(),
        };

        set_reserve_state(&env, &asset, &state);

        env.events().publish(("reserve", "updated"), ReserveUpdated { asset, new_balance: balance, status });

        Ok(())
    }

    // ─── Public Read-Only Methods ──────────────────────────────────────────

    /// Returns a complete snapshot of all managed reserves.
    ///
    /// # Returns
    /// A `ReserveSnapshot` containing current configuration and states for all tracked assets.
    /// Handles uninitialized state by returning `None` for config and an empty list of reserves.
    pub fn get_full_snapshot(env: Env) -> ReserveSnapshot {
        let config = get_config(&env);
        let assets = get_assets(&env);
        let mut reserves = Vec::new(&env);

        for asset in assets.iter() {
            if let Some(state) = get_reserve_state(&env, &asset) {
                reserves.push_back(state);
            }
        }

        ReserveSnapshot {
            config,
            reserves,
            ledger: env.ledger().sequence(),
        }
    }

    /// Returns the reserve state for a specific asset.
    /// Returns `None` if the asset is not managed.
    pub fn get_reserve_for(env: Env, asset: Address) -> Option<ReserveState> {
        get_reserve_state(&env, &asset)
    }

    /// Returns whether the manager is paused.
    pub fn is_paused(env: Env) -> bool {
        get_config(&env).map(|c| c.is_paused).unwrap_or(true)
    }
}
