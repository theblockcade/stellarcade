//! Stellarcade Badge Minter Contract
//!
//! Manages the minting of badges with supply tracking and claim eligibility checks.
//! Provides read-only accessors for minted supply snapshots and claim eligibility.
//!
//! ## Storage Strategy
//! - `instance()`: Admin address configuration
//! - `persistent()`: Badge definitions, user mint records, and supply tracking
//!   Each entry has its own TTL, bumped on every write.
//!
//! ## Invariants
//! - Each badge has a maximum supply that cannot be exceeded
//! - Users can only mint badges they are eligible for
//! - All supply tracking is updated atomically

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
    BadgeNotFound      = 4,
    BadgeAlreadyExists = 5,
    SupplyExhausted    = 6,
    InvalidInput       = 7,
    NotEligible        = 8,
    BadgeInactive      = 9,
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

#[contractevent]
pub struct BadgeDefined {
    #[topic]
    pub badge_id: u64,
    pub name: String,
    pub max_supply: u64,
    pub mint_price: i128,
}

#[contractevent]
pub struct BadgeMinted {
    #[topic]
    pub user: Address,
    #[topic]
    pub badge_id: u64,
    pub quantity: u64,
    pub mint_price: i128,
}

#[contractevent]
pub struct BadgeStatusChanged {
    #[topic]
    pub badge_id: u64,
    pub is_active: bool,
}

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

#[contract]
pub struct BadgeMinter;

#[contractimpl]
impl BadgeMinter {
    // -----------------------------------------------------------------------
    // initialize
    // -----------------------------------------------------------------------

    /// Initialize the contract. May only be called once.
    ///
    /// `admin` is the only address authorized to define badges and manage the contract.
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if get_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        set_admin(&env, &admin);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // define_badge
    // -----------------------------------------------------------------------

