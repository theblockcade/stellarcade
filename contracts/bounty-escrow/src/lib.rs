#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec};

use types::{
    BountyRecord, BountyStatus, BountySummary, BountyStatusView, BountyView, OptionalBountyStatus,
    PlatformConfigView,
};

pub const BUMP_AMOUNT: u32 = 518_400;
pub const LIFETIME_THRESHOLD: u32 = 259_200;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Token,
    FeeBps,
    NextBountyId,
    AllIds,
    Bounty(u64),
    PosterIndex(Address),
}

#[contract]
pub struct BountyEscrow;

#[contractimpl]
impl BountyEscrow {
    /// Initialize the contract. Panics if already initialized.
    pub fn init(env: Env, admin: Address, token: Address, fee_bps: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage()
            .instance()
            .set(&DataKey::NextBountyId, &1u64);
    }

    /// Post a new bounty. Validates inputs, assigns an ID, and writes to storage.
    pub fn post_bounty(
        env: Env,
        poster: Address,
        reward: i128,
        expiry_ledger: u32,
        description: Symbol,
    ) -> u64 {
        if reward <= 0 {
            panic!("reward must be > 0");
        }
        if expiry_ledger <= env.ledger().sequence() {
            panic!("expiry_ledger must be in the future");
        }

        let bounty_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextBountyId)
            .unwrap_or(1u64);

        env.storage()
            .instance()
            .set(&DataKey::NextBountyId, &(bounty_id + 1));

        let record = BountyRecord {
            bounty_id,
            poster: poster.clone(),
            reward,
            status: BountyStatus::Open,
            expiry_ledger,
            description,
        };

        storage::set_bounty(&env, &record);
        storage::push_bounty_id(&env, bounty_id);
        storage::push_poster_index(&env, &poster, bounty_id);

        bounty_id
    }

    /// Update the status of an existing bounty. Admin-only.
    pub fn update_bounty_status(
        env: Env,
        admin: Address,
        bounty_id: u64,
        new_status: BountyStatus,
    ) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("contract not initialized");

        if admin != stored_admin {
            panic!("unauthorized");
        }

        let mut record = storage::get_bounty(&env, bounty_id).expect("bounty not found");
        record.status = new_status;
        storage::set_bounty(&env, &record);
    }

    // ── Read-only methods ──────────────────────────────────────────────────────

    /// Return the full state of a single bounty. No auth required.
    /// Returns a zero-state `BountyView` (exists: false) when the ID is unknown.
    pub fn get_bounty(env: Env, bounty_id: u64) -> BountyView {
        match storage::get_bounty(&env, bounty_id) {
            Some(r) => BountyView {
                bounty_id,
                exists: true,
                poster: Some(r.poster),
                reward: Some(r.reward),
                status: OptionalBountyStatus::Some(r.status),
                expiry_ledger: Some(r.expiry_ledger),
                description: Some(r.description),
            },
            None => BountyView {
                bounty_id,
                exists: false,
                poster: None,
                reward: None,
                status: OptionalBountyStatus::None,
                expiry_ledger: None,
                description: None,
            },
        }
    }

    /// Return all bounties posted by `poster`. No auth required.
    /// Returns an empty vec when the poster has no bounties.
    pub fn get_bounties_by_poster(env: Env, poster: Address) -> Vec<BountyView> {
        let ids = storage::get_poster_index(&env, &poster);
        let mut views: Vec<BountyView> = Vec::new(&env);
        for id in ids.iter() {
            views.push_back(Self::get_bounty(env.clone(), id));
        }
        views
    }

    /// Return the status of a single bounty. No auth required.
    /// Returns a zero-state `BountyStatusView` (exists: false) when the ID is unknown.
    pub fn get_bounty_status(env: Env, bounty_id: u64) -> BountyStatusView {
        match storage::get_bounty(&env, bounty_id) {
            Some(r) => BountyStatusView {
                bounty_id,
                exists: true,
                status: OptionalBountyStatus::Some(r.status),
            },
            None => BountyStatusView {
                bounty_id,
                exists: false,
                status: OptionalBountyStatus::None,
            },
        }
    }

    /// Return the current platform configuration. No auth required.
    /// Returns `initialized: false` when the contract has not been initialized.
    pub fn get_platform_config(env: Env) -> PlatformConfigView {
        let storage = env.storage().instance();
        match storage.get::<DataKey, Address>(&DataKey::Admin) {
            Some(admin) => {
                let token: Address = storage.get(&DataKey::Token).unwrap();
                let fee_bps: u32 = storage.get(&DataKey::FeeBps).unwrap();
                PlatformConfigView {
                    initialized: true,
                    admin: Some(admin),
                    token: Some(token),
                    fee_bps: Some(fee_bps),
                }
            }
            None => PlatformConfigView {
                initialized: false,
                admin: None,
                token: None,
                fee_bps: None,
            },
        }
    }

    /// Return aggregate statistics across all bounties. No auth required.
    /// Returns an all-zero `BountySummary` when no bounties exist.
    pub fn get_bounty_summary(env: Env) -> BountySummary {
        let ids = storage::get_all_ids(&env);
        let mut open_count: u64 = 0;
        let mut paused_count: u64 = 0;
        let mut completed_count: u64 = 0;
        let mut cancelled_count: u64 = 0;
        let mut total_escrowed: i128 = 0;

        for id in ids.iter() {
            if let Some(record) = storage::get_bounty(&env, id) {
                match record.status {
                    BountyStatus::Open => {
                        open_count = open_count.saturating_add(1);
                        total_escrowed = total_escrowed.saturating_add(record.reward);
                    }
                    BountyStatus::Paused => {
                        paused_count = paused_count.saturating_add(1);
                        total_escrowed = total_escrowed.saturating_add(record.reward);
                    }
                    BountyStatus::Completed => {
                        completed_count = completed_count.saturating_add(1);
                    }
                    BountyStatus::Cancelled => {
                        cancelled_count = cancelled_count.saturating_add(1);
                    }
                }
            }
        }

        BountySummary {
            open_count,
            paused_count,
            completed_count,
            cancelled_count,
            total_escrowed,
        }
    }
}

#[cfg(test)]
mod test;
