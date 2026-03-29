//! Stellarcade User Balance Management Contract
#![no_std]
#![allow(unexpected_cfgs)]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Account(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AccountState {
    pub balance: i128,
    pub reserved: i128,
    pub last_update: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AccountSummary {
    /// True if the account has state persisted in this contract.
    pub exists: bool,
    /// Spendable balance.
    pub balance: i128,
    /// Amount currently reserved/locked.
    pub reserved: i128,
    /// Ledger sequence of the latest state mutation affecting the account.
    pub last_update: u32,
}

#[contract]
pub struct BalanceManager;

#[contractimpl]
impl BalanceManager {
    /// Update user balance (Internal use by other contracts).
    pub fn update_balance(env: Env, user: Address, amount: i128, is_add: bool) {
        // TODO: Require authorization from authorized game contracts
        assert!(amount >= 0, "amount must be non-negative");

        let mut state = Self::read_state_or_default(&env, user.clone());

        if is_add {
            state.balance = state
                .balance
                .checked_add(amount)
                .expect("balance overflow on add");
        } else {
            state.balance = state
                .balance
                .checked_sub(amount)
                .expect("balance underflow on subtract");
        }

        state.last_update = env.ledger().sequence();
        env.storage().persistent().set(&DataKey::Account(user), &state);
    }

    /// View user balance.
    pub fn get_balance(env: Env, user: Address) -> i128 {
        Self::read_state_or_default(&env, user).balance
    }

    /// Returns a stable account snapshot for backend consumers.
    ///
    /// If an account has never been written, `exists` is false and numeric
    /// fields are zeroed so unknown and zero-balance-known accounts are
    /// distinguishable.
    pub fn get_account_summary(env: Env, user: Address) -> AccountSummary {
        match env
            .storage()
            .persistent()
            .get::<DataKey, AccountState>(&DataKey::Account(user))
        {
            Some(state) => AccountSummary {
                exists: true,
                balance: state.balance,
                reserved: state.reserved,
                last_update: state.last_update,
            },
            None => AccountSummary {
                exists: false,
                balance: 0,
                reserved: 0,
                last_update: 0,
            },
        }
    }

    fn read_state_or_default(env: &Env, user: Address) -> AccountState {
        env.storage()
            .persistent()
            .get::<DataKey, AccountState>(&DataKey::Account(user))
            .unwrap_or(AccountState {
                balance: 0,
                reserved: 0,
                last_update: 0,
            })
    }
}

#[cfg(test)]
mod tests {
    extern crate std;

    use super::{AccountSummary, BalanceManager, BalanceManagerClient};
    use soroban_sdk::{testutils::{Address as _, Ledger as _}, Address, Env};

    #[test]
    fn empty_account_summary_is_explicitly_unknown() {
        let env = Env::default();
        let contract_id = env.register(BalanceManager, ());
        let client = BalanceManagerClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        let summary = client.get_account_summary(&user);
        assert_eq!(
            summary,
            AccountSummary {
                exists: false,
                balance: 0,
                reserved: 0,
                last_update: 0,
            }
        );
        assert_eq!(client.get_balance(&user), 0);
    }

    #[test]
    fn funded_account_summary_reflects_balance() {
        let env = Env::default();
        let contract_id = env.register(BalanceManager, ());
        let client = BalanceManagerClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        env.ledger().with_mut(|li| li.sequence_number = 11);
        client.update_balance(&user, &250, &true);

        let summary = client.get_account_summary(&user);
        assert_eq!(summary.exists, true);
        assert_eq!(summary.balance, 250);
        assert_eq!(summary.reserved, 0);
        assert_eq!(summary.last_update, 11);
        assert_eq!(client.get_balance(&user), 250);
    }

    #[test]
    fn summary_last_update_tracks_balance_mutations() {
        let env = Env::default();
        let contract_id = env.register(BalanceManager, ());
        let client = BalanceManagerClient::new(&env, &contract_id);
        let user = Address::generate(&env);

        env.ledger().with_mut(|li| li.sequence_number = 5);
        client.update_balance(&user, &100, &true);

        let after_fund = client.get_account_summary(&user);
        assert_eq!(after_fund.balance, 100);
        assert_eq!(after_fund.last_update, 5);

        env.ledger().with_mut(|li| li.sequence_number = 9);
        client.update_balance(&user, &40, &false);

        let after_spend = client.get_account_summary(&user);
        assert_eq!(after_spend.exists, true);
        assert_eq!(after_spend.balance, 60);
        assert_eq!(after_spend.reserved, 0);
        assert_eq!(after_spend.last_update, 9);
    }
}
