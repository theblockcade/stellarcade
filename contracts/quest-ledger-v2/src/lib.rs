#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Map, Symbol, Vec,
};

pub mod storage;
pub mod types;
pub mod test;

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Admin,
    Initialized,
    Paused,
    QuestCompletion(u64), // quest_id
    CompletionQueue,
    RewardDelay(u64), // quest_id
    QuestConfig(u64), // quest_id
    TotalQuests,
    QueueSnapshot(u64), // timestamp
}

#[derive(Clone)]
#[contracttype]
pub struct QuestCompletion {
    pub quest_id: u64,
    pub player: Address,
    pub completed_at: u64,
    pub reward_amount: i128,
    pub reward_token: Address,
    pub status: Symbol, // "PENDING", "PROCESSED", "DELAYED"
}

#[derive(Clone)]
#[contracttype]
pub struct CompletionQueueSnapshot {
    pub timestamp: u64,
    pub total_pending: u32,
    pub total_processing: u32,
    pub total_delayed: u32,
    pub oldest_pending: Option<u64>,
    pub newest_pending: Option<u64>,
    pub average_processing_time: u64,
    pub queue_health_score: u32, // 0-100
}

#[derive(Clone)]
#[contracttype]
pub struct RewardDelayAccessor {
    pub quest_id: u64,
    pub base_delay: u64,
    pub current_delay: u64,
    pub delay_reason: Symbol,
    pub estimated_processing_time: u64,
    pub priority_level: u32, // 1-5, 1 being highest priority
    pub can_expedite: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct QueueMetrics {
    pub total_completions: u32,
    pub pending_completions: u32,
    pub processing_completions: u32,
    pub delayed_completions: u32,
    pub failed_completions: u32,
    pub average_completion_time: u64,
    pub throughput_per_hour: u32,
}

#[derive(Clone)]
#[contracttype]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    Paused = 4,
    QuestNotFound = 5,
    CompletionNotFound = 6,
    InvalidQuestId = 7,
    InvalidAmount = 8,
    QuestAlreadyCompleted = 9,
    InvalidDelay = 10,
}

#[contract]
pub struct QuestLedgerV2;

