#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use crate::storage::{get_gate, has_entered, mark_entered, set_gate};
use crate::types::{Gate, GateStatusSnapshot, ReleaseDelay};

#[contract]
pub struct LobbyGates;

#[contractimpl]
impl LobbyGates {
    /// Configures a new gate with a capacity and a release time. Panics if it
    /// already exists.
    pub fn configure_gate(env: Env, id: u64, capacity: u32, release_time: u64) {
        if capacity == 0 {
            panic!("capacity must be positive");
        }
        if get_gate(&env, id).is_some() {
            panic!("gate already exists");
        }

        set_gate(
            &env,
            id,
            &Gate {
                id,
                capacity,
                occupancy: 0,
                release_time,
                is_paused: false,
            },
        );
    }

    /// Admits a player once the gate is open (released and not paused) and has
    /// remaining capacity. Idempotent per player — re-entering is a no-op.
    pub fn enter(env: Env, id: u64, player: Address) {
        player.require_auth();

        let mut gate = get_gate(&env, id).expect("gate not found");
        if gate.is_paused {
            panic!("gate is paused");
        }
        if env.ledger().timestamp() < gate.release_time {
            panic!("gate is not released yet");
        }
        if gate.occupancy >= gate.capacity {
            panic!("gate is full");
        }
        if has_entered(&env, id, player.clone()) {
            return;
        }

        gate.occupancy += 1;
        set_gate(&env, id, &gate);
        mark_entered(&env, id, player);
    }

    /// Pauses or unpauses a gate.
    pub fn set_paused(env: Env, id: u64, paused: bool) {
        let mut gate = get_gate(&env, id).expect("gate not found");
        gate.is_paused = paused;
        set_gate(&env, id, &gate);
    }

    /// Gate status snapshot; predictable zero-state when the gate is missing.
    pub fn gate_status(env: Env, id: u64) -> GateStatusSnapshot {
        let now = env.ledger().timestamp();

        match get_gate(&env, id) {
            Some(g) => {
                let is_full = g.occupancy >= g.capacity;
                let is_open = !g.is_paused && now >= g.release_time;
                let remaining_slots = g.capacity.saturating_sub(g.occupancy);
                GateStatusSnapshot {
                    gate_exists: true,
                    capacity: g.capacity,
                    occupancy: g.occupancy,
                    remaining_slots,
                    is_open,
                    is_paused: g.is_paused,
                    is_full,
                }
            }
            None => GateStatusSnapshot {
                gate_exists: false,
                capacity: 0,
                occupancy: 0,
                remaining_slots: 0,
                is_open: false,
                is_paused: false,
                is_full: false,
            },
        }
    }

    /// Time remaining until a gate releases.
    pub fn release_delay(env: Env, id: u64) -> ReleaseDelay {
        let now = env.ledger().timestamp();

        match get_gate(&env, id) {
            Some(g) => {
                let is_released = now >= g.release_time;
                let seconds_until_release = if is_released {
                    0
                } else {
                    g.release_time - now
                };
                ReleaseDelay {
                    gate_exists: true,
                    release_time: g.release_time,
                    current_time: now,
                    seconds_until_release,
                    is_released,
                }
            }
            None => ReleaseDelay {
                gate_exists: false,
                release_time: 0,
                current_time: now,
                seconds_until_release: 0,
                is_released: false,
            },
        }
    }
}
