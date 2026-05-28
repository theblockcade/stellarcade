#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec};

pub use types::{RosterSummary, PendingInviteSnapshot};

const BUMP_AMOUNT: u32 = 518_400;
const LIFETIME_THRESHOLD: u32 = BUMP_AMOUNT / 2;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
}

#[contract]
pub struct ClanRegistry;

#[contractimpl]
impl ClanRegistry {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    /// Returns a summary of clan rosters.
    pub fn roster_summary(env: Env) -> RosterSummary {
        // For now, return empty state - this would be populated with actual clan data
        RosterSummary {
            total_clans: 0,
            total_members: 0,
            active_clans: 0,
        }
    }

    /// Returns a snapshot of pending invites.
    pub fn pending_invite_snapshot(env: Env) -> PendingInviteSnapshot {
        // For now, return empty state - this would be populated with actual invite data
        PendingInviteSnapshot {
            total_pending_invites: 0,
            expiring_soon: 0,
            pending_addresses: Vec::new(&env),
        }
    }
}

#[cfg(test)]
mod test;