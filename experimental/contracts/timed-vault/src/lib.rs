#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};
use types::{
    PositionStatus, PositionSummary, VaultGlobalStats, VaultPayout, VaultPosition,
    EMERGENCY_PENALTY_BPS, LOCK_30_DAYS_SEC, LOCK_7_DAYS_SEC, LOCK_90_DAYS_SEC, MULTIPLIER_30_DAYS,
    MULTIPLIER_7_DAYS, MULTIPLIER_90_DAYS, MULTIPLIER_DENOMINATOR,
};

#[contract]
pub struct TimedVaultContract;

impl TimedVaultContract {
    /// Resolves the payout multiplier (in basis points) for a given lock
    /// duration. Only the three published tiers are accepted; any other
    /// duration is rejected in `deposit` before this is called.
    fn multiplier_for_duration(lock_duration_sec: u64) -> Option<u128> {
        match lock_duration_sec {
            LOCK_7_DAYS_SEC => Some(MULTIPLIER_7_DAYS),
            LOCK_30_DAYS_SEC => Some(MULTIPLIER_30_DAYS),
            LOCK_90_DAYS_SEC => Some(MULTIPLIER_90_DAYS),
            _ => None,
        }
    }

    fn projected_payout(position: &VaultPosition) -> u128 {
        (position.principal.saturating_mul(position.multiplier_bps)) / MULTIPLIER_DENOMINATOR
    }
}

#[contractimpl]
impl TimedVaultContract {
    /// Deposits `amount` locked for `lock_duration_sec`, which must be
    /// exactly one of the supported tiers (7d, 30d, 90d). Returns the new
    /// position's id.
    pub fn deposit(env: Env, user: Address, amount: u128, lock_duration_sec: u64) -> u64 {
        user.require_auth();

        if amount == 0 {
            panic!("deposit amount must be greater than 0");
        }

        let multiplier_bps = Self::multiplier_for_duration(lock_duration_sec)
            .expect("lock_duration_sec must be one of: 7 days, 30 days, 90 days");

        let position_id = storage::get_next_position_id(&env);
        storage::set_next_position_id(&env, position_id + 1);

        let now = env.ledger().timestamp();
        let position = VaultPosition {
            position_id,
            user,
            principal: amount,
            multiplier_bps,
            lock_duration_sec,
            deposited_at: now,
            matures_at: now.saturating_add(lock_duration_sec),
            status: PositionStatus::Active,
        };

        storage::set_position(&env, &position);

        let mut stats = storage::get_stats(&env);
        stats.total_positions = stats.total_positions.saturating_add(1);
        stats.active_positions = stats.active_positions.saturating_add(1);
        stats.total_deposited = stats.total_deposited.saturating_add(amount);
        storage::set_stats(&env, &stats);

        position_id
    }

    /// Withdraws a matured position at its full multiplier-adjusted payout.
    /// Panics if the position is not active, not owned by `user`, or has not
    /// yet reached `matures_at`.
    pub fn withdraw(env: Env, position_id: u64, user: Address) -> VaultPayout {
        user.require_auth();

        let mut position = storage::get_position(&env, position_id).expect("position not found");

        if position.user != user {
            panic!("position does not belong to caller");
        }
        if position.status != PositionStatus::Active {
            panic!("position is not active");
        }

        let now = env.ledger().timestamp();
        if now < position.matures_at {
            panic!("position has not reached maturity; use emergency_withdraw for early exit");
        }

        let amount_paid = Self::projected_payout(&position);

        position.status = PositionStatus::Withdrawn;
        storage::set_position(&env, &position);

        let mut stats = storage::get_stats(&env);
        stats.active_positions = stats.active_positions.saturating_sub(1);
        stats.total_withdrawn = stats.total_withdrawn.saturating_add(amount_paid);
        storage::set_stats(&env, &stats);

        VaultPayout {
            position_id,
            principal: position.principal,
            amount_paid,
            penalty_paid: 0,
            was_emergency: false,
        }
    }

    /// Withdraws an active position before maturity, applying a 10%
    /// slashing penalty (EMERGENCY_PENALTY_BPS) against the principal. The
    /// multiplier is forfeited entirely on early exit — only
    /// `principal - penalty` is returned to the user, and the penalty is
    /// routed to vault reserves (tracked in `total_penalties_collected`).
    pub fn emergency_withdraw(env: Env, position_id: u64, user: Address) -> VaultPayout {
        user.require_auth();

        let mut position = storage::get_position(&env, position_id).expect("position not found");

        if position.user != user {
            panic!("position does not belong to caller");
        }
        if position.status != PositionStatus::Active {
            panic!("position is not active");
        }

        let now = env.ledger().timestamp();
        if now >= position.matures_at {
            panic!("position has already matured; use withdraw instead");
        }

        let penalty_paid =
            (position.principal.saturating_mul(EMERGENCY_PENALTY_BPS)) / MULTIPLIER_DENOMINATOR;
        let amount_paid = position.principal.saturating_sub(penalty_paid);

        position.status = PositionStatus::EmergencyWithdrawn;
        storage::set_position(&env, &position);

        let mut stats = storage::get_stats(&env);
        stats.active_positions = stats.active_positions.saturating_sub(1);
        stats.total_withdrawn = stats.total_withdrawn.saturating_add(amount_paid);
        stats.total_penalties_collected =
            stats.total_penalties_collected.saturating_add(penalty_paid);
        storage::set_stats(&env, &stats);

        VaultPayout {
            position_id,
            principal: position.principal,
            amount_paid,
            penalty_paid,
            was_emergency: true,
        }
    }

    /// Returns a read-only summary of a position, including its projected
    /// payout and whether it has reached maturity yet.
    pub fn get_position(env: Env, position_id: u64) -> PositionSummary {
        let position = storage::get_position(&env, position_id).expect("position not found");
        let now = env.ledger().timestamp();

        PositionSummary {
            position_id: position.position_id,
            user: position.user.clone(),
            principal: position.principal,
            multiplier_bps: position.multiplier_bps,
            lock_duration_sec: position.lock_duration_sec,
            deposited_at: position.deposited_at,
            matures_at: position.matures_at,
            status: position.status.clone(),
            projected_payout: Self::projected_payout(&position),
            is_mature: now >= position.matures_at,
        }
    }

    /// Returns vault-wide accounting stats: total/active position counts,
    /// total principal deposited and withdrawn, and total penalties
    /// collected from emergency withdrawals.
    pub fn get_vault_stats(env: Env) -> VaultGlobalStats {
        storage::get_stats(&env)
    }
}

#[cfg(test)]
mod test;
