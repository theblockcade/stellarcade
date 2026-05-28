//! Stellarcade Squad-Roster Contract
//!
//! Manages a squad's player roster with configurable role slots.
//! Exposes a lineup readiness summary and per-role vacancy accessor.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use storage::{DataKey, PERSISTENT_BUMP};
pub use types::*;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Symbol, Vec};

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    SlotNotFound = 4,
    SlotLocked = 5,
    ContractPaused = 6,
    DuplicateRole = 7,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct SquadRosterContract;

#[contractimpl]
impl SquadRosterContract {
    // ── Admin ────────────────────────────────────────────────────────────────

    /// Initialise the contract with an admin address.
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::Roles, &Vec::<Symbol>::new(&env));
        Ok(())
    }

    /// Add a role slot to the roster.
    pub fn add_slot(env: Env, admin: Address, role: Symbol) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        let mut roles: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&DataKey::Roles)
            .unwrap_or(Vec::new(&env));

        // Prevent duplicates
        for r in roles.iter() {
            if r == role {
                return Err(Error::DuplicateRole);
            }
        }

        roles.push_back(role.clone());
        env.storage().instance().set(&DataKey::Roles, &roles);

        let slot = RosterSlot {
            role: role.clone(),
            player: None,
            locked: false,
        };
        env.storage()
            .persistent()
            .set(&DataKey::Slot(role.clone()), &slot);
        env.storage().persistent().extend_ttl(
            &DataKey::Slot(role),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );
        Ok(())
    }

    /// Assign a player to a role slot.
    pub fn assign_player(
        env: Env,
        admin: Address,
        role: Symbol,
        player: Address,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        let mut slot: RosterSlot = env
            .storage()
            .persistent()
            .get(&DataKey::Slot(role.clone()))
            .ok_or(Error::SlotNotFound)?;

        if slot.locked {
            return Err(Error::SlotLocked);
        }

        slot.player = Some(player);
        env.storage()
            .persistent()
            .set(&DataKey::Slot(role.clone()), &slot);
        env.storage().persistent().extend_ttl(
            &DataKey::Slot(role),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );
        Ok(())
    }

    /// Remove a player from a role slot, leaving it vacant.
    pub fn remove_player(env: Env, admin: Address, role: Symbol) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        assert_not_paused(&env)?;

        let mut slot: RosterSlot = env
            .storage()
            .persistent()
            .get(&DataKey::Slot(role.clone()))
            .ok_or(Error::SlotNotFound)?;

        if slot.locked {
            return Err(Error::SlotLocked);
        }

        slot.player = None;
        env.storage()
            .persistent()
            .set(&DataKey::Slot(role.clone()), &slot);
        env.storage().persistent().extend_ttl(
            &DataKey::Slot(role),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );
        Ok(())
    }

    /// Lock or unlock a role slot.
    pub fn set_lock(env: Env, admin: Address, role: Symbol, locked: bool) -> Result<(), Error> {
        require_admin(&env, &admin)?;

        let mut slot: RosterSlot = env
            .storage()
            .persistent()
            .get(&DataKey::Slot(role.clone()))
            .ok_or(Error::SlotNotFound)?;

        slot.locked = locked;
        env.storage()
            .persistent()
            .set(&DataKey::Slot(role.clone()), &slot);
        env.storage().persistent().extend_ttl(
            &DataKey::Slot(role),
            PERSISTENT_BUMP,
            PERSISTENT_BUMP,
        );
        Ok(())
    }

    /// Pause or unpause the contract.
    pub fn set_paused(env: Env, admin: Address, paused: bool) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        env.storage().instance().set(&DataKey::Paused, &paused);
        Ok(())
    }

    // ── Read-only views ──────────────────────────────────────────────────────

    /// Return a summary of lineup readiness.
    ///
    /// Zero-state (no slots registered): all counts 0, `ready` false.
    /// The lineup is `ready` only when every slot is filled and none are locked.
    pub fn lineup_readiness_summary(env: Env) -> LineupReadinessSummary {
        let roles: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&DataKey::Roles)
            .unwrap_or(Vec::new(&env));

        let total_slots = roles.len();
        let mut filled_slots: u32 = 0;
        let mut locked_slots: u32 = 0;

        for role in roles.iter() {
            if let Some(slot) = env
                .storage()
                .persistent()
                .get::<DataKey, RosterSlot>(&DataKey::Slot(role))
            {
                if slot.player.is_some() {
                    filled_slots += 1;
                }
                if slot.locked {
                    locked_slots += 1;
                }
            }
        }

        let vacant_slots = total_slots.saturating_sub(filled_slots);
        let ready = total_slots > 0 && filled_slots == total_slots && locked_slots == 0;

        LineupReadinessSummary {
            total_slots,
            filled_slots,
            vacant_slots,
            locked_slots,
            ready,
        }
    }

    /// Return a coverage snapshot for roster participation.
    ///
    /// Zero-state (no slots registered): all counts 0, `ready` false.
    /// `coverage_bps` is floored basis-point coverage of filled slots over
    /// registered slots.
    pub fn participation_coverage_snapshot(env: Env) -> ParticipationCoverageSnapshot {
        let roles: Vec<Symbol> = env
            .storage()
            .instance()
            .get(&DataKey::Roles)
            .unwrap_or(Vec::new(&env));

        let total_slots = roles.len();
        let mut filled_slots: u32 = 0;
        let mut locked_slots: u32 = 0;

        for role in roles.iter() {
            if let Some(slot) = env
                .storage()
                .persistent()
                .get::<DataKey, RosterSlot>(&DataKey::Slot(role))
            {
                if slot.player.is_some() {
                    filled_slots += 1;
                }
                if slot.locked {
                    locked_slots += 1;
                }
            }
        }

        let coverage_bps = if total_slots > 0 {
            ((filled_slots as u128 * 10_000) / (total_slots as u128)) as u32
        } else {
            0
        };
        let paused = Self::is_paused(&env);
        let ready = total_slots > 0 && filled_slots == total_slots && locked_slots == 0 && !paused;

        ParticipationCoverageSnapshot {
            total_slots,
            filled_slots,
            locked_slots,
            coverage_bps,
            ready,
            paused,
        }
    }

    /// Return vacancy information for a specific role.
    ///
    /// Zero-state: `exists` false when the role has no registered slot.
    pub fn vacancy_for_role(env: Env, role: Symbol) -> RoleVacancy {
        match env
            .storage()
            .persistent()
            .get::<DataKey, RosterSlot>(&DataKey::Slot(role))
        {
            None => RoleVacancy {
                exists: false,
                vacant: false,
                player: None,
            },
            Some(slot) => RoleVacancy {
                exists: true,
                vacant: slot.player.is_none(),
                player: slot.player,
            },
        }
    }

    /// Return the current lock-window state for a specific role.
    ///
    /// Zero-state: `exists` false when the role has no registered slot.
    pub fn lock_window_accessor(env: Env, role: Symbol) -> LockWindowAccessor {
        let paused = Self::is_paused(&env);
        match env
            .storage()
            .persistent()
            .get::<DataKey, RosterSlot>(&DataKey::Slot(role.clone()))
        {
            None => LockWindowAccessor {
                exists: false,
                role,
                locked: false,
                paused,
                can_modify: false,
                player: None,
            },
            Some(slot) => LockWindowAccessor {
                exists: true,
                role,
                locked: slot.locked,
                paused,
                can_modify: !slot.locked && !paused,
                player: slot.player,
            },
        }
    }

    /// Return all registered role names.
    pub fn get_roles(env: Env) -> Vec<Symbol> {
        env.storage()
            .instance()
            .get(&DataKey::Roles)
            .unwrap_or(Vec::new(&env))
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if caller != &admin {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

fn assert_not_paused(env: &Env) -> Result<(), Error> {
    if env
        .storage()
        .instance()
        .get(&DataKey::Paused)
        .unwrap_or(false)
    {
        return Err(Error::ContractPaused);
    }
    Ok(())
}

impl SquadRosterContract {
    fn is_paused(env: &Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod test;
