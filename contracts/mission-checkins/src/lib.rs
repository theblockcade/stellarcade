#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};

pub mod storage;
pub mod types;

#[cfg(test)]
mod test;

use crate::storage::{
    get_mission, get_participant_window, set_mission, set_participant_window,
};
use crate::types::{CheckInFrequencySnapshot, Mission, ParticipationSummary, ResetWindow, StreakDecay};

#[contract]
pub struct MissionCheckins;

#[contractimpl]
impl MissionCheckins {
    /// Configures a new mission with a reset interval (seconds). A reset
    /// interval of 0 disables window resets (counts accumulate forever).
    pub fn configure_mission(env: Env, id: u64, reset_interval: u64) {
        if get_mission(&env, id).is_some() {
            panic!("mission already exists");
        }

        set_mission(
            &env,
            id,
            &Mission {
                id,
                total_checkins: 0,
                unique_participants: 0,
                window_start: env.ledger().timestamp(),
                reset_interval,
                is_active: true,
            },
        );
    }

    /// Records a check-in by `user`. Rolls the window forward (resetting the
    /// counters) when the reset interval has elapsed, then counts the check-in
    /// and, if the user is new for this window, a unique participant.
    pub fn check_in(env: Env, id: u64, user: Address) {
        user.require_auth();

        let mut mission = get_mission(&env, id).expect("mission not found");
        if !mission.is_active {
            panic!("mission is not active");
        }

        let now = env.ledger().timestamp();
        if mission.reset_interval > 0
            && now >= mission.window_start.saturating_add(mission.reset_interval)
        {
            mission.window_start = now;
            mission.total_checkins = 0;
            mission.unique_participants = 0;
        }

        mission.total_checkins += 1;

        let last_window = get_participant_window(&env, id, user.clone());
        if last_window != Some(mission.window_start) {
            mission.unique_participants += 1;
            set_participant_window(&env, id, user, mission.window_start);
        }

        set_mission(&env, id, &mission);
    }

    /// Participation totals for the current window; predictable zero-state when
    /// the mission does not exist.
    pub fn participation_summary(env: Env, id: u64) -> ParticipationSummary {
        match get_mission(&env, id) {
            Some(m) => ParticipationSummary {
                mission_exists: true,
                total_checkins: m.total_checkins,
                unique_participants: m.unique_participants,
            },
            None => ParticipationSummary {
                mission_exists: false,
                total_checkins: 0,
                unique_participants: 0,
            },
        }
    }

    /// The current reset window and time remaining until it rolls over.
    pub fn reset_window(env: Env, id: u64) -> ResetWindow {
        let now = env.ledger().timestamp();

        match get_mission(&env, id) {
            Some(m) => {
                let next_reset = if m.reset_interval == 0 {
                    m.window_start
                } else {
                    m.window_start.saturating_add(m.reset_interval)
                };
                let window_elapsed = m.reset_interval > 0 && now >= next_reset;
                let seconds_until_reset = if m.reset_interval == 0 || now >= next_reset {
                    0
                } else {
                    next_reset - now
                };

                ResetWindow {
                    mission_exists: true,
                    window_start: m.window_start,
                    reset_interval: m.reset_interval,
                    next_reset,
                    current_time: now,
                    seconds_until_reset,
                    window_elapsed,
                }
            }
            None => ResetWindow {
                mission_exists: false,
                window_start: 0,
                reset_interval: 0,
                next_reset: 0,
                current_time: now,
                seconds_until_reset: 0,
                window_elapsed: false,
            },
        }
    }

    /// Check-in rate snapshot: checkins per 1000 seconds and unique-participant
    /// ratio in bps for the current window.
    pub fn check_in_frequency_snapshot(env: Env, id: u64) -> CheckInFrequencySnapshot {
        let now = env.ledger().timestamp();
        match get_mission(&env, id) {
            Some(m) => {
                let window_duration_secs = now.saturating_sub(m.window_start);
                let checkins_per_1k_secs = if window_duration_secs == 0 {
                    0
                } else {
                    m.total_checkins.saturating_mul(1_000) / window_duration_secs
                };
                let unique_ratio_bps = if m.total_checkins == 0 {
                    0
                } else {
                    (m.unique_participants as u64 * 10_000 / m.total_checkins) as u32
                };
                CheckInFrequencySnapshot {
                    mission_exists: true,
                    total_checkins: m.total_checkins,
                    unique_participants: m.unique_participants,
                    window_duration_secs,
                    checkins_per_1k_secs,
                    unique_ratio_bps,
                }
            }
            None => CheckInFrequencySnapshot {
                mission_exists: false,
                total_checkins: 0,
                unique_participants: 0,
                window_duration_secs: 0,
                checkins_per_1k_secs: 0,
                unique_ratio_bps: 0,
            },
        }
    }

    /// Whether `user`'s streak would be lost if they miss the current window.
    pub fn streak_decay(env: Env, id: u64, user: Address) -> StreakDecay {
        let now = env.ledger().timestamp();
        match get_mission(&env, id) {
            Some(m) => {
                let next_reset = if m.reset_interval == 0 {
                    u64::MAX
                } else {
                    m.window_start.saturating_add(m.reset_interval)
                };
                let window_elapsed = m.reset_interval > 0 && now >= next_reset;
                let participant_active_this_window =
                    get_participant_window(&env, id, user) == Some(m.window_start);
                let streak_decayed = window_elapsed && !participant_active_this_window;
                let seconds_until_decay = if window_elapsed || m.reset_interval == 0 {
                    0
                } else {
                    next_reset - now
                };
                StreakDecay {
                    mission_exists: true,
                    participant_active_this_window,
                    window_elapsed,
                    streak_decayed,
                    seconds_until_decay,
                }
            }
            None => StreakDecay {
                mission_exists: false,
                participant_active_this_window: false,
                window_elapsed: false,
                streak_decayed: false,
                seconds_until_decay: 0,
            },
        }
    }
}
