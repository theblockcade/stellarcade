#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, String, Vec};

mod storage;
mod types;

use storage::*;
use types::*;

// Contract

#[contract]
pub struct AchievementsContract;

#[contractimpl]
impl AchievementsContract {
    // Initialize
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        set_admin(&env, &admin);
    }

    // Accessor for category completion summary
    pub fn get_category_completion_summary(env: Env, user: Address, category: String) -> CategoryCompletionSummary {
        let achievements = get_achievements(&env, &user);
        let category_achievements: Vec<Achievement> = achievements.iter().filter(|a| a.category == category).collect();
        let unlocked = category_achievements.iter().filter(|a| a.unlocked).count() as u32;
        let total = category_achievements.len();
        let percentage = if total > 0 { (unlocked * 100) / total } else { 0 };
        CategoryCompletionSummary {
            category,
            total_achievements: total,
            unlocked_achievements: unlocked,
            completion_percentage: percentage,
        }
    }

    // Accessor for next-unlock
    pub fn get_next_unlock(env: Env, user: Address) -> Option<NextUnlock> {
        get_next_unlock(&env, &user)
    }

    // Write functions
    pub fn add_achievement(env: Env, user: Address, achievement: Achievement) {
        let mut achs = get_achievements(&env, &user);
        achs.push_back(achievement);
        set_achievements(&env, &user, &achs);
    }

    pub fn set_next_unlock(env: Env, user: Address, unlock: NextUnlock) {
        set_next_unlock(&env, &user, &unlock);
    }

    // Achievement unlock snapshot accessor
    pub fn get_achievement_unlock_snapshot(env: Env, user: Address) -> AchievementUnlockSnapshot {
        let achievements = get_achievements(&env, &user);
        let total = achievements.len();
        let unlocked = achievements.iter().filter(|a| a.unlocked).count() as u32;
        let locked = total - unlocked;
        let percentage = if total > 0 { (unlocked * 100) / total } else { 0 };

        AchievementUnlockSnapshot {
            user: user.clone(),
            total_achievements: total,
            unlocked_achievements: unlocked,
            locked_achievements: locked,
            completion_percentage: percentage,
        }
    }

    // Claim grace period accessor
    pub fn get_claim_grace_accessor(env: Env, user: Address) -> ClaimGraceAccessor {
        let current_ledger = env.ledger().sequence() as u32;
        let grace_period_ledger = get_claim_grace_period(&env, &user).unwrap_or(0);

        let is_within_grace_period = if grace_period_ledger > 0 {
            current_ledger <= grace_period_ledger
        } else {
            false
        };

        let ledgers_remaining = if grace_period_ledger > current_ledger {
            grace_period_ledger - current_ledger
        } else {
            0
        };

        ClaimGraceAccessor {
            user: user.clone(),
            grace_period_ledger,
            current_ledger,
            is_within_grace_period,
            ledgers_remaining,
        }
    }

    // Write function for claim grace period
    pub fn set_claim_grace_period(env: Env, user: Address, grace_ledger: u32) {
        set_claim_grace_period(&env, &user, grace_ledger);
    }
}