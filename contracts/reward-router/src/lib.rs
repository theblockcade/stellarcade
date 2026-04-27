#![no_std]

mod storage;
mod types;
#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, Symbol};
pub use types::{RouteImbalanceSummary, FallbackBucket, RouteData};

#[contract]
pub struct RewardRouter;

#[contractimpl]
impl RewardRouter {
    /// Initialize the contract with an admin.
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_some() {
            panic!("Already initialized");
        }
        storage::set_admin(&env, &admin);
    }

    /// Return the imbalance summary for a specific route.
    /// If the route does not exist, returns a zeroed summary.
    pub fn route_imbalance_summary(env: Env, route_id: Symbol) -> RouteImbalanceSummary {
        let route = storage::get_route(&env, &route_id).unwrap_or(RouteData {
            allocated: 0,
            routed: 0,
        });

        let imbalance = route.allocated - route.routed;
        
        RouteImbalanceSummary {
            route_id,
            total_allocated: route.allocated,
            total_routed: route.routed,
            imbalance,
            is_balanced: imbalance == 0,
        }
    }

    /// Return the fallback bucket details.
    /// Returns None if fallback is not configured.
    pub fn fallback_bucket(env: Env) -> Option<FallbackBucket> {
        storage::get_fallback(&env)
    }

    /// Configure the fallback bucket. Admin only.
    pub fn set_fallback(env: Env, admin: Address, bucket_address: Address) {
        admin.require_auth();
        let stored_admin = storage::get_admin(&env).expect("Not initialized");
        assert!(admin == stored_admin, "Unauthorized");

        let current = storage::get_fallback(&env).unwrap_or(FallbackBucket {
            bucket_address: bucket_address.clone(),
            total_collected: 0,
            last_fallback_ledger: 0,
        });

        storage::set_fallback(&env, &FallbackBucket {
            bucket_address,
            total_collected: current.total_collected,
            last_fallback_ledger: env.ledger().sequence(),
        });
    }

    /// Add or update a route's allocation. Admin only.
    pub fn update_route(env: Env, admin: Address, route_id: Symbol, allocated: i128) {
        admin.require_auth();
        let stored_admin = storage::get_admin(&env).expect("Not initialized");
        assert!(admin == stored_admin, "Unauthorized");

        let mut route = storage::get_route(&env, &route_id).unwrap_or(RouteData {
            allocated: 0,
            routed: 0,
        });

        route.allocated = allocated;
        storage::set_route(&env, &route_id, &route);
    }

    /// Route a reward. Updates routed amount or collects in fallback if route missing.
    pub fn route_reward(env: Env, route_id: Symbol, amount: i128) {
        if let Some(mut route) = storage::get_route(&env, &route_id) {
            route.routed += amount;
            storage::set_route(&env, &route_id, &route);
        } else if let Some(mut fallback) = storage::get_fallback(&env) {
            fallback.total_collected += amount;
            fallback.last_fallback_ledger = env.ledger().sequence();
            storage::set_fallback(&env, &fallback);
        }
    }
}
