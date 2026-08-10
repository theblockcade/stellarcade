#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    ContentsAvailabilitySnapshot, CrateAvailabilitySnapshot, CrateAvailabilityState, CrateData,
    OpenCooldownAccessor, RarityDistributionSnapshot,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Crate(u64),
}

#[contract]
pub struct LootCrate;

#[contractimpl]
impl LootCrate {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    #[allow(clippy::too_many_arguments)]
    pub fn upsert_crate(
        env: Env,
        admin: Address,
        crate_id: u64,
        total_supply: u32,
        minted_supply: u32,
        paused: bool,
        common_count: u32,
        rare_count: u32,
        epic_count: u32,
        legendary_count: u32,
    ) {
        require_admin(&env, &admin);
        assert!(minted_supply <= total_supply, "Mint exceeds supply");
        let rarity_sum = common_count + rare_count + epic_count + legendary_count;
        assert!(rarity_sum > 0, "Empty rarity config");

        storage::set_crate(
            &env,
            &CrateData {
                crate_id,
                total_supply,
                minted_supply,
                paused,
                common_count,
                rare_count,
                epic_count,
                legendary_count,
            },
        );
    }

    pub fn crate_availability_snapshot(env: Env, crate_id: u64) -> CrateAvailabilitySnapshot {
        let Some(crate_data) = storage::get_crate(&env, crate_id) else {
            return CrateAvailabilitySnapshot {
                crate_id,
                exists: false,
                state: CrateAvailabilityState::Missing,
                total_supply: 0,
                minted_supply: 0,
                remaining_supply: 0,
            };
        };

        let remaining_supply = crate_data.total_supply - crate_data.minted_supply;
        let state = if crate_data.paused {
            CrateAvailabilityState::Paused
        } else if remaining_supply == 0 {
            CrateAvailabilityState::SoldOut
        } else {
            CrateAvailabilityState::Available
        };

        CrateAvailabilitySnapshot {
            crate_id,
            exists: true,
            state,
            total_supply: crate_data.total_supply,
            minted_supply: crate_data.minted_supply,
            remaining_supply,
        }
    }

    /// Returns rarity percentages in basis points with floor division.
    /// Missing crates and empty rarity configs return zeroed values.
    pub fn rarity_distribution_snapshot(env: Env, crate_id: u64) -> RarityDistributionSnapshot {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let Some(crate_data) = storage::get_crate(&env, crate_id) else {
            return RarityDistributionSnapshot {
                crate_id,
                exists: false,
                configured,
                common_bps: 0,
                rare_bps: 0,
                epic_bps: 0,
                legendary_bps: 0,
            };
        };

        let total = crate_data.common_count
            + crate_data.rare_count
            + crate_data.epic_count
            + crate_data.legendary_count;
        if total == 0 {
            return RarityDistributionSnapshot {
                crate_id,
                exists: true,
                configured,
                common_bps: 0,
                rare_bps: 0,
                epic_bps: 0,
                legendary_bps: 0,
            };
        }

        RarityDistributionSnapshot {
            crate_id,
            exists: true,
            configured,
            common_bps: (crate_data.common_count * 10_000) / total,
            rare_bps: (crate_data.rare_count * 10_000) / total,
            epic_bps: (crate_data.epic_count * 10_000) / total,
            legendary_bps: (crate_data.legendary_count * 10_000) / total,
        }
    }

    /// Returns a combined contents-availability snapshot with supply and rarity data.
    ///
    /// `openable` is true when the crate exists, is not paused, and has remaining supply.
    /// Missing crates return zeroed rarity breakdowns and `openable = false`.
    pub fn contents_availability_snapshot(env: Env, crate_id: u64) -> ContentsAvailabilitySnapshot {
        let Some(crate_data) = storage::get_crate(&env, crate_id) else {
            return ContentsAvailabilitySnapshot {
                crate_id,
                exists: false,
                state: CrateAvailabilityState::Missing,
                openable: false,
                total_supply: 0,
                minted_supply: 0,
                remaining_supply: 0,
                common_bps: 0,
                rare_bps: 0,
                epic_bps: 0,
                legendary_bps: 0,
            };
        };

        let remaining_supply = crate_data.total_supply - crate_data.minted_supply;
        let state = if crate_data.paused {
            CrateAvailabilityState::Paused
        } else if remaining_supply == 0 {
            CrateAvailabilityState::SoldOut
        } else {
            CrateAvailabilityState::Available
        };
        let openable = state == CrateAvailabilityState::Available;

        let total_items = crate_data.common_count
            + crate_data.rare_count
            + crate_data.epic_count
            + crate_data.legendary_count;
        let (common_bps, rare_bps, epic_bps, legendary_bps) = if total_items == 0 {
            (0, 0, 0, 0)
        } else {
            (
                (crate_data.common_count * 10_000) / total_items,
                (crate_data.rare_count * 10_000) / total_items,
                (crate_data.epic_count * 10_000) / total_items,
                (crate_data.legendary_count * 10_000) / total_items,
            )
        };

        ContentsAvailabilitySnapshot {
            crate_id,
            exists: true,
            state,
            openable,
            total_supply: crate_data.total_supply,
            minted_supply: crate_data.minted_supply,
            remaining_supply,
            common_bps,
            rare_bps,
            epic_bps,
            legendary_bps,
        }
    }

    /// Returns an open-cooldown accessor for a crate.
    ///
    /// Callers supply `last_opened_at` (their own last open timestamp) and
    /// `cooldown_seconds`. `ready` is true when `now >= last_opened_at + cooldown_seconds`
    /// and the crate is openable. Zero `cooldown_seconds` disables the cooldown.
    pub fn open_cooldown_accessor(
        env: Env,
        crate_id: u64,
        last_opened_at: u64,
        cooldown_seconds: u64,
    ) -> OpenCooldownAccessor {
        let now = env.ledger().timestamp();

        let crate_opt = storage::get_crate(&env, crate_id);
        let exists = crate_opt.is_some();
        let openable = crate_opt.map_or(false, |c| !c.paused && c.total_supply > c.minted_supply);

        let cooldown_expires_at = last_opened_at.saturating_add(cooldown_seconds);
        let cooldown_cleared = cooldown_seconds == 0 || now >= cooldown_expires_at;
        let ready = exists && openable && cooldown_cleared;

        OpenCooldownAccessor {
            crate_id,
            exists,
            openable,
            last_opened_at,
            cooldown_seconds,
            cooldown_expires_at,
            ready,
            now,
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

#[cfg(test)]
mod test;
