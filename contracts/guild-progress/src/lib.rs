//! Stellarcade Guild Progress Contract
//!
//! Tracks guild progression through milestones with structured metadata accessors.
//! Provides snapshots and next-target information for frontend/backend consumers,
//! with explicit handling of zero-state and unknown-id scenarios.
//!
//! ## Features
//! - **Milestone Coverage Snapshot**: Aggregated progression metadata
//! - **Next-Target Accessor**: Next uncompleted milestone with gap analysis
//! - **Zero-State Handling**: Explicit paths for unknown guilds and missing milestones
//! - **Mutation-Safe Storage**: Preserves invariants through persistent ledger entries

#![no_std]

use soroban_sdk::{contract, contractevent, contractimpl, Address, Env, Vec};

mod types;
mod storage;

use types::{DataKey, Milestone, MilestoneStatus, MilestoneCoverageSnapshot, NextMilestoneTarget};
use storage::{
    compute_milestone_coverage_snapshot, get_guild_milestone_ids, get_guild_progress,
    get_milestone, get_next_milestone_id, get_next_milestone_target, set_guild_milestone_ids,
    set_guild_progress, set_milestone, set_next_milestone_id,
};

// ──────────────────────────────────────────────────────────────
// Events
// ──────────────────────────────────────────────────────────────

#[contractevent]
pub struct MilestoneCreated {
    #[topic]
    pub guild_id: Address,
    pub milestone_id: u32,
    pub target_progress: i128,
    pub reward_amount: i128,
}

#[contractevent]
pub struct ProgressUpdated {
    #[topic]
    pub guild_id: Address,
    pub new_progress: i128,
}

#[contractevent]
pub struct MilestoneCompleted {
    #[topic]
    pub guild_id: Address,
    pub milestone_id: u32,
    pub reward_amount: i128,
}

#[contractevent]
pub struct AdminSet {
    pub admin: Address,
}

// ──────────────────────────────────────────────────────────────
// Contract
// ──────────────────────────────────────────────────────────────

#[contract]
pub struct GuildProgress;

#[contractimpl]
impl GuildProgress {
    /// Initialize the contract with a super admin.
    /// Can only be called once.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Initialized) {
            panic!("Already initialized");
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);

        AdminSet { admin }.publish(&env);
    }

    /// Get the current admin.
    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized")
    }

    /// Create a new milestone for a guild.
    pub fn create_milestone(
        env: Env,
        guild_id: Address,
        target_progress: i128,
        reward_amount: i128,
    ) -> u32 {
        require_admin(&env);

        if target_progress <= 0 {
            panic!("Invalid target progress");
        }

        if reward_amount <= 0 {
            panic!("Invalid reward amount");
        }

        // Get next milestone ID for this guild
        let milestone_id = get_next_milestone_id(&env, &guild_id);

        let milestone = Milestone {
            milestone_id,
            target_progress,
            reward_amount,
            status: MilestoneStatus::NotReached,
        };

        // Store milestone
        set_milestone(&env, &guild_id, milestone_id, &milestone);

        // Add to guild's milestone list
        let mut milestone_ids = get_guild_milestone_ids(&env, &guild_id);
        milestone_ids.push_back(milestone_id);
        set_guild_milestone_ids(&env, &guild_id, &milestone_ids);

        // Increment next milestone ID
        let next_id = milestone_id.checked_add(1).unwrap_or(milestone_id);
        set_next_milestone_id(&env, &guild_id, next_id);

        MilestoneCreated {
            guild_id,
            milestone_id,
            target_progress,
            reward_amount,
        }
        .publish(&env);

        milestone_id
    }

    /// Update guild progress and check for milestone completions.
    pub fn update_progress(env: Env, guild_id: Address, new_progress: i128) {
        require_admin(&env);

        if new_progress < 0 {
            panic!("Invalid progress");
        }

        set_guild_progress(&env, &guild_id, new_progress);

        // Check and mark completed milestones
        let milestone_ids = get_guild_milestone_ids(&env, &guild_id);
        for milestone_id in milestone_ids.iter() {
            if let Some(mut milestone) = get_milestone(&env, &guild_id, milestone_id) {
                if milestone.status != MilestoneStatus::Completed
                    && new_progress >= milestone.target_progress
                {
                    milestone.status = MilestoneStatus::Completed;
                    set_milestone(&env, &guild_id, milestone_id, &milestone);

                    MilestoneCompleted {
                        guild_id: guild_id.clone(),
                        milestone_id,
                        reward_amount: milestone.reward_amount,
                    }
                    .publish(&env);
                }
            }
        }

        ProgressUpdated {
            guild_id,
            new_progress,
        }
        .publish(&env);
    }

    /// Get the current progress for a guild.
    pub fn get_current_progress(env: Env, guild_id: Address) -> i128 {
        get_guild_progress(&env, &guild_id)
    }

    /// Get a snapshot of milestone coverage for a guild.
    /// Returns graceful zero-state if guild unknown.
    pub fn get_milestone_coverage_snapshot(
        env: Env,
        guild_id: Address,
    ) -> MilestoneCoverageSnapshot {
        compute_milestone_coverage_snapshot(&env, &guild_id)
    }

    /// Get the next uncompleted milestone target.
    /// Returns zero/completion state if all milestones done.
    pub fn get_next_milestone_target(env: Env, guild_id: Address) -> NextMilestoneTarget {
        get_next_milestone_target(&env, &guild_id)
    }

    /// List all milestone IDs for a guild (paginated).
    pub fn list_milestones(env: Env, guild_id: Address, start: u32, limit: u32) -> Vec<u32> {
        let all_milestones = get_guild_milestone_ids(&env, &guild_id);
        let total = all_milestones.len();

        let mut result = Vec::new(&env);
        let end = start.saturating_add(limit).min(total);

        for i in start..end {
            if let Some(milestone_id) = all_milestones.get(i) {
                result.push_back(milestone_id);
            }
        }

        result
    }

    /// Get details of a specific milestone.
    pub fn get_milestone_details(
        env: Env,
        guild_id: Address,
        milestone_id: u32,
    ) -> Milestone {
        get_milestone(&env, &guild_id, milestone_id)
            .expect("Milestone not found")
    }
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

fn require_admin(env: &Env) {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    admin.require_auth();
}

#[cfg(test)]
mod test;
