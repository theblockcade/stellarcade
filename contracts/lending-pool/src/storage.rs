use soroban_sdk::Env;

use crate::types::PoolTotals;
use crate::DataKey;

// Storage functions
//
// Only pool-totals accessors live here — `lib.rs` manages Admin and
// LiquidationBufferBps directly via `env.storage().instance()` using its
// own `DataKey` enum, so this module doesn't duplicate that.

pub fn get_pool_totals(env: &Env) -> Option<PoolTotals> {
    env.storage().instance().get(&DataKey::PoolTotals)
}

pub fn set_pool_totals(env: &Env, totals: &PoolTotals) {
    env.storage().instance().set(&DataKey::PoolTotals, totals);
}