#[contractimpl]
impl QuestLedgerV2 {
    /// Initialize the contract with admin
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().persistent().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::Initialized, &true);
        env.storage().persistent().set(&DataKey::Paused, &false);
        env.storage().persistent().set(&DataKey::TotalQuests, &0u64);

        Ok(())
    }

    /// Pause the contract (admin only)
    pub fn pause(env: Env, admin: Address) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        Self::require_admin(&env, &admin)?;

        env.storage().persistent().set(&DataKey::Paused, &true);
        Ok(())
    }

    /// Unpause the contract (admin only)
    pub fn unpause(env: Env, admin: Address) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        Self::require_admin(&env, &admin)?;

        env.storage().persistent().set(&DataKey::Paused, &false);
        Ok(())
    }

    /// Record quest completion
    pub fn complete_quest(
        env: Env,
        player: Address,
        quest_id: u64,
        reward_amount: i128,
        reward_token: Address,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        Self::require_not_paused(&env)?;

        if quest_id == 0 || reward_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Check if quest already completed by this player
        let completion_key = DataKey::QuestCompletion(quest_id);
        if env.storage().persistent().has(&completion_key) {
            return Err(Error::QuestAlreadyCompleted);
        }

        let completion = QuestCompletion {
            quest_id,
            player: player.clone(),
            completed_at: env.ledger().timestamp(),
            reward_amount,
            reward_token,
            status: symbol_short!("PENDING"),
        };

        env.storage().persistent().set(&completion_key, &completion);

        // Update total quests counter
        let current_total: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalQuests)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::TotalQuests, &(current_total + 1));

        Ok(())
    }

    /// Set reward delay for a quest
    pub fn set_reward_delay(
        env: Env,
        admin: Address,
        quest_id: u64,
        delay_seconds: u64,
        reason: Symbol,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        Self::require_admin(&env, &admin)?;
        Self::require_not_paused(&env)?;

        if quest_id == 0 {
            return Err(Error::InvalidQuestId);
        }

        let delay_accessor = RewardDelayAccessor {
            quest_id,
            base_delay: delay_seconds,
            current_delay: delay_seconds,
            delay_reason: reason,
            estimated_processing_time: delay_seconds + 3600, // Add 1 hour buffer
            priority_level: 3, // Default medium priority
            can_expedite: true,
        };

        env.storage()
            .persistent()
            .set(&DataKey::RewardDelay(quest_id), &delay_accessor);

        Ok(())
    }

    /// Get completion queue snapshot
    pub fn get_completion_queue_snapshot(env: Env) -> Result<CompletionQueueSnapshot, Error> {
        Self::require_initialized(&env)?;

        let current_time = env.ledger().timestamp();
        
        // In a real implementation, we would iterate through all completions
        // For this implementation, we'll return a basic snapshot
        let total_quests: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalQuests)
            .unwrap_or(0);

        let snapshot = CompletionQueueSnapshot {
            timestamp: current_time,
            total_pending: total_quests as u32, // Simplified
            total_processing: 0,
            total_delayed: 0,
            oldest_pending: if total_quests > 0 { Some(current_time - 3600) } else { None },
            newest_pending: if total_quests > 0 { Some(current_time) } else { None },
            average_processing_time: 1800, // 30 minutes default
            queue_health_score: if total_quests < 100 { 90 } else { 70 }, // Simple health calculation
        };

        // Store snapshot for historical tracking
        env.storage()
            .persistent()
            .set(&DataKey::QueueSnapshot(current_time), &snapshot);

        Ok(snapshot)
    }

    /// Get reward delay accessor for a quest
    pub fn get_reward_delay_accessor(env: Env, quest_id: u64) -> Result<RewardDelayAccessor, Error> {
        Self::require_initialized(&env)?;

        if quest_id == 0 {
            return Err(Error::InvalidQuestId);
        }

        let delay_accessor = env
            .storage()
            .persistent()
            .get(&DataKey::RewardDelay(quest_id))
            .unwrap_or(RewardDelayAccessor {
                quest_id,
                base_delay: 0,
                current_delay: 0,
                delay_reason: symbol_short!("NONE"),
                estimated_processing_time: 300, // 5 minutes default
                priority_level: 3,
                can_expedite: true,
            });

        Ok(delay_accessor)
    }

    /// Get quest completion details
    pub fn get_quest_completion(env: Env, quest_id: u64) -> Result<QuestCompletion, Error> {
        Self::require_initialized(&env)?;

        if quest_id == 0 {
            return Err(Error::InvalidQuestId);
        }

        env.storage()
            .persistent()
            .get(&DataKey::QuestCompletion(quest_id))
            .ok_or(Error::CompletionNotFound)
    }

    /// Update completion status
    pub fn update_completion_status(
        env: Env,
        admin: Address,
        quest_id: u64,
        new_status: Symbol,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        Self::require_admin(&env, &admin)?;
        Self::require_not_paused(&env)?;

        let mut completion: QuestCompletion = env
            .storage()
            .persistent()
            .get(&DataKey::QuestCompletion(quest_id))
            .ok_or(Error::CompletionNotFound)?;

        completion.status = new_status;

        env.storage()
            .persistent()
            .set(&DataKey::QuestCompletion(quest_id), &completion);

        Ok(())
    }

    /// Get queue metrics
    pub fn get_queue_metrics(env: Env) -> Result<QueueMetrics, Error> {
        Self::require_initialized(&env)?;

        let total_quests: u64 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalQuests)
            .unwrap_or(0);

        // Simplified metrics calculation
        Ok(QueueMetrics {
            total_completions: total_quests as u32,
            pending_completions: (total_quests as u32).saturating_sub(0),
            processing_completions: 0,
            delayed_completions: 0,
            failed_completions: 0,
            average_completion_time: 1800, // 30 minutes
            throughput_per_hour: 10, // Default throughput
        })
    }

    // Helper functions
    fn require_initialized(env: &Env) -> Result<(), Error> {
        if !env.storage().persistent().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }

    fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
        let admin: Address = env.storage().persistent().get(&DataKey::Admin).unwrap();
        if caller != &admin {
            return Err(Error::Unauthorized);
        }
        Ok(())
    }

    fn require_not_paused(env: &Env) -> Result<(), Error> {
        let paused: bool = env.storage().persistent().get(&DataKey::Paused).unwrap_or(false);
        if paused {
            return Err(Error::Paused);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn setup() -> (Env, Address, Address, Address) {
        let env = Env::default();
        let admin = Address::generate(&env);
        let player = Address::generate(&env);
        let token = Address::generate(&env);
        (env, admin, player, token)
    }

    #[test]
    fn test_init_success() {
        let (env, admin, _, _) = setup();
        let result = QuestLedgerV2::init(env, admin);
        assert!(result.is_ok());
    }

    #[test]
    fn test_complete_quest_success() {
        let (env, admin, player, token) = setup();
        QuestLedgerV2::init(env.clone(), admin).unwrap();

        let result = QuestLedgerV2::complete_quest(env, player, 1, 100, token);
        assert!(result.is_ok());
    }

    #[test]
    fn test_get_completion_queue_snapshot() {
        let (env, admin, player, token) = setup();
        QuestLedgerV2::init(env.clone(), admin).unwrap();
        QuestLedgerV2::complete_quest(env.clone(), player, 1, 100, token).unwrap();

        let result = QuestLedgerV2::get_completion_queue_snapshot(env);
        assert!(result.is_ok());
        let snapshot = result.unwrap();
        assert_eq!(snapshot.total_pending, 1);
    }

    #[test]
    fn test_reward_delay_accessor() {
        let (env, admin, _, _) = setup();
        QuestLedgerV2::init(env.clone(), admin.clone()).unwrap();

        QuestLedgerV2::set_reward_delay(env.clone(), admin, 1, 3600, symbol_short!("REVIEW")).unwrap();

        let result = QuestLedgerV2::get_reward_delay_accessor(env, 1);
        assert!(result.is_ok());
        let accessor = result.unwrap();
        assert_eq!(accessor.base_delay, 3600);
        assert_eq!(accessor.delay_reason, symbol_short!("REVIEW"));
    }
}