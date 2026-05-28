#!/bin/bash

CONTRACTS=("payout-checkpoints" "arena-reserves" "badge-claims-v2" "ladder-payouts")
STRUCTS=("PayoutCheckpoints" "ArenaReserves" "BadgeClaimsV2" "LadderPayouts")

for i in "${!CONTRACTS[@]}"; do
    C="${CONTRACTS[$i]}"
    S="${STRUCTS[$i]}"
    
    mkdir -p contracts/$C/src
    
    cat << 'TOML' > contracts/$C/Cargo.toml
[package]
name = "$C"
version = "0.1.0"
edition = "2021"

[dependencies]
soroban-sdk = "20.0.0"

[dev-dependencies]
soroban-sdk = { version = "20.0.0", features = ["testutils"] }
TOML

    # Replace $C inside the generated string manually below using echo
    echo "[package]" > contracts/$C/Cargo.toml
    echo "name = \"$C\"" >> contracts/$C/Cargo.toml
    echo "version = \"0.1.0\"" >> contracts/$C/Cargo.toml
    echo "edition = \"2021\"" >> contracts/$C/Cargo.toml
    echo "" >> contracts/$C/Cargo.toml
    echo "[dependencies]" >> contracts/$C/Cargo.toml
    echo "soroban-sdk = \"20.0.0\"" >> contracts/$C/Cargo.toml
    echo "" >> contracts/$C/Cargo.toml
    echo "[dev-dependencies]" >> contracts/$C/Cargo.toml
    echo "soroban-sdk = { version = \"20.0.0\", features = [\"testutils\"] }" >> contracts/$C/Cargo.toml

    cat << TYPE > contracts/$C/src/types.rs
use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Config {
    pub admin: Address,
    pub is_paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PendingClaimSnapshot {
    pub user: Address,
    pub pending_amount: i128,
    pub is_paused: bool,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RolloverPressure {
    pub total_pressure: i128,
    pub active_users: u32,
    pub timestamp: u64,
}
TYPE

    cat << STOR > contracts/$C/src/storage.rs
use soroban_sdk::{contracttype, Env, Address};
use crate::types::Config;

#[contracttype]
pub enum DataKey {
    Config,
    PendingClaim(Address),
    RolloverPressure,
}

pub fn set_config(env: &Env, config: &Config) {
    env.storage().instance().set(&DataKey::Config, config);
}

pub fn get_config(env: &Env) -> Option<Config> {
    env.storage().instance().get(&DataKey::Config)
}

pub fn set_pending_claim(env: &Env, user: &Address, amount: i128) {
    env.storage().persistent().set(&DataKey::PendingClaim(user.clone()), &amount);
}

pub fn get_pending_claim(env: &Env, user: &Address) -> i128 {
    env.storage().persistent().get(&DataKey::PendingClaim(user.clone())).unwrap_or(0)
}

pub fn set_rollover_pressure(env: &Env, amount: i128) {
    env.storage().instance().set(&DataKey::RolloverPressure, &amount);
}

pub fn get_rollover_pressure(env: &Env) -> i128 {
    env.storage().instance().get(&DataKey::RolloverPressure).unwrap_or(0)
}
STOR

    cat << LIB > contracts/$C/src/lib.rs
#![no_std]

pub mod types;
pub mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env};
use crate::types::{Config, PendingClaimSnapshot, RolloverPressure};
use crate::storage::{get_config, get_pending_claim, get_rollover_pressure as get_rp};

#[contract]
pub struct $S;

#[contractimpl]
impl $S {
    /// Returns a structured snapshot of a user's pending claims.
    /// Handles empty and missing states by returning predictable zeroes.
    pub fn get_pending_claim_snapshot(env: Env, user: Address) -> PendingClaimSnapshot {
        let is_paused = get_config(&env).map(|c| c.is_paused).unwrap_or(true);
        let pending_amount = get_pending_claim(&env, &user);
        
        PendingClaimSnapshot {
            user,
            pending_amount,
            is_paused,
            timestamp: env.ledger().timestamp(),
        }
    }

    /// Returns the current rollover pressure for the system.
    pub fn get_rollover_pressure(env: Env) -> RolloverPressure {
        let total_pressure = get_rp(&env);
        
        RolloverPressure {
            total_pressure,
            active_users: 0,
            timestamp: env.ledger().timestamp(),
        }
    }
}
LIB

    cat << TEST > contracts/$C/src/test.rs
#![cfg(test)]

use soroban_sdk::{Env, Address, testutils::Address as _};
use crate::{$S, ${S}Client};

#[test]
fn test_get_pending_claim_snapshot() {
    let env = Env::default();
    let contract_id = env.register_contract(None, $S);
    let client = ${S}Client::new(&env, &contract_id);
    let user = Address::generate(&env);

    let snapshot = client.get_pending_claim_snapshot(&user);
    assert_eq!(snapshot.pending_amount, 0);
    assert_eq!(snapshot.is_paused, true);
}

#[test]
fn test_get_rollover_pressure() {
    let env = Env::default();
    let contract_id = env.register_contract(None, $S);
    let client = ${S}Client::new(&env, &contract_id);

    let rp = client.get_rollover_pressure();
    assert_eq!(rp.total_pressure, 0);
}
TEST

done
