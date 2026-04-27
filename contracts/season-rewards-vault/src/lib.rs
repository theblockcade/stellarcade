//! Stellarcade Season Rewards Vault Contract
//!
//! Manages seasonal reward distribution with claim queues and rollover balances.
//! Provides read-only accessors for claim queue snapshots and rollover balance information.
//!
//! ## Storage Strategy
//! - `instance()`: Admin address and current season configuration
//! - `persistent()`: Season configs, user rewards, claim queues, and rollover balances
//!   Each entry has its own TTL, bumped on every write.
//!
//! ## Invariants
//! - Each season has a defined start and end time
//! - Rewards can only be claimed during their valid period
//! - Rollover balances track unclaimed rewards between seasons

#![no_std]
#![allow(unexpected_cfgs)]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, vec, Address, Env,
    String, Vec,
};

mod storage;
mod types;

use storage::*;
use types::*;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/// Persistent storage TTL in ledgers (~30 days at 5 s/ledger).
/// Bumped on every write so data never expires.
pub const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;

// ---------------------------------------------------------------------------
// Error Types
// ---------------------------------------------------------------------------

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized     = 2,
    NotAuthorized      = 3,
    SeasonNotFound     = 4,
    SeasonAlreadyExists = 5,
    InvalidInput       = 6,
    NotClaimable       = 7,
    SeasonInactive     = 8,
    RewardNotFound     = 9,
    AlreadyClaimed     = 10,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[contractevent]
pub struct SeasonCreated {
    #[topic]
    pub season_id: u64,
    pub start_time: u64,
    pub end_time: u64,
    pub reward_pool: i128,
}

#[contractevent]
pub struct RewardAdded {
    #[topic]
    pub season_id: u64,
    #[topic]
    pub user: Address,
    pub amount: i128,
    pub reward_type: String,
}

#[contractevent]
pub struct RewardClaimed {
    #[topic]
    pub season_id: u64,
    #[topic]
    pub user: Address,
    pub amount: i128,
}

#[contractevent]
pub struct SeasonRollover {
    #[topic]
    pub from_season: u64,
    pub to_season: u64,
    pub rollover_amount: i128,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct SeasonRewardsVault;

#[contractimpl]
impl SeasonRewardsVault {
    // -----------------------------------------------------------------------
    // initialize
    // -----------------------------------------------------------------------

    /// Initialize the contract. May only be called once.
    ///
    /// `admin` is the only address authorized to manage seasons and rewards.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if get_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        set_admin(&env, &admin);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // create_season
    // -----------------------------------------------------------------------

