#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{
    CreatorEscrowConfig, CreatorEscrowEntry, CreatorEscrowEntryView, CreatorEscrowSummary,
    CreatorEscrowTotals,
};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    GlobalPaused,
    Config(Address),
    Totals(Address),
    NextEntryId(Address),
    Entry(Address, u64),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    CreatorNotConfigured = 4,
    ContractPaused = 5,
    CreatorPaused = 6,
    InvalidAmount = 7,
    Overflow = 8,
    EscrowEntryNotFound = 9,
    NothingToRelease = 10,
}

#[contract]
pub struct CreatorEscrow;

#[contractimpl]
impl CreatorEscrow {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GlobalPaused, &false);
        Ok(())
    }

    pub fn set_paused(env: Env, paused: bool) -> Result<(), Error> {
        Self::require_admin(&env)?;
        env.storage().instance().set(&DataKey::GlobalPaused, &paused);
        Ok(())
    }

    pub fn configure_creator(
        env: Env,
        creator: Address,
        payout_token: Address,
        beneficiary: Address,
        release_delay_ledgers: u32,
    ) -> Result<(), Error> {
        Self::read_admin(&env)?;
        creator.require_auth();

        storage::set_config(
            &env,
            &creator,
            &CreatorEscrowConfig {
                creator: creator.clone(),
                payout_token,
                beneficiary,
                release_delay_ledgers,
                paused: false,
            },
        );

        if storage::get_next_entry_id(&env, &creator) == 0 {
            storage::set_totals(
                &env,
                &creator,
                &CreatorEscrowTotals {
                    total_locked: 0,
                    total_released: 0,
                    pending_entry_count: 0,
                },
            );
        }

        Ok(())
    }

    pub fn set_creator_paused(env: Env, creator: Address, paused: bool) -> Result<(), Error> {
        Self::read_admin(&env)?;
        creator.require_auth();

        let mut config = storage::get_config(&env, &creator).ok_or(Error::CreatorNotConfigured)?;
        config.paused = paused;
        storage::set_config(&env, &creator, &config);
        Ok(())
    }

    pub fn fund_escrow(env: Env, creator: Address, amount: i128) -> Result<u64, Error> {
        Self::require_admin(&env)?;
        Self::ensure_not_globally_paused(&env)?;

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let config = storage::get_config(&env, &creator).ok_or(Error::CreatorNotConfigured)?;
        if config.paused {
            return Err(Error::CreatorPaused);
        }

        let entry_id = storage::get_next_entry_id(&env, &creator);
        let current_ledger = env.ledger().sequence();
        let releasable_at_ledger = current_ledger
            .checked_add(config.release_delay_ledgers)
            .ok_or(Error::Overflow)?;

        storage::set_entry(
            &env,
            &creator,
            &CreatorEscrowEntry {
                entry_id,
                amount,
                created_at_ledger: current_ledger,
                releasable_at_ledger,
                released: false,
            },
        );
        storage::set_next_entry_id(&env, &creator, entry_id.saturating_add(1));

        let mut totals = storage::get_totals(&env, &creator);
        totals.total_locked = totals
            .total_locked
            .checked_add(amount)
            .ok_or(Error::Overflow)?;
        totals.pending_entry_count = totals.pending_entry_count.saturating_add(1);
        storage::set_totals(&env, &creator, &totals);

        Ok(entry_id)
    }

    pub fn release_available(env: Env, creator: Address) -> Result<i128, Error> {
        Self::read_admin(&env)?;
        creator.require_auth();
        Self::ensure_not_globally_paused(&env)?;

        let config = storage::get_config(&env, &creator).ok_or(Error::CreatorNotConfigured)?;
        if config.paused {
            return Err(Error::CreatorPaused);
        }

        let current_ledger = env.ledger().sequence();
        let next_entry_id = storage::get_next_entry_id(&env, &creator);
        let mut released_total = 0_i128;
        let mut released_count = 0_u32;

        for entry_id in 0..next_entry_id {
            if let Some(mut entry) = storage::get_entry(&env, &creator, entry_id) {
                if !entry.released && entry.releasable_at_ledger <= current_ledger {
                    entry.released = true;
                    released_total = released_total
                        .checked_add(entry.amount)
                        .ok_or(Error::Overflow)?;
                    released_count = released_count.saturating_add(1);
                    storage::set_entry(&env, &creator, &entry);
                }
            }
        }

        if released_total == 0 {
            return Err(Error::NothingToRelease);
        }

        let mut totals = storage::get_totals(&env, &creator);
        totals.total_released = totals
            .total_released
            .checked_add(released_total)
            .ok_or(Error::Overflow)?;
        totals.pending_entry_count = totals
            .pending_entry_count
            .checked_sub(released_count)
            .ok_or(Error::Overflow)?;
        storage::set_totals(&env, &creator, &totals);

        Ok(released_total)
    }

    pub fn creator_summary(env: Env, creator: Address) -> CreatorEscrowSummary {
        let config = storage::get_config(&env, &creator);
        let next_entry_id = storage::get_next_entry_id(&env, &creator);
        let global_paused = Self::is_globally_paused(&env);

        let Some(config) = config else {
            return CreatorEscrowSummary {
                creator,
                exists: false,
                paused: global_paused,
                payout_token: None,
                beneficiary: None,
                release_delay_ledgers: 0,
                total_locked: 0,
                total_released: 0,
                releasable_now: 0,
                pending_entry_count: 0,
                next_entry_id,
            };
        };

        let totals = storage::get_totals(&env, &creator);
        let current_ledger = env.ledger().sequence();
        let mut releasable_now = 0_i128;

        for entry_id in 0..next_entry_id {
            if let Some(entry) = storage::get_entry(&env, &creator, entry_id) {
                if !entry.released && entry.releasable_at_ledger <= current_ledger {
                    releasable_now = releasable_now.saturating_add(entry.amount);
                }
            }
        }

        CreatorEscrowSummary {
            creator,
            exists: true,
            paused: global_paused || config.paused,
            payout_token: Some(config.payout_token),
            beneficiary: Some(config.beneficiary),
            release_delay_ledgers: config.release_delay_ledgers,
            total_locked: totals.total_locked,
            total_released: totals.total_released,
            releasable_now,
            pending_entry_count: totals.pending_entry_count,
            next_entry_id,
        }
    }

    pub fn escrow_entry(env: Env, creator: Address, entry_id: u64) -> CreatorEscrowEntryView {
        let global_paused = Self::is_globally_paused(&env);
        let config = storage::get_config(&env, &creator);
        let paused = global_paused || config.as_ref().map(|value| value.paused).unwrap_or(false);

        let Some(entry) = storage::get_entry(&env, &creator, entry_id) else {
            return CreatorEscrowEntryView {
                creator,
                entry_id,
                exists: false,
                paused,
                amount: 0,
                created_at_ledger: 0,
                releasable_at_ledger: 0,
                released: false,
                releasable_now: false,
            };
        };

        let current_ledger = env.ledger().sequence();
        CreatorEscrowEntryView {
            creator,
            entry_id,
            exists: true,
            paused,
            amount: entry.amount,
            created_at_ledger: entry.created_at_ledger,
            releasable_at_ledger: entry.releasable_at_ledger,
            released: entry.released,
            releasable_now: !entry.released && entry.releasable_at_ledger <= current_ledger,
        }
    }

    fn read_admin(env: &Env) -> Result<Address, Error> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }

    fn require_admin(env: &Env) -> Result<Address, Error> {
        let admin = Self::read_admin(env)?;
        admin.require_auth();
        Ok(admin)
    }

    fn is_globally_paused(env: &Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::GlobalPaused)
            .unwrap_or(false)
    }

    fn ensure_not_globally_paused(env: &Env) -> Result<(), Error> {
        if Self::is_globally_paused(env) {
            return Err(Error::ContractPaused);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test;
