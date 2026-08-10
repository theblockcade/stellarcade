#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use crate::storage::{get_grant, set_grant};
use crate::types::{AllocationSnapshot, ExhaustionRisk, Grant, GrantAllocationSummary, MilestoneWindow, RiskLevel};

// Utilization thresholds, in basis points (10_000 == fully allocated).
const HIGH_RISK_BPS: u32 = 8_000;
const MEDIUM_RISK_BPS: u32 = 5_000;

#[contract]
pub struct GrantLedger;

#[contractimpl]
impl GrantLedger {
    /// Creates a grant with a fixed budget. Panics if the id already exists.
    pub fn create_grant(env: Env, id: u64, total_budget: i128) {
        if total_budget <= 0 {
            panic!("total_budget must be positive");
        }
        if get_grant(&env, id).is_some() {
            panic!("grant already exists");
        }

        set_grant(
            &env,
            id,
            &Grant {
                id,
                total_budget,
                allocated: 0,
                remaining: total_budget,
                allocation_count: 0,
                is_active: true,
            },
        );
    }

    /// Allocates funds from a grant. Rejects over-allocation so `remaining`
    /// never goes negative.
    pub fn allocate(env: Env, id: u64, amount: i128) {
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let mut grant = get_grant(&env, id).expect("grant not found");
        if !grant.is_active {
            panic!("grant is not active");
        }
        if amount > grant.remaining {
            panic!("allocation exceeds remaining budget");
        }

        grant.allocated += amount;
        grant.remaining -= amount;
        grant.allocation_count += 1;
        set_grant(&env, id, &grant);
    }

    /// Allocation snapshot for a grant; predictable zero-state when missing.
    pub fn allocation_snapshot(env: Env, id: u64) -> AllocationSnapshot {
        match get_grant(&env, id) {
            Some(g) => AllocationSnapshot {
                grant_exists: true,
                total_budget: g.total_budget,
                allocated: g.allocated,
                remaining: g.remaining,
                allocation_count: g.allocation_count,
            },
            None => AllocationSnapshot {
                grant_exists: false,
                total_budget: 0,
                allocated: 0,
                remaining: 0,
                allocation_count: 0,
            },
        }
    }

    /// Exhaustion risk for a grant, derived from utilization (allocated vs.
    /// total budget). A missing grant reports `RiskLevel::Unknown`.
    pub fn exhaustion_risk(env: Env, id: u64) -> ExhaustionRisk {
        match get_grant(&env, id) {
            Some(g) => {
                let utilization_bps: u32 = if g.total_budget == 0 {
                    0
                } else {
                    ((g.allocated * 10_000) / g.total_budget) as u32
                };

                let risk_level = if g.remaining <= 0 || utilization_bps >= 10_000 {
                    RiskLevel::Exhausted
                } else if utilization_bps >= HIGH_RISK_BPS {
                    RiskLevel::High
                } else if utilization_bps >= MEDIUM_RISK_BPS {
                    RiskLevel::Medium
                } else {
                    RiskLevel::Low
                };

                ExhaustionRisk {
                    grant_exists: true,
                    remaining: g.remaining,
                    utilization_bps,
                    risk_level,
                }
            }
            None => ExhaustionRisk {
                grant_exists: false,
                remaining: 0,
                utilization_bps: 0,
                risk_level: RiskLevel::Unknown,
            },
        }
    }

    /// Combined allocation snapshot and risk band in a single call.
    pub fn grant_allocation_summary(env: Env, id: u64) -> GrantAllocationSummary {
        match get_grant(&env, id) {
            Some(g) => {
                let utilization_bps: u32 = if g.total_budget == 0 {
                    0
                } else {
                    ((g.allocated * 10_000) / g.total_budget) as u32
                };
                let risk_level = if g.remaining <= 0 || utilization_bps >= 10_000 {
                    RiskLevel::Exhausted
                } else if utilization_bps >= HIGH_RISK_BPS {
                    RiskLevel::High
                } else if utilization_bps >= MEDIUM_RISK_BPS {
                    RiskLevel::Medium
                } else {
                    RiskLevel::Low
                };
                GrantAllocationSummary {
                    grant_exists: true,
                    is_active: g.is_active,
                    total_budget: g.total_budget,
                    allocated: g.allocated,
                    remaining: g.remaining,
                    allocation_count: g.allocation_count,
                    utilization_bps,
                    risk_level,
                }
            }
            None => GrantAllocationSummary {
                grant_exists: false,
                is_active: false,
                total_budget: 0,
                allocated: 0,
                remaining: 0,
                allocation_count: 0,
                utilization_bps: 0,
                risk_level: RiskLevel::Unknown,
            },
        }
    }

    /// Projects how many more allocations can be made before budget exhaustion,
    /// based on the average per-call allocation so far. Requires at least 2
    /// allocations to produce a meaningful estimate.
    pub fn milestone_window(env: Env, id: u64) -> MilestoneWindow {
        match get_grant(&env, id) {
            Some(g) => {
                let has_estimate = g.allocation_count >= 2;
                let avg_allocation_per_call = if has_estimate {
                    g.allocated / g.allocation_count as i128
                } else {
                    0
                };
                let calls_until_exhaustion =
                    if has_estimate && avg_allocation_per_call > 0 {
                        (g.remaining / avg_allocation_per_call) as u32
                    } else {
                        0
                    };
                MilestoneWindow {
                    grant_exists: true,
                    has_estimate,
                    avg_allocation_per_call,
                    calls_until_exhaustion,
                    remaining: g.remaining,
                }
            }
            None => MilestoneWindow {
                grant_exists: false,
                has_estimate: false,
                avg_allocation_per_call: 0,
                calls_until_exhaustion: 0,
                remaining: 0,
            },
        }
    }
}