    /// Define a new badge that can be minted. Admin only.
    ///
    /// `badge_id` must be unique. `max_supply` is the total number that can be minted.
    /// `mint_price` is the cost to mint one badge. Use 0 for free badges.
    pub fn define_badge(
        env: Env,
        admin: Address,
        badge_id: u64,
        name: String,
        description: String,
        max_supply: u64,
        mint_price: i128,
    ) -> Result<(), Error> {
        require_initialized(&env)?;
        require_admin(&env, &admin)?;

        if max_supply == 0 || mint_price < 0 {
            return Err(Error::InvalidInput);
        }

        if get_badge_definition(&env, badge_id).is_some() {
            return Err(Error::BadgeAlreadyExists);
        }

        let definition = BadgeDefinition {
            badge_id,
            name: name.clone(),
            description,
            max_supply,
            mint_price,
            is_active: true,
        };

        set_badge_definition(&env, badge_id, &definition);
        set_badge_active_status(&env, badge_id, true);
        set_total_minted(&env, badge_id, 0);

        BadgeDefined {
            badge_id,
            name,
            max_supply,
            mint_price,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // mint_badge
    // -----------------------------------------------------------------------

    /// Mint a badge for a user.
    ///
    /// The badge must exist, be active, and have remaining supply.
    /// The user must be eligible (currently all users are eligible).
    pub fn mint_badge(env: Env, user: Address, badge_id: u64, quantity: u64) -> Result<(), Error> {
        require_initialized(&env)?;

        if quantity == 0 {
            return Err(Error::InvalidInput);
        }

        let definition = get_badge_definition(&env, badge_id)
            .ok_or(Error::BadgeNotFound)?;

        if !definition.is_active || !is_badge_active(&env, badge_id) {
            return Err(Error::BadgeInactive);
        }

        let current_minted = get_total_minted(&env, badge_id);
        if current_minted + quantity > definition.max_supply {
            return Err(Error::SupplyExhausted);
        }

        // Check eligibility (simplified - in real implementation this would check specific criteria)
        if !self::check_eligibility(&env, &user, badge_id) {
            return Err(Error::NotEligible);
        }

        user.require_auth();

        // Update supply
        let new_total = increment_total_minted(&env, badge_id, quantity);

        // Update user's minted badges
        let mut user_badges = get_user_minted_badges(&env, &user);
        if !user_badges.iter().any(|id| id == &badge_id) {
            user_badges.push_back(badge_id);
            set_user_minted_badges(&env, &user, &user_badges);
        }

        // Add mint record
        let record = UserMintRecord {
            user: user.clone(),
            badge_id,
            minted_at: env.ledger().sequence() as u64,
            quantity,
        };
        add_mint_record(&env, &user, &record);

        BadgeMinted {
            user,
            badge_id,
            quantity,
            mint_price: definition.mint_price,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // set_badge_status
    // -----------------------------------------------------------------------

    /// Set the active status of a badge. Admin only.
    pub fn set_badge_status(env: Env, admin: Address, badge_id: u64, is_active: bool) -> Result<(), Error> {
        require_initialized(&env)?;
        require_admin(&env, &admin)?;

        let definition = get_badge_definition(&env, badge_id)
            .ok_or(Error::BadgeNotFound)?;

        // Update definition
        let mut updated_def = definition;
        updated_def.is_active = is_active;
        set_badge_definition(&env, badge_id, &updated_def);

        // Update status flag
        set_badge_active_status(&env, badge_id, is_active);

        BadgeStatusChanged {
            badge_id,
            is_active,
        }
        .publish(&env);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // get_minted_supply_snapshot
    // -----------------------------------------------------------------------

    /// Return a snapshot of the minted supply for a badge.
    ///
    /// This provides a comprehensive view of supply status including
    /// total minted, remaining supply, and active status.
    /// Returns default values for unknown badge IDs.
    pub fn get_minted_supply_snapshot(env: Env, badge_id: u64) -> MintedSupplySnapshot {
        let definition = get_badge_definition(&env, badge_id);
        
        match definition {
            Some(def) => {
                let total_minted = get_total_minted(&env, badge_id);
                let remaining_supply = def.max_supply.saturating_sub(total_minted);
                
                MintedSupplySnapshot {
                    badge_id,
                    total_minted,
                    max_supply: def.max_supply,
                    remaining_supply,
                    is_active: def.is_active && is_badge_active(&env, badge_id),
                }
            }
            None => {
                // Return empty state for unknown badges
                MintedSupplySnapshot {
                    badge_id,
                    total_minted: 0,
                    max_supply: 0,
                    remaining_supply: 0,
                    is_active: false,
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // get_claim_eligibility_snapshot
    // -----------------------------------------------------------------------

    /// Return a snapshot of claim eligibility for a user and badge.
    ///
    /// This provides comprehensive eligibility information including
    /// the reason for eligibility status and current mint price.
    /// Returns predictable default values for unknown badges or users.
    pub fn get_claim_eligibility_snapshot(env: Env, user: Address, badge_id: u64) -> ClaimEligibilitySnapshot {
        let definition = get_badge_definition(&env, badge_id);
        
        match definition {
            Some(def) => {
                let is_eligible = self::check_eligibility(&env, &user, badge_id);
                let can_mint = is_eligible 
                    && def.is_active 
                    && is_badge_active(&env, badge_id)
                    && get_total_minted(&env, badge_id) < def.max_supply;
                
                let eligibility_reason = if !def.is_active || !is_badge_active(&env, badge_id) {
                    String::from_str(&env, "Badge is inactive")
                } else if get_total_minted(&env, badge_id) >= def.max_supply {
                    String::from_str(&env, "Supply exhausted")
                } else if !is_eligible {
                    String::from_str(&env, "User not eligible")
                } else {
                    String::from_str(&env, "Eligible to mint")
                };
                
                ClaimEligibilitySnapshot {
                    user,
                    badge_id,
                    is_eligible,
                    eligibility_reason,
                    mint_price: def.mint_price,
                    can_mint,
                }
            }
            None => {
                // Return empty state for unknown badges
                ClaimEligibilitySnapshot {
                    user,
                    badge_id,
                    is_eligible: false,
                    eligibility_reason: String::from_str(&env, "Badge not found"),
                    mint_price: 0,
                    can_mint: false,
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // get_user_minted_badges
    // -----------------------------------------------------------------------

    /// Return the list of badge IDs minted by a user.
    pub fn get_user_minted_badges(env: Env, user: Address) -> Vec<u64> {
        get_user_minted_badges(&env, &user)
    }

    // -----------------------------------------------------------------------
    // get_user_mint_records
    // -----------------------------------------------------------------------

    /// Return the complete mint history for a user.
    pub fn get_user_mint_records(env: Env, user: Address) -> Vec<UserMintRecord> {
        get_user_mint_records(&env, &user)
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

fn check_eligibility(env: &Env, user: &Address, badge_id: u64) -> bool {
    // Simplified eligibility check - in a real implementation this would check
    // specific criteria like achievements, level requirements, etc.
    // For now, all users are eligible for all badges.
    let _ = (user, badge_id); // Suppress unused warning
    true
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    fn setup(env: &Env) -> (BadgeMinterClient<'_>, Address) {
        let admin = Address::generate(env);
        let contract_id = env.register(BadgeMinter, ());
        let client = BadgeMinterClient::new(env, &contract_id);

        env.mock_all_auths();
        client.initialize(&admin);

        (client, admin)
    }

    #[test]
    fn test_initialize() {
        let env = Env::default();
        let admin = Address::generate(&env);
        let contract_id = env.register(BadgeMinter, ());
        let client = BadgeMinterClient::new(&env, &contract_id);

        env.mock_all_auths();
        client.initialize(&admin);
        // No panic = success
    }

    #[test]
    fn test_initialize_rejects_reinit() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        let result = client.try_initialize(&admin);
        assert!(result.is_err());
    }

    #[test]
    fn test_define_badge() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        client.define_badge(
            &admin,
            &1u64,
            &soroban_sdk::String::from_str(&env, "Test Badge"),
            &soroban_sdk::String::from_str(&env, "A test badge"),
            &1000u64,
            &100i128,
        );
        // No panic = success
    }

    #[test]
    fn test_mint_badge() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Define a badge
        client.define_badge(
            &admin,
            &1u64,
            &soroban_sdk::String::from_str(&env, "Test Badge"),
            &soroban_sdk::String::from_str(&env, "A test badge"),
            &1000u64,
            &100i128,
        );

        let user = Address::generate(&env);
        env.mock_all_auths();
        client.mint_badge(&user, &1u64, &1u64);

        let badges = client.get_user_minted_badges(&user);
        assert_eq!(badges.len(), 1);
        assert_eq!(badges.get(0).unwrap(), 1u64);
    }

    #[test]
    fn test_get_minted_supply_snapshot() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Define a badge
        client.define_badge(
            &admin,
            &1u64,
            &soroban_sdk::String::from_str(&env, "Test Badge"),
            &soroban_sdk::String::from_str(&env, "A test badge"),
            &1000u64,
            &100i128,
        );

        let snapshot = client.get_minted_supply_snapshot(&1u64);
        assert!(snapshot.is_active);
        assert_eq!(snapshot.total_minted, 0);
        assert_eq!(snapshot.max_supply, 1000);
        assert_eq!(snapshot.remaining_supply, 1000);

        // Mint some badges
        let user = Address::generate(&env);
        client.mint_badge(&user, &1u64, &5u64);

        let snapshot = client.get_minted_supply_snapshot(&1u64);
        assert_eq!(snapshot.total_minted, 5);
        assert_eq!(snapshot.remaining_supply, 995);
    }

    #[test]
    fn test_get_minted_supply_snapshot_unknown_badge() {
        let env = Env::default();
        let (client, _) = setup(&env);

        let snapshot = client.get_minted_supply_snapshot(&999u64);
        assert!(!snapshot.is_active);
        assert_eq!(snapshot.total_minted, 0);
        assert_eq!(snapshot.max_supply, 0);
        assert_eq!(snapshot.remaining_supply, 0);
    }

    #[test]
    fn test_get_claim_eligibility_snapshot() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Define a badge
        client.define_badge(
            &admin,
            &1u64,
            &soroban_sdk::String::from_str(&env, "Test Badge"),
            &soroban_sdk::String::from_str(&env, "A test badge"),
            &1000u64,
            &100i128,
        );

        let user = Address::generate(&env);
        let snapshot = client.get_claim_eligibility_snapshot(&user, &1u64);
        
        assert!(snapshot.is_eligible);
        assert!(snapshot.can_mint);
        assert_eq!(snapshot.mint_price, 100i128);
        assert_eq!(snapshot.eligibility_reason, soroban_sdk::String::from_str(&env, "Eligible to mint"));
    }

    #[test]
    fn test_get_claim_eligibility_snapshot_unknown_badge() {
        let env = Env::default();
        let (client, _) = setup(&env);

        let user = Address::generate(&env);
        let snapshot = client.get_claim_eligibility_snapshot(&user, &999u64);
        
        assert!(!snapshot.is_eligible);
        assert!(!snapshot.can_mint);
        assert_eq!(snapshot.mint_price, 0i128);
        assert_eq!(snapshot.eligibility_reason, soroban_sdk::String::from_str(&env, "Badge not found"));
    }

    #[test]
    fn test_supply_exhausted() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Define a badge with limited supply
        client.define_badge(
            &admin,
            &1u64,
            &soroban_sdk::String::from_str(&env, "Limited Badge"),
            &soroban_sdk::String::from_str(&env, "Limited supply badge"),
            &5u64,
            &100i128,
        );

        let user = Address::generate(&env);
        
        // Mint all available badges
        client.mint_badge(&user, &1u64, &5u64);

        // Try to mint one more - should fail
        let result = client.try_mint_badge(&user, &1u64, &1u64);
        assert!(result.is_err());

        // Check eligibility snapshot
        let snapshot = client.get_claim_eligibility_snapshot(&user, &1u64);
        assert!(!snapshot.can_mint);
        assert_eq!(snapshot.eligibility_reason, soroban_sdk::String::from_str(&env, "Supply exhausted"));
    }

    #[test]
    fn test_inactive_badge() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        env.mock_all_auths();

        // Define a badge
        client.define_badge(
            &admin,
            &1u64,
            &soroban_sdk::String::from_str(&env, "Test Badge"),
            &soroban_sdk::String::from_str(&env, "A test badge"),
            &1000u64,
            &100i128,
        );

        // Deactivate the badge
        client.set_badge_status(&admin, &1u64, &false);

        let user = Address::generate(&env);
        
        // Try to mint - should fail
        let result = client.try_mint_badge(&user, &1u64, &1u64);
        assert!(result.is_err());

        // Check eligibility snapshot
        let snapshot = client.get_claim_eligibility_snapshot(&user, &1u64);
        assert!(!snapshot.can_mint);
        assert_eq!(snapshot.eligibility_reason, soroban_sdk::String::from_str(&env, "Badge is inactive"));
    }
}
