#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    DepletionRisk, DepletionRiskLevel, ProtectedBalanceSummary, ShieldRecord, ShieldState,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Shield(u64),
}

#[contract]
pub struct FeeShield;

#[contractimpl]
impl FeeShield {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update a protected fee balance. Historical fee counters are
    /// preserved across updates so the read accessors remain cumulative.
    pub fn upsert_shield(
        env: Env,
        admin: Address,
        shield_id: u64,
        protected_balance: i128,
        current_balance: i128,
        paused: bool,
    ) {
        require_admin(&env, &admin);
        assert!(
            protected_balance >= 0,
            "Protected balance cannot be negative"
        );
        assert!(current_balance >= 0, "Current balance cannot be negative");
        assert!(
            current_balance >= protected_balance,
            "Current balance cannot be below protected balance"
        );

        let mut shield = storage::get_shield(&env, shield_id).unwrap_or(ShieldRecord {
            shield_id,
            protected_balance,
            current_balance,
            cumulative_fees_charged: 0,
            charge_count: 0,
            paused,
        });

        shield.protected_balance = protected_balance;
        shield.current_balance = current_balance;
        shield.paused = paused;

        storage::set_shield(&env, &shield);
    }

    /// Add new balance to an existing fee shield without changing the protected
    /// floor.
    pub fn top_up(env: Env, admin: Address, shield_id: u64, amount: i128) {
        require_admin(&env, &admin);
        assert!(amount > 0, "Top-up amount must be positive");

        let mut shield = storage::get_shield(&env, shield_id).expect("Shield not found");
        shield.current_balance = shield
            .current_balance
            .checked_add(amount)
            .expect("Top-up overflow");
        storage::set_shield(&env, &shield);
    }

    /// Deduct a fee from the spendable buffer. The protected floor is never
    /// crossed; once `spendable_balance` hits zero the workflow is blocked.
    pub fn charge_fee(env: Env, admin: Address, shield_id: u64, amount: i128) {
        require_admin(&env, &admin);
        assert!(amount > 0, "Charge amount must be positive");

        let mut shield = storage::get_shield(&env, shield_id).expect("Shield not found");
        assert!(!shield.paused, "Shield paused");

        let spendable = spendable_balance(&shield);
        assert!(spendable >= amount, "Charge would breach protected balance");

        shield.current_balance = shield
            .current_balance
            .checked_sub(amount)
            .expect("Charge underflow");
        shield.cumulative_fees_charged = shield
            .cumulative_fees_charged
            .checked_add(amount)
            .expect("Fee counter overflow");
        shield.charge_count = shield
            .charge_count
            .checked_add(1)
            .expect("Charge count overflow");

        storage::set_shield(&env, &shield);
    }

    /// Return a stable protected-balance summary for `shield_id`.
    ///
    /// Before `init` this returns `configured = false` and `state =
    /// NotConfigured`. Unknown ids after initialization return `exists = false`
    /// with zero balances. `spendable_balance` is `current_balance -
    /// protected_balance` and therefore reaches zero exactly when additional fee
    /// charges must stop.
    pub fn protected_balance_summary(env: Env, shield_id: u64) -> ProtectedBalanceSummary {
        let configured = is_configured(&env);

        let Some(shield) = storage::get_shield(&env, shield_id) else {
            return ProtectedBalanceSummary {
                shield_id,
                configured,
                exists: false,
                state: if configured {
                    ShieldState::Missing
                } else {
                    ShieldState::NotConfigured
                },
                protected_balance: 0,
                current_balance: 0,
                spendable_balance: 0,
                cumulative_fees_charged: 0,
                charge_count: 0,
                can_charge: false,
            };
        };

        let spendable = spendable_balance(&shield);
        let state = if shield.paused {
            ShieldState::Paused
        } else if spendable == 0 {
            ShieldState::Depleted
        } else {
            ShieldState::Protected
        };

        ProtectedBalanceSummary {
            shield_id,
            configured,
            exists: true,
            state,
            protected_balance: shield.protected_balance,
            current_balance: shield.current_balance,
            spendable_balance: spendable,
            cumulative_fees_charged: shield.cumulative_fees_charged,
            charge_count: shield.charge_count,
            can_charge: !shield.paused && spendable > 0,
        }
    }

    /// Return a compact depletion-risk view for `shield_id`.
    ///
    /// `spendable_bps` uses floor division in basis points:
    /// `spendable_balance * 10_000 / current_balance`. Zero-balance, missing,
    /// and not-yet-configured states return `spendable_bps = 0`.
    pub fn depletion_risk(env: Env, shield_id: u64) -> DepletionRisk {
        let summary = Self::protected_balance_summary(env.clone(), shield_id);
        if !summary.exists {
            return DepletionRisk {
                shield_id,
                configured: summary.configured,
                exists: false,
                paused: false,
                protected_balance: 0,
                current_balance: 0,
                spendable_balance: 0,
                spendable_bps: 0,
                risk_level: DepletionRiskLevel::None,
                will_block_next_charge: true,
            };
        }

        let shield =
            storage::get_shield(&env, shield_id).expect("Shield summary and storage out of sync");
        let spendable = spendable_balance(&shield);
        let spendable_bps = spendable_bps(&shield);

        DepletionRisk {
            shield_id,
            configured: summary.configured,
            exists: true,
            paused: shield.paused,
            protected_balance: shield.protected_balance,
            current_balance: shield.current_balance,
            spendable_balance: spendable,
            spendable_bps,
            risk_level: read_risk_level(&shield),
            will_block_next_charge: spendable == 0,
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

fn spendable_balance(shield: &ShieldRecord) -> i128 {
    shield
        .current_balance
        .checked_sub(shield.protected_balance)
        .expect("Shield balance invariant violated")
}

fn spendable_bps(shield: &ShieldRecord) -> u32 {
    if shield.current_balance == 0 {
        return 0;
    }

    let spendable = u128::try_from(spendable_balance(shield)).expect("negative spendable");
    let current = u128::try_from(shield.current_balance).expect("negative current");
    u32::try_from((spendable * 10_000) / current).expect("bps overflow")
}

fn read_risk_level(shield: &ShieldRecord) -> DepletionRiskLevel {
    let spendable = spendable_balance(shield);
    if spendable == 0 {
        return DepletionRiskLevel::Critical;
    }

    match spendable_bps(shield) {
        0..=1_000 => DepletionRiskLevel::High,
        1_001..=2_500 => DepletionRiskLevel::Medium,
        2_501..=5_000 => DepletionRiskLevel::Low,
        _ => DepletionRiskLevel::None,
    }
}

#[cfg(test)]
mod test;
