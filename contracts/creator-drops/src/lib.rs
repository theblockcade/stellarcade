#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    ClaimSaturation, DropConfigInput, DropRecord, DropWindowSnapshot, DropWindowState,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Drop(u64),
}

#[contract]
pub struct CreatorDrops;

#[contractimpl]
impl CreatorDrops {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update a creator drop while preserving existing claim totals.
    /// Supply cannot be reduced below `claimed_supply`, which keeps the
    /// saturation accessor monotonic and storage-safe.
    pub fn upsert_drop(env: Env, admin: Address, drop_id: u64, config: DropConfigInput) {
        require_admin(&env, &admin);
        assert!(config.starts_at < config.ends_at, "Invalid drop window");
        assert!(config.total_supply > 0, "Supply must be positive");

        let mut drop = storage::get_drop(&env, drop_id).unwrap_or(DropRecord {
            drop_id,
            creator: config.creator.clone(),
            starts_at: config.starts_at,
            ends_at: config.ends_at,
            total_supply: config.total_supply,
            claimed_supply: 0,
            claim_count: 0,
            paused: config.paused,
        });

        assert!(
            config.total_supply >= drop.claimed_supply,
            "Supply cannot be reduced below claimed amount"
        );

        drop.creator = config.creator;
        drop.starts_at = config.starts_at;
        drop.ends_at = config.ends_at;
        drop.total_supply = config.total_supply;
        drop.paused = config.paused;

        storage::set_drop(&env, &drop);
    }

    /// Claim units from an open creator drop.
    pub fn claim(env: Env, user: Address, drop_id: u64, quantity: u32) {
        user.require_auth();
        assert!(quantity > 0, "Claim quantity must be positive");

        let now = env.ledger().timestamp();
        let mut drop = storage::get_drop(&env, drop_id).expect("Drop not found");
        assert!(
            read_drop_state(now, &drop) == DropWindowState::Open,
            "Drop is not claimable"
        );

        let remaining_supply = drop
            .total_supply
            .checked_sub(drop.claimed_supply)
            .expect("Drop supply invariant violated");
        assert!(remaining_supply >= quantity, "Drop supply exhausted");

        drop.claimed_supply = drop
            .claimed_supply
            .checked_add(quantity)
            .expect("Claimed supply overflow");
        drop.claim_count = drop
            .claim_count
            .checked_add(1)
            .expect("Claim count overflow");

        storage::set_drop(&env, &drop);
    }

    /// Return a stable drop-window snapshot for `drop_id`.
    ///
    /// Before `init` this returns `configured = false`, `state =
    /// NotConfigured`, `creator = None`, and zeroed supply fields. Unknown ids
    /// after initialization return `exists = false` and `state = Missing`.
    pub fn drop_window_snapshot(env: Env, drop_id: u64) -> DropWindowSnapshot {
        let now = env.ledger().timestamp();
        let configured = is_configured(&env);

        let Some(drop) = storage::get_drop(&env, drop_id) else {
            return DropWindowSnapshot {
                drop_id,
                configured,
                exists: false,
                state: if configured {
                    DropWindowState::Missing
                } else {
                    DropWindowState::NotConfigured
                },
                creator: None,
                now,
                starts_at: 0,
                ends_at: 0,
                total_supply: 0,
                claimed_supply: 0,
                remaining_supply: 0,
                claim_count: 0,
                can_claim: false,
            };
        };

        let remaining_supply = drop
            .total_supply
            .checked_sub(drop.claimed_supply)
            .expect("Drop supply invariant violated");
        let state = read_drop_state(now, &drop);

        DropWindowSnapshot {
            drop_id,
            configured,
            exists: true,
            state,
            creator: Some(drop.creator),
            now,
            starts_at: drop.starts_at,
            ends_at: drop.ends_at,
            total_supply: drop.total_supply,
            claimed_supply: drop.claimed_supply,
            remaining_supply,
            claim_count: drop.claim_count,
            can_claim: state == DropWindowState::Open,
        }
    }

    /// Return a compact claim-saturation view for `drop_id`.
    ///
    /// `saturation_bps` uses floor division in basis points:
    /// `claimed_supply * 10_000 / total_supply`. Missing and zero-state reads
    /// return `saturation_bps = 0`.
    pub fn claim_saturation(env: Env, drop_id: u64) -> ClaimSaturation {
        let snapshot = Self::drop_window_snapshot(env, drop_id);
        if !snapshot.exists {
            return ClaimSaturation {
                drop_id,
                configured: snapshot.configured,
                exists: false,
                paused: false,
                total_supply: 0,
                claimed_supply: 0,
                remaining_supply: 0,
                claim_count: 0,
                saturation_bps: 0,
                can_claim: false,
            };
        }

        let saturation_bps = if snapshot.total_supply == 0 {
            0
        } else {
            u32::try_from(
                (u64::from(snapshot.claimed_supply) * 10_000) / u64::from(snapshot.total_supply),
            )
            .expect("bps overflow")
        };

        ClaimSaturation {
            drop_id,
            configured: snapshot.configured,
            exists: true,
            paused: snapshot.state == DropWindowState::Paused,
            total_supply: snapshot.total_supply,
            claimed_supply: snapshot.claimed_supply,
            remaining_supply: snapshot.remaining_supply,
            claim_count: snapshot.claim_count,
            saturation_bps,
            can_claim: snapshot.can_claim,
        }
    }
}

fn is_configured(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
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

fn read_drop_state(now: u64, drop: &DropRecord) -> DropWindowState {
    if drop.paused {
        DropWindowState::Paused
    } else if drop.claimed_supply >= drop.total_supply {
        DropWindowState::SoldOut
    } else if now < drop.starts_at {
        DropWindowState::Scheduled
    } else if now <= drop.ends_at {
        DropWindowState::Open
    } else {
        DropWindowState::Closed
    }
}

#[cfg(test)]
mod test;
