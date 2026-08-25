#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};
use types::{ScheduleSummary, VestingSchedule};

#[contract]
pub struct TokenVestingLinearContract;

impl TokenVestingLinearContract {
    fn calculate_vested(schedule: &VestingSchedule, current_ts: u64) -> u128 {
        if schedule.revoked {
            return schedule.released_amount;
        }

        let cliff_ts = schedule.start_ts.saturating_add(schedule.cliff_sec);
        if current_ts < cliff_ts {
            return 0;
        }

        let end_ts = schedule.start_ts.saturating_add(schedule.duration_sec);
        if current_ts >= end_ts {
            return schedule.total_amount;
        }

        let elapsed = current_ts.saturating_sub(schedule.start_ts);
        (schedule.total_amount.saturating_mul(elapsed as u128)) / (schedule.duration_sec as u128)
    }
}

#[contractimpl]
impl TokenVestingLinearContract {
    pub fn create_schedule(
        env: Env,
        admin: Address,
        beneficiary: Address,
        total_amount: u128,
        start_ts: u64,
        cliff_sec: u64,
        duration_sec: u64,
        revocable: bool,
    ) -> u64 {
        admin.require_auth();

        if total_amount == 0 {
            panic!("total_amount must be > 0");
        }
        if duration_sec == 0 {
            panic!("duration_sec must be > 0");
        }
        if cliff_sec > duration_sec {
            panic!("cliff_sec cannot exceed duration_sec");
        }

        let schedule_id = storage::get_next_schedule_id(&env);
        storage::set_next_schedule_id(&env, schedule_id + 1);

        let schedule = VestingSchedule {
            schedule_id,
            admin,
            beneficiary,
            total_amount,
            released_amount: 0,
            start_ts,
            cliff_sec,
            duration_sec,
            revocable,
            revoked: false,
        };

        storage::set_schedule(&env, &schedule);
        schedule_id
    }

    pub fn get_releasable_amount(env: Env, schedule_id: u64) -> u128 {
        let schedule = storage::get_schedule(&env, schedule_id).expect("schedule not found");
        let current_ts = env.ledger().timestamp();
        let vested = Self::calculate_vested(&schedule, current_ts);
        vested.saturating_sub(schedule.released_amount)
    }

    pub fn release(env: Env, schedule_id: u64) -> u128 {
        let mut schedule = storage::get_schedule(&env, schedule_id).expect("schedule not found");
        let current_ts = env.ledger().timestamp();

        let vested = Self::calculate_vested(&schedule, current_ts);
        let releasable = vested.saturating_sub(schedule.released_amount);

        if releasable == 0 {
            panic!("no releasable tokens available");
        }

        schedule.released_amount = schedule.released_amount.saturating_add(releasable);
        storage::set_schedule(&env, &schedule);

        releasable
    }

    pub fn revoke(env: Env, schedule_id: u64, admin: Address) -> (u128, u128) {
        admin.require_auth();

        let mut schedule = storage::get_schedule(&env, schedule_id).expect("schedule not found");
        if schedule.admin != admin {
            panic!("unauthorized admin");
        }
        if !schedule.revocable {
            panic!("schedule is not revocable");
        }
        if schedule.revoked {
            panic!("schedule already revoked");
        }

        let current_ts = env.ledger().timestamp();
        let vested = Self::calculate_vested(&schedule, current_ts);

        let beneficiary_share = vested.saturating_sub(schedule.released_amount);
        let unvested_refund = schedule.total_amount.saturating_sub(vested);

        schedule.revoked = true;
        schedule.released_amount = vested;
        storage::set_schedule(&env, &schedule);

        (beneficiary_share, unvested_refund)
    }

    pub fn get_schedule(env: Env, schedule_id: u64) -> ScheduleSummary {
        let schedule = storage::get_schedule(&env, schedule_id).expect("schedule not found");
        ScheduleSummary {
            schedule_id: schedule.schedule_id,
            admin: schedule.admin,
            beneficiary: schedule.beneficiary,
            total_amount: schedule.total_amount,
            released_amount: schedule.released_amount,
            start_ts: schedule.start_ts,
            cliff_sec: schedule.cliff_sec,
            duration_sec: schedule.duration_sec,
            revocable: schedule.revocable,
            revoked: schedule.revoked,
        }
    }
}

#[cfg(test)]
mod test;
