use soroban_sdk::{contracttype, Env};

use crate::types::RentalAgreement;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    NextRentalId,
    Rental(u64),
}

pub fn get_next_rental_id(env: &Env) -> u64 {
    env.storage()
        .instance()
        .get(&DataKey::NextRentalId)
        .unwrap_or(1u64)
}

pub fn set_next_rental_id(env: &Env, id: u64) {
    env.storage().instance().set(&DataKey::NextRentalId, &id);
}

pub fn get_rental(env: &Env, rental_id: u64) -> Option<RentalAgreement> {
    env.storage().instance().get(&DataKey::Rental(rental_id))
}

pub fn set_rental(env: &Env, rental: &RentalAgreement) {
    env.storage()
        .instance()
        .set(&DataKey::Rental(rental.rental_id), rental);
}