    /// Create a new reward season. Admin only.
    ///
    /// `season_id` must be unique. `start_time` and `end_time` define the season period.
    /// `reward_pool` is the total rewards allocated for the season.
    pub fn create_season(
        env: Env,
        admin: Address,
        season_id: u64,
        start_time: u64,
        end_time: u64,
        reward_pool: i128,
        auto_rollover: bool,
    ) -> Result<(), Error> {
        require_initialized(&env)?;
        require_admin(&env, &admin)?;

        if start_time >= end_time || reward_pool < 0 {
            return Err(Error::InvalidInput);
        }

        if get_season_config(&env, season_id).is_some() {
            return Err(Error::SeasonAlreadyExists);
        }

        let config = SeasonConfig {
            season_id,
            start_time,
            end_time,
            reward_pool,
            is_active: true,
            auto_rollover,
        };

        set_season_config(&env, season_id, &config);

        // Set as current season if no current season exists
        if get_current_season(&env).is_none() {
            set_current_season(&env, season_id);
        }

        SeasonCreated {
            season_id,
            start_time,
            end_time,
            reward_pool,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // add_reward
    // -----------------------------------------------------------------------

    /// Add a reward for a user in a specific season. Admin only.
    pub fn add_reward(
        env: Env,
        admin: Address,
        season_id: u64,
        user: Address,
        amount: i128,
        reward_type: String,
        expires_at: u64,
    ) -> Result<(), Error> {
        require_initialized(&env)?;
        require_admin(&env, &admin)?;

        if amount <= 0 {
            return Err(Error::InvalidInput);
        }

        let config = get_season_config(&env, season_id)
            .ok_or(Error::SeasonNotFound)?;

        if !config.is_active {
            return Err(Error::SeasonInactive);
        }

        let reward = SeasonReward {
            season_id,
            user: user.clone(),
            amount,
            reward_type: reward_type.clone(),
            created_at: env.ledger().sequence() as u64,
            expires_at,
            is_claimed: false,
        };

        // Add to user rewards
        add_user_reward(&env, &user, &reward);

        // Add to season rewards
        let mut season_rewards = get_season_rewards(&env, season_id);
        season_rewards.push_back(reward.clone());
        set_season_rewards(&env, season_id, &season_rewards);

        // Add to claim queue
        add_to_claim_queue(&env, season_id, &reward);

        // Update user claim summary
        self::update_user_claim_summary(&env, &user, season_id, amount);

        RewardAdded {
            season_id,
            user,
            amount,
            reward_type,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // claim_reward
    // -----------------------------------------------------------------------

    /// Claim a pending reward for a user.
    pub fn claim_reward(env: Env, user: Address, season_id: u64, reward_index: usize) -> Result<(), Error> {
        require_initialized(&env)?;

        user.require_auth();

        let mut queue = get_claim_queue(&env, season_id);
        if reward_index >= queue.len() as usize {
            return Err(Error::RewardNotFound);
        }

        let reward = queue.get(reward_index).unwrap();
        if reward.user != user {
            return Err(Error::NotAuthorized);
        }

        if reward.is_claimed {
            return Err(Error::AlreadyClaimed);
        }

        // Check if reward is still claimable (not expired)
        if env.ledger().sequence() > reward.expires_at {
            return Err(Error::NotClaimable);
        }

        // Mark as claimed
        let mut claimed_reward = reward;
        claimed_reward.is_claimed = true;
        queue.set(reward_index, claimed_reward.clone());
        set_claim_queue(&env, season_id, &queue);

        // Update user's reward record
        self::mark_user_reward_claimed(&env, &user, season_id, reward_index);

        RewardClaimed {
            season_id,
            user,
            amount: reward.amount,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // process_season_rollover
    // -----------------------------------------------------------------------

    /// Process rollover of unclaimed rewards to the next season. Admin only.
    pub fn process_season_rollover(
        env: Env,
        admin: Address,
        from_season: u64,
        to_season: u64,
    ) -> Result<(), Error> {
        require_initialized(&env)?;
        require_admin(&env, &admin)?;

        let from_config = get_season_config(&env, from_season)
            .ok_or(Error::SeasonNotFound)?;

        let to_config = get_season_config(&env, to_season)
            .ok_or(Error::SeasonNotFound)?;

        if !from_config.auto_rollover {
            return Err(Error::InvalidInput);
        }

        let queue = get_claim_queue(&env, from_season);
        let mut rollover_amount = 0i128;

        for reward in queue.iter() {
            if !reward.is_claimed && env.ledger().sequence() > reward.expires_at {
                rollover_amount += reward.amount;
            }
        }

        if rollover_amount > 0 {
            let rollover_balance = RolloverBalance {
                season_id: from_season,
                total_rollover_amount: rollover_amount,
                rollover_reason: String::from_str(&env, "Unclaimed expired rewards"),
                last_rollover_at: env.ledger().sequence() as u64,
                next_season_id: Some(to_season),
            };

            set_rollover_balance(&env, from_season, &rollover_balance);

            SeasonRollover {
                from_season,
                to_season,
                rollover_amount,
            }
            .publish(&env);
        }

        Ok(())
    }

    // -----------------------------------------------------------------------
    // get_claim_queue_snapshot
    // -----------------------------------------------------------------------

    /// Return a snapshot of the claim queue for a season.
    ///
    /// This provides comprehensive information about pending claims including
    /// total amounts, queue length, and oldest claim age.
    /// Returns empty state for unknown seasons.
    pub fn get_claim_queue_snapshot(env: Env, season_id: u64) -> ClaimQueueSnapshot {
        let queue = get_claim_queue(&env, season_id);
        let current_ledger = env.ledger().sequence();
        
        let total_pending_amount = queue.iter()
            .filter(|reward| !reward.is_claimed)
            .fold(0i128, |acc, reward| acc + reward.amount);

        let queue_length = queue.iter()
            .filter(|reward| !reward.is_claimed)
            .count() as u32;

        let oldest_claim_age = queue.iter()
            .filter(|reward| !reward.is_claimed)
            .map(|reward| current_ledger.saturating_sub(reward.created_at))
            .max()
            .unwrap_or(0);

        ClaimQueueSnapshot {
            season_id,
            pending_claims: queue,
            total_pending_amount,
            queue_length,
            oldest_claim_age,
        }
    }

    // -----------------------------------------------------------------------
    // get_rollover_balance_accessor
    // -----------------------------------------------------------------------

    /// Return rollover balance information for a season.
    ///
    /// This provides detailed information about rolled over rewards
    /// including the amount, reason, and target season.
    /// Returns empty state for seasons without rollover.
    pub fn get_rollover_balance_accessor(env: Env, season_id: u64) -> RolloverBalance {
        get_rollover_balance(&env, season_id)
            .unwrap_or(RolloverBalance {
                season_id,
                total_rollover_amount: 0,
                rollover_reason: String::from_str(&env, "No rollover"),
                last_rollover_at: 0,
                next_season_id: None,
            })
    }

    // -----------------------------------------------------------------------
    // get_user_claim_summary
    // -----------------------------------------------------------------------

    /// Return a user's claim summary for a season.
    pub fn get_user_claim_summary(env: Env, user: Address, season_id: u64) -> Option<UserClaimSummary> {
        get_user_claim_summary(&env, &user, season_id)
    }

    // -----------------------------------------------------------------------
    // get_season_config
    // -----------------------------------------------------------------------

    /// Return season configuration.
    pub fn get_season_config(env: Env, season_id: u64) -> Option<SeasonConfig> {
        get_season_config(&env, season_id)
    }

    // -----------------------------------------------------------------------
    // get_current_season
    // -----------------------------------------------------------------------

    /// Return the current active season ID.
    pub fn get_current_season(env: Env) -> Option<u64> {
        get_current_season(&env)
    }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

fn require_initialized(env: &Env) -> Result<(), Error> {
    if get_admin(env).is_none() {
        return Err(Error::NotInitialized);
    }
    Ok(())
}

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin = get_admin(env).ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if caller != &admin {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

fn update_user_claim_summary(env: &Env, user: &Address, season_id: u64, amount: i128) {
    let current_ledger = env.ledger().sequence();
    let summary = get_user_claim_summary(env, user, season_id)
        .unwrap_or(UserClaimSummary {
            user: user.clone(),
            season_id,
            total_claimable: 0,
            claim_count: 0,
            oldest_unclaimed_age: current_ledger as u64,
        });

    let updated_summary = UserClaimSummary {
        user: user.clone(),
        season_id,
        total_claimable: summary.total_claimable + amount,
        claim_count: summary.claim_count + 1,
        oldest_unclaimed_age: summary.oldest_unclaimed_age.min(current_ledger as u64),
    };

    set_user_claim_summary(env, user, season_id, &updated_summary);
}

fn mark_user_reward_claimed(env: &Env, user: &Address, season_id: u64, reward_index: usize) {
    let mut rewards = get_user_rewards(env, user);
    
    // Find the corresponding reward in user's rewards and mark as claimed
    for i in 0..rewards.len() {
        let reward = rewards.get(i).unwrap();
        if reward.season_id == season_id && !reward.is_claimed {
            let mut claimed_reward = reward;
            claimed_reward.is_claimed = true;
            rewards.set(i, claimed_reward);
            break;
        }
    }
    
    set_user_rewards(env, user, &rewards);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn setup(env: &Env) -> (SeasonRewardsVaultClient<'_>, Address) {
        let admin = Address::generate(env);
        let contract_id = env.register(SeasonRewardsVault, ());
        let client = SeasonRewardsVaultClient::new(env, &contract_id);

        env.mock_all_auths();
        client.initialize(&admin);

        (client, admin)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let contract_id = env.register(SeasonRewardsVault, ());
        let client = SeasonRewardsVaultClient::new(&env, &contract_id);

        env.mock_all_auths();
        client.initialize(&admin);
        // No panic = success
    }

    #[test]
    fn test_create_season() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        client.create_season(
            &admin,
            &1u64,
            &100u64,
            &200u64,
            &10000i128,
            &true,
        );
        // No panic = success
    }

    #[test]
    fn test_add_reward() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Create season
        client.create_season(
            &admin,
            &1u64,
            &100u64,
            &200u64,
            &10000i128,
            &true,
        );

        let user = Address::generate(&env);
        client.add_reward(
            &admin,
            &1u64,
            &user,
            &500i128,
            &soroban_sdk::String::from_str(&env, "tournament_win"),
            &300u64,
        );

        let summary = client.get_user_claim_summary(&user, &1u64);
        assert!(summary.is_some());
        assert_eq!(summary.unwrap().total_claimable, 500i128);
    }

    #[test]
    fn test_get_claim_queue_snapshot() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Create season
        client.create_season(
            &admin,
            &1u64,
            &100u64,
            &200u64,
            &10000i128,
            &true,
        );

        // Add rewards
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        
        client.add_reward(
            &admin,
            &1u64,
            &user1,
            &500i128,
            &soroban_sdk::String::from_str(&env, "reward1"),
            &300u64,
        );
        
        client.add_reward(
            &admin,
            &1u64,
            &user2,
            &300i128,
            &soroban_sdk::String::from_str(&env, "reward2"),
            &300u64,
        );

        let snapshot = client.get_claim_queue_snapshot(&1u64);
        assert_eq!(snapshot.season_id, 1u64);
        assert_eq!(snapshot.total_pending_amount, 800i128);
        assert_eq!(snapshot.queue_length, 2);
    }

    #[test]
    fn test_get_claim_queue_snapshot_empty_season() {
        let env = Env::default();
        let (client, _) = setup(&env);

        let snapshot = client.get_claim_queue_snapshot(&999u64);
        assert_eq!(snapshot.season_id, 999u64);
        assert_eq!(snapshot.total_pending_amount, 0i128);
        assert_eq!(snapshot.queue_length, 0);
        assert_eq!(snapshot.pending_claims.len(), 0);
    }

    #[test]
    fn test_get_rollover_balance_accessor() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Create seasons
        client.create_season(
            &admin,
            &1u64,
            &100u64,
            &200u64,
            &10000i128,
            &true,
        );
        
        client.create_season(
            &admin,
            &2u64,
            &201u64,
            &300u64,
            &15000i128,
            &true,
        );

        // Initially no rollover
        let rollover = client.get_rollover_balance_accessor(&1u64);
        assert_eq!(rollover.total_rollover_amount, 0i128);
        assert_eq!(rollover.rollover_reason, soroban_sdk::String::from_str(&env, "No rollover"));

        // Process rollover (even with no expired rewards)
        client.process_season_rollover(&admin, &1u64, &2u64);

        // Still no rollover since no expired rewards
        let rollover = client.get_rollover_balance_accessor(&1u64);
        assert_eq!(rollover.total_rollover_amount, 0i128);
    }

    #[test]
    fn test_claim_reward() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Create season
        client.create_season(
            &admin,
            &1u64,
            &100u64,
            &200u64,
            &10000i128,
            &true,
        );

        let user = Address::generate(&env);
        client.add_reward(
            &admin,
            &1u64,
            &user,
            &500i128,
            &soroban_sdk::String::from_str(&env, "reward"),
            &300u64,
        );

        // Claim the reward
        client.claim_reward(&user, &1u64, &0usize);

        let snapshot = client.get_claim_queue_snapshot(&1u64);
        assert_eq!(snapshot.total_pending_amount, 0i128); // Should be 0 after claim
    }

    #[test]
    fn test_season_config() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        client.create_season(
            &admin,
            &1u64,
            &100u64,
            &200u64,
            &10000i128,
            &true,
        );

        let config = client.get_season_config(&1u64);
        assert!(config.is_some());
        let config = config.unwrap();
        assert_eq!(config.season_id, 1u64);
        assert_eq!(config.start_time, 100u64);
        assert_eq!(config.end_time, 200u64);
        assert_eq!(config.reward_pool, 10000i128);
        assert!(config.is_active);
        assert!(config.auto_rollover);
    }
}
