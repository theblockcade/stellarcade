#![no_std]
#![allow(unexpected_cfgs)]

//! Referral-quest accessors (#776). Quests live as admin-configured
//! definitions; per-user completions land in storage when the referred
//! player hits the quest's threshold, and an off-chain payout pipeline
//! flips them to `paid`. The two accessors here are pure reads that let
//! the UI render the completion queue and the outstanding payout balance
//! without re-scanning every completion.
//!
//! - [`Self::completion_queue_summary`] — pending / paid / total counts.
//! - [`Self::payout_gap_accessor`] — owed vs paid token totals + the gap.

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    CompletionQueueSummary, CompletionRecord, PayoutGapInfo, QuestConfig, QuestState,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Quest(u32),
    Completion(u32, Address),
}

#[contract]
pub struct ReferralQuests;

#[contractimpl]
impl ReferralQuests {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update a quest. Existing counters and totals are preserved
    /// — admins typically tweak `payout_per_completion` or the `paused`
    /// flag without resetting the queue.
    pub fn upsert_quest(
        env: Env,
        admin: Address,
        quest_id: u32,
        payout_per_completion: u128,
        paused: bool,
    ) {
        require_admin(&env, &admin);
        assert!(payout_per_completion > 0, "payout must be positive");

        let existing = storage::get_quest(&env, quest_id);
        let (pending, paid, owed, paid_total) = match existing {
            Some(q) => (
                q.pending_completion_count,
                q.paid_completion_count,
                q.total_payout_owed,
                q.total_payout_paid,
            ),
            None => (0, 0, 0, 0),
        };

        storage::set_quest(
            &env,
            &QuestConfig {
                quest_id,
                payout_per_completion,
                pending_completion_count: pending,
                paid_completion_count: paid,
                total_payout_owed: owed,
                total_payout_paid: paid_total,
                paused,
            },
        );
    }

    /// Record that `user` completed `quest_id`. Idempotent in the sense
    /// that a second call with the same `(quest_id, user)` pair panics —
    /// completions are unique per-user-per-quest by design.
    pub fn record_completion(
        env: Env,
        admin: Address,
        user: Address,
        quest_id: u32,
        completed_at: u64,
    ) {
        require_admin(&env, &admin);
        let mut quest = storage::get_quest(&env, quest_id).expect("Quest not found");
        assert!(!quest.paused, "Quest paused");
        assert!(
            storage::get_completion(&env, quest_id, &user).is_none(),
            "Already completed"
        );

        quest.pending_completion_count = quest
            .pending_completion_count
            .checked_add(1)
            .expect("queue overflow");
        quest.total_payout_owed = quest
            .total_payout_owed
            .checked_add(quest.payout_per_completion)
            .expect("owed overflow");
        storage::set_quest(&env, &quest);

        storage::set_completion(
            &env,
            &user,
            &CompletionRecord {
                quest_id,
                completed_at,
                paid: false,
            },
        );
    }

    /// Flip a completion from pending → paid. Decrements `pending_count`
    /// and increments `paid_count`, and shifts the same amount from
    /// `total_payout_owed` (which conceptually tracks "outstanding") to
    /// `total_payout_paid`. Reverts if the completion is missing or already
    /// paid.
    pub fn mark_paid(env: Env, admin: Address, user: Address, quest_id: u32) {
        require_admin(&env, &admin);
        let mut quest = storage::get_quest(&env, quest_id).expect("Quest not found");
        let mut completion =
            storage::get_completion(&env, quest_id, &user).expect("Completion not found");
        assert!(!completion.paid, "Already paid");

        completion.paid = true;
        storage::set_completion(&env, &user, &completion);

        quest.pending_completion_count = quest
            .pending_completion_count
            .checked_sub(1)
            .expect("pending underflow");
        quest.paid_completion_count = quest
            .paid_completion_count
            .checked_add(1)
            .expect("paid overflow");
        quest.total_payout_owed = quest
            .total_payout_owed
            .checked_sub(quest.payout_per_completion)
            .expect("owed underflow");
        quest.total_payout_paid = quest
            .total_payout_paid
            .checked_add(quest.payout_per_completion)
            .expect("paid_total overflow");
        storage::set_quest(&env, &quest);
    }

    /// Compact view of the completion queue for `quest_id`.
    pub fn completion_queue_summary(env: Env, quest_id: u32) -> CompletionQueueSummary {
        let configured = is_configured(&env);
        let Some(quest) = storage::get_quest(&env, quest_id) else {
            return CompletionQueueSummary {
                quest_id,
                configured,
                exists: false,
                state: if configured {
                    QuestState::Missing
                } else {
                    QuestState::NotConfigured
                },
                payout_per_completion: 0,
                pending_completion_count: 0,
                paid_completion_count: 0,
                total_completion_count: 0,
            };
        };

        let total = quest
            .pending_completion_count
            .checked_add(quest.paid_completion_count)
            .unwrap_or(u32::MAX);

        CompletionQueueSummary {
            quest_id,
            configured,
            exists: true,
            state: if quest.paused {
                QuestState::Paused
            } else {
                QuestState::Active
            },
            payout_per_completion: quest.payout_per_completion,
            pending_completion_count: quest.pending_completion_count,
            paid_completion_count: quest.paid_completion_count,
            total_completion_count: total,
        }
    }

    /// Payout gap (owed - paid) and the two underlying totals.
    pub fn payout_gap_accessor(env: Env, quest_id: u32) -> PayoutGapInfo {
        let configured = is_configured(&env);
        let Some(quest) = storage::get_quest(&env, quest_id) else {
            return PayoutGapInfo {
                quest_id,
                configured,
                exists: false,
                state: if configured {
                    QuestState::Missing
                } else {
                    QuestState::NotConfigured
                },
                total_payout_owed: 0,
                total_payout_paid: 0,
                payout_gap: 0,
            };
        };

        // owed is the slot that the accrual + payout pipeline keeps as
        // "outstanding"; the gap is literally that value, with paid surfaced
        // alongside for context.
        PayoutGapInfo {
            quest_id,
            configured,
            exists: true,
            state: if quest.paused {
                QuestState::Paused
            } else {
                QuestState::Active
            },
            total_payout_owed: quest.total_payout_owed,
            total_payout_paid: quest.total_payout_paid,
            payout_gap: quest.total_payout_owed,
        }
    }
}

fn is_configured(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

fn require_admin(env: &Env, admin: &Address) {
    admin.require_auth();
    let stored: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    assert!(stored == *admin, "Unauthorized");
}

#[cfg(test)]
mod test;
