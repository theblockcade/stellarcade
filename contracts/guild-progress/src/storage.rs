use soroban_sdk::{Address, Env, Vec};
use crate::types::{
    DataKey, Milestone, MilestoneCoverageSnapshot, MilestoneStatus, NextMilestoneTarget,
};

/// Get current progress for a guild.
/// Returns 0 if guild not found.
pub fn get_guild_progress(env: &Env, guild_id: &Address) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::GuildProgress(guild_id.clone()))
        .unwrap_or(0)
}

/// Set guild progress.
pub fn set_guild_progress(env: &Env, guild_id: &Address, progress: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::GuildProgress(guild_id.clone()), &progress);
}

/// Get a milestone by guild and milestone_id.
/// Returns None if not found.
pub fn get_milestone(env: &Env, guild_id: &Address, milestone_id: u32) -> Option<Milestone> {
    env.storage()
        .persistent()
        .get(&DataKey::Milestone(guild_id.clone(), milestone_id))
}

/// Store a milestone.
pub fn set_milestone(env: &Env, guild_id: &Address, milestone_id: u32, milestone: &Milestone) {
    env.storage()
        .persistent()
        .set(&DataKey::Milestone(guild_id.clone(), milestone_id), milestone);
}

/// Get all milestone IDs for a guild.
/// Returns empty vec if guild has no milestones.
pub fn get_guild_milestone_ids(env: &Env, guild_id: &Address) -> Vec<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::GuildMilestones(guild_id.clone()))
        .unwrap_or_else(|| Vec::new(env))
}

/// Store the milestone ID list for a guild.
pub fn set_guild_milestone_ids(env: &Env, guild_id: &Address, milestone_ids: &Vec<u32>) {
    env.storage()
        .persistent()
        .set(&DataKey::GuildMilestones(guild_id.clone()), milestone_ids);
}

/// Get next milestone ID counter for a guild.
pub fn get_next_milestone_id(env: &Env, guild_id: &Address) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::NextMilestoneId(guild_id.clone()))
        .unwrap_or(1)
}

/// Set next milestone ID counter for a guild.
pub fn set_next_milestone_id(env: &Env, guild_id: &Address, next_id: u32) {
    env.storage()
        .persistent()
        .set(&DataKey::NextMilestoneId(guild_id.clone()), &next_id);
}

/// Compute milestone coverage snapshot for a guild.
/// Handles zero-state and unknown-guild scenarios explicitly.
pub fn compute_milestone_coverage_snapshot(
    env: &Env,
    guild_id: &Address,
) -> MilestoneCoverageSnapshot {
    let milestone_ids = get_guild_milestone_ids(env, guild_id);
    let current_progress = get_guild_progress(env, guild_id);

    if milestone_ids.is_empty() {
        // Unknown/zero-state guild
        return MilestoneCoverageSnapshot {
            guild_id: guild_id.clone(),
            current_progress,
            total_milestones: 0,
            completed_milestones: 0,
            progress_percentage: 0,
            last_completed_milestone_id: 0,
        };
    }

    let mut completed_milestones: u32 = 0;
    let mut last_completed_milestone_id: u32 = 0;

    for milestone_id in milestone_ids.iter() {
        if let Some(milestone) = get_milestone(env, guild_id, milestone_id) {
            if milestone.status == MilestoneStatus::Completed {
                completed_milestones += 1;
                last_completed_milestone_id = milestone_id;
            }
        }
    }

    let total = milestone_ids.len();
    let progress_percentage = if total > 0 {
        ((completed_milestones as u128 * 100) / (total as u128)) as u32
    } else {
        0
    };

    MilestoneCoverageSnapshot {
        guild_id: guild_id.clone(),
        current_progress,
        total_milestones: total,
        completed_milestones,
        progress_percentage,
        last_completed_milestone_id,
    }
}

/// Get the next uncompleted milestone target for a guild.
/// Handles zero-state and unknown-id scenarios explicitly.
pub fn get_next_milestone_target(
    env: &Env,
    guild_id: &Address,
) -> NextMilestoneTarget {
    let milestone_ids = get_guild_milestone_ids(env, guild_id);
    let current_progress = get_guild_progress(env, guild_id);

    if milestone_ids.is_empty() {
        // Unknown/zero-state guild
        return NextMilestoneTarget {
            guild_id: guild_id.clone(),
            next_milestone_id: 0,
            target_progress: 0,
            current_progress,
            progress_remaining: 0,
            next_reward_amount: 0,
            all_milestones_completed: true,
        };
    }

    for milestone_id in milestone_ids.iter() {
        if let Some(milestone) = get_milestone(env, guild_id, milestone_id) {
            if milestone.status != MilestoneStatus::Completed {
                let progress_remaining = if milestone.target_progress > current_progress {
                    milestone.target_progress - current_progress
                } else {
                    0
                };

                return NextMilestoneTarget {
                    guild_id: guild_id.clone(),
                    next_milestone_id: milestone_id,
                    target_progress: milestone.target_progress,
                    current_progress,
                    progress_remaining,
                    next_reward_amount: milestone.reward_amount,
                    all_milestones_completed: false,
                };
            }
        }
    }

    // All milestones completed
    NextMilestoneTarget {
        guild_id: guild_id.clone(),
        next_milestone_id: 0,
        target_progress: 0,
        current_progress,
        progress_remaining: 0,
        next_reward_amount: 0,
        all_milestones_completed: true,
    }
}
