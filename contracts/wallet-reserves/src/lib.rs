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
    WalletReserve(Address),
    TotalReserves,
    ReserveConfig,
}

#[derive(Clone)]
#[contracttype]
pub struct ReserveAllocation {
    pub wallet: Address,
    pub allocated_amount: i128,
    pub available_amount: i128,
    pub depletion_threshold: i128,
    pub last_updated: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct ReserveAllocationSummary {
    pub total_allocated: i128,
    pub total_available: i128,
    pub total_wallets: u32,
    pub high_risk_wallets: u32,
    pub medium_risk_wallets: u32,
    pub low_risk_wallets: u32,
}

#[derive(Clone)]
#[contracttype]
pub struct DepletionRiskAssessment {
    pub wallet: Address,
    pub current_balance: i128,
    pub allocated_amount: i128,
    pub depletion_threshold: i128,
    pub risk_level: Symbol,
    pub estimated_depletion_time: Option<u64>,
    pub recommended_action: Symbol,
}

#[derive(Clone)]
#[contracttype]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    Unauthorized = 3,
    Paused = 4,
    WalletNotFound = 5,
    InvalidAmount = 6,
    InsufficientReserves = 7,
}

#[contract]
pub struct WalletReserves;

#[contractimpl]
impl WalletReserves {
    /// Initialize the contract with admin
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().persistent().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::Initialized, &true);
        env.storage().persistent().set(&DataKey::Paused, &false);
        env.storage().persistent().set(&DataKey::TotalReserves, &0i128);

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

    /// Allocate reserves to a wallet
    pub fn allocate_reserves(
        env: Env,
        admin: Address,
        wallet: Address,
        amount: i128,
        depletion_threshold: i128,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        Self::require_admin(&env, &admin)?;
        Self::require_not_paused(&env)?;

        if amount <= 0 || depletion_threshold <= 0 {
            return Err(Error::InvalidAmount);
        }

        let allocation = ReserveAllocation {
            wallet: wallet.clone(),
            allocated_amount: amount,
            available_amount: amount,
            depletion_threshold,
            last_updated: env.ledger().timestamp(),
        };

        env.storage()
            .persistent()
            .set(&DataKey::WalletReserve(wallet), &allocation);

        let current_total: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalReserves)
            .unwrap_or(0);
        env.storage()
            .persistent()
            .set(&DataKey::TotalReserves, &(current_total + amount));

        Ok(())
    }

    /// Update available reserves for a wallet
    pub fn update_available_reserves(
        env: Env,
        admin: Address,
        wallet: Address,
        new_available: i128,
    ) -> Result<(), Error> {
        Self::require_initialized(&env)?;
        Self::require_admin(&env, &admin)?;
        Self::require_not_paused(&env)?;

        if new_available < 0 {
            return Err(Error::InvalidAmount);
        }

        let mut allocation: ReserveAllocation = env
            .storage()
            .persistent()
            .get(&DataKey::WalletReserve(wallet.clone()))
            .ok_or(Error::WalletNotFound)?;

        allocation.available_amount = new_available;
        allocation.last_updated = env.ledger().timestamp();

        env.storage()
            .persistent()
            .set(&DataKey::WalletReserve(wallet), &allocation);

        Ok(())
    }

    /// Get reserve allocation summary
    pub fn get_reserve_allocation_summary(env: Env) -> Result<ReserveAllocationSummary, Error> {
        Self::require_initialized(&env)?;

        // In a real implementation, we would iterate through all wallet reserves
        // For this implementation, we'll return a basic summary
        let total_allocated: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::TotalReserves)
            .unwrap_or(0);

        Ok(ReserveAllocationSummary {
            total_allocated,
            total_available: total_allocated, // Simplified for this implementation
            total_wallets: 0,                 // Would be calculated from storage iteration
            high_risk_wallets: 0,
            medium_risk_wallets: 0,
            low_risk_wallets: 0,
        })
    }

    /// Get depletion risk assessment for a specific wallet
    pub fn get_depletion_risk_assessment(
        env: Env,
        wallet: Address,
    ) -> Result<DepletionRiskAssessment, Error> {
        Self::require_initialized(&env)?;

        let allocation: ReserveAllocation = env
            .storage()
            .persistent()
            .get(&DataKey::WalletReserve(wallet.clone()))
            .ok_or(Error::WalletNotFound)?;

        let risk_level = if allocation.available_amount <= allocation.depletion_threshold {
            symbol_short!("HIGH")
        } else if allocation.available_amount <= allocation.depletion_threshold * 2 {
            symbol_short!("MEDIUM")
        } else {
            symbol_short!("LOW")
        };

        let recommended_action = match risk_level {
            _ if risk_level == symbol_short!("HIGH") => symbol_short!("URGENT"),
            _ if risk_level == symbol_short!("MEDIUM") => symbol_short!("MONITOR"),
            _ => symbol_short!("NORMAL"),
        };

        Ok(DepletionRiskAssessment {
            wallet: wallet.clone(),
            current_balance: allocation.available_amount,
            allocated_amount: allocation.allocated_amount,
            depletion_threshold: allocation.depletion_threshold,
            risk_level,
            estimated_depletion_time: None, // Would be calculated based on usage patterns
            recommended_action,
        })
    }

    /// Get wallet reserve allocation
    pub fn get_wallet_reserves(env: Env, wallet: Address) -> Result<ReserveAllocation, Error> {
        Self::require_initialized(&env)?;

        env.storage()
            .persistent()
            .get(&DataKey::WalletReserve(wallet))
            .ok_or(Error::WalletNotFound)
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

    fn setup() -> (Env, Address, Address) {
        let env = Env::default();
        let admin = Address::generate(&env);
        let wallet = Address::generate(&env);
        (env, admin, wallet)
    }

    #[test]
    fn test_init_success() {
        let (env, admin, _) = setup();
        let result = WalletReserves::init(env, admin);
        assert!(result.is_ok());
    }

    #[test]
    fn test_init_rejects_reinit() {
        let (env, admin, _) = setup();
        WalletReserves::init(env.clone(), admin.clone()).unwrap();
        let result = WalletReserves::init(env, admin);
        assert_eq!(result, Err(Error::AlreadyInitialized));
    }

    #[test]
    fn test_allocate_reserves_success() {
        let (env, admin, wallet) = setup();
        WalletReserves::init(env.clone(), admin.clone()).unwrap();

        let result = WalletReserves::allocate_reserves(env, admin, wallet, 1000, 100);
        assert!(result.is_ok());
    }

    #[test]
    fn test_allocate_reserves_invalid_amount() {
        let (env, admin, wallet) = setup();
        WalletReserves::init(env.clone(), admin.clone()).unwrap();

        let result = WalletReserves::allocate_reserves(env, admin, wallet, 0, 100);
        assert_eq!(result, Err(Error::InvalidAmount));
    }

    #[test]
    fn test_get_reserve_allocation_summary() {
        let (env, admin, wallet) = setup();
        WalletReserves::init(env.clone(), admin.clone()).unwrap();
        WalletReserves::allocate_reserves(env.clone(), admin, wallet, 1000, 100).unwrap();

        let result = WalletReserves::get_reserve_allocation_summary(env);
        assert!(result.is_ok());
        let summary = result.unwrap();
        assert_eq!(summary.total_allocated, 1000);
    }

    #[test]
    fn test_get_depletion_risk_assessment() {
        let (env, admin, wallet) = setup();
        WalletReserves::init(env.clone(), admin.clone()).unwrap();
        WalletReserves::allocate_reserves(env.clone(), admin, wallet.clone(), 1000, 100).unwrap();

        let result = WalletReserves::get_depletion_risk_assessment(env, wallet);
        assert!(result.is_ok());
        let assessment = result.unwrap();
        assert_eq!(assessment.risk_level, symbol_short!("LOW"));
    }

    #[test]
    fn test_wallet_not_found() {
        let (env, admin, wallet) = setup();
        WalletReserves::init(env.clone(), admin).unwrap();

        let result = WalletReserves::get_wallet_reserves(env, wallet);
        assert_eq!(result, Err(Error::WalletNotFound));
    }

    #[test]
    fn test_unauthorized_access() {
        let (env, admin, wallet) = setup();
        let unauthorized = Address::generate(&env);
        WalletReserves::init(env.clone(), admin).unwrap();

        let result = WalletReserves::allocate_reserves(env, unauthorized, wallet, 1000, 100);
        assert_eq!(result, Err(Error::Unauthorized));
    }
}