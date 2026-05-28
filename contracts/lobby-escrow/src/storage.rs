use soroban_sdk::{Address, Env};

use crate::{
    types::{EscrowConfig, ParticipantStake},
    DataKey,
};

pub fn get_escrow(env: &Env, escrow_id: u32) -> Option<EscrowConfig> {
    env.storage().persistent().get(&DataKey::Escrow(escrow_id))
}

pub fn set_escrow(env: &Env, escrow: &EscrowConfig) {
    env.storage()
        .persistent()
        .set(&DataKey::Escrow(escrow.escrow_id), escrow);
}

pub fn get_stake(
    env: &Env,
    escrow_id: u32,
    participant: &Address,
) -> Option<ParticipantStake> {
    env.storage()
        .persistent()
        .get(&DataKey::Stake(escrow_id, participant.clone()))
}

pub fn set_stake(
    env: &Env,
    participant: &Address,
    stake: &ParticipantStake,
) {
    env.storage()
        .persistent()
        .set(&DataKey::Stake(stake.escrow_id, participant.clone()), stake);
}
