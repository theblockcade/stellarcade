use soroban_sdk::{contracttype, Symbol, Vec};
use crate::types::RosterSlot;

pub const PERSISTENT_BUMP: u32 = 518_400; // ~30 days

#[contracttype]
pub enum DataKey {
    Admin,
    /// Vec<Symbol> — ordered list of registered roles.
    Roles,
    /// RosterSlot for a given role.
    Slot(Symbol),
    Paused,
}

pub fn read_slots(env: &soroban_sdk::Env, roles: &Vec<Symbol>) -> Vec<RosterSlot> {
    let mut slots = soroban_sdk::Vec::new(env);
    for role in roles.iter() {
        if let Some(slot) = env
            .storage()
            .persistent()
            .get::<DataKey, RosterSlot>(&DataKey::Slot(role))
        {
            slots.push_back(slot);
        }
    }
    slots
}
