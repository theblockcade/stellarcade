#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod types;
#[cfg(test)]
mod test;

pub use types::{
    DepletionBand, StreamData, StreamHealthSummary, StreamPressureSnapshot, WithdrawalReadiness,
};

#[contract]
pub struct RewardStream;

#[contractimpl]
impl RewardStream {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_none() {
            storage::set_admin(&env, &admin);
        }
    }

    pub fn configure_stream(
        env: Env,
        admin: Address,
        stream_id: u64,
        total_allocated: i128,
        total_withdrawn: i128,
        unlock_time: u64,
        paused: bool,
    ) {
        admin.require_auth();
        if storage::get_admin(&env) == Some(admin) {
            storage::set_stream(
                &env,
                &StreamData {
                    stream_id,
                    total_allocated,
                    total_withdrawn,
                    unlock_time,
                    paused,
                },
            );
        }
    }

    pub fn stream_health_summary(env: Env) -> StreamHealthSummary {
        if let Some(s) = storage::get_stream(&env) {
            StreamHealthSummary {
                is_configured: true,
                stream_id: s.stream_id,
                total_allocated: s.total_allocated,
                total_withdrawn: s.total_withdrawn,
                remaining: (s.total_allocated - s.total_withdrawn).max(0),
                paused: s.paused,
            }
        } else {
            StreamHealthSummary {
                is_configured: false,
                stream_id: 0,
                total_allocated: 0,
                total_withdrawn: 0,
                remaining: 0,
                paused: false,
            }
        }
    }

    pub fn withdrawal_readiness(env: Env, now: u64) -> WithdrawalReadiness {
        if let Some(s) = storage::get_stream(&env) {
            let remaining = (s.total_allocated - s.total_withdrawn).max(0);
            let unlocked = now >= s.unlock_time;
            let ready = !s.paused && unlocked && remaining > 0;
            let blocked_reason_code = if s.paused {
                1
            } else if !unlocked {
                2
            } else if remaining == 0 {
                3
            } else {
                0
            };
            WithdrawalReadiness {
                stream_id: s.stream_id,
                is_ready: ready,
                claimable_now: if ready { remaining } else { 0 },
                blocked_reason_code,
            }
        } else {
            WithdrawalReadiness {
                stream_id: 0,
                is_ready: false,
                claimable_now: 0,
                blocked_reason_code: 4,
            }
        }
    }

    /// Return stream pressure and depletion state for the configured stream.
    ///
    /// `pressure_bps` uses floored basis-point math:
    /// `min(total_withdrawn, total_allocated) * 10_000 / total_allocated`.
    /// Missing, empty, or non-positive allocations return a zero pressure and
    /// `DepletionBand::NotConfigured` so consumers can render a predictable
    /// zero state without treating it as an error.
    pub fn stream_pressure_snapshot(env: Env) -> StreamPressureSnapshot {
        if let Some(s) = storage::get_stream(&env) {
            let remaining = (s.total_allocated - s.total_withdrawn).max(0);
            let pressure_bps = pressure_bps(s.total_allocated, s.total_withdrawn);
            let depletion_band = depletion_band_for(&s, remaining);

            StreamPressureSnapshot {
                is_configured: s.total_allocated > 0,
                stream_id: s.stream_id,
                total_allocated: s.total_allocated,
                total_withdrawn: s.total_withdrawn,
                remaining,
                pressure_bps,
                depletion_band,
                paused: s.paused,
            }
        } else {
            StreamPressureSnapshot {
                is_configured: false,
                stream_id: 0,
                total_allocated: 0,
                total_withdrawn: 0,
                remaining: 0,
                pressure_bps: 0,
                depletion_band: DepletionBand::NotConfigured,
                paused: false,
            }
        }
    }

    /// Return only the depletion band from `stream_pressure_snapshot`.
    ///
    /// This accessor is intentionally narrow for UI badge reads. Missing or
    /// not-yet-configured state returns `DepletionBand::NotConfigured`.
    pub fn depletion_band(env: Env) -> DepletionBand {
        Self::stream_pressure_snapshot(env).depletion_band
    }
}

fn pressure_bps(total_allocated: i128, total_withdrawn: i128) -> u32 {
    if total_allocated <= 0 || total_withdrawn <= 0 {
        return 0;
    }

    let withdrawn = total_withdrawn.min(total_allocated);
    ((withdrawn * 10_000) / total_allocated) as u32
}

fn depletion_band_for(stream: &StreamData, remaining: i128) -> DepletionBand {
    if stream.total_allocated <= 0 {
        return DepletionBand::NotConfigured;
    }

    if stream.paused {
        return DepletionBand::Paused;
    }

    if remaining <= 0 {
        return DepletionBand::Depleted;
    }

    let remaining_bps = ((remaining * 10_000) / stream.total_allocated) as u32;
    if remaining_bps <= 1_000 {
        DepletionBand::Critical
    } else if remaining_bps <= 2_500 {
        DepletionBand::Watch
    } else {
        DepletionBand::Stable
    }
}
