#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

mod storage;
mod test;
mod types;

use storage::*;
use types::*;

#[contract]
pub struct RoundFinalizerContract;

#[contractimpl]
impl RoundFinalizerContract {
    pub fn initialize(env: Env, admin: Address) {
        if get_config(&env).is_some() {
            panic!("already initialized");
        }
        set_config(
            &env,
            &RoundFinalizerConfig {
                admin,
                paused: false,
            },
        );
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        let mut cfg = get_config(&env).unwrap_or_else(|| panic!("not configured"));
        admin.require_auth();
        if admin != cfg.admin {
            panic!("not admin");
        }
        cfg.paused = paused;
        set_config(&env, &cfg);
    }

    pub fn upsert_round(
        env: Env,
        admin: Address,
        round_id: u64,
        unresolved_ops: u32,
        has_checkpoint: bool,
    ) {
        let cfg = get_config(&env).unwrap_or_else(|| panic!("not configured"));
        admin.require_auth();
        if admin != cfg.admin {
            panic!("not admin");
        }

        if get_round(&env, round_id).is_none() {
            let mut ids = get_round_ids(&env);
            ids.push_back(round_id);
            set_round_ids(&env, &ids);
        }

        set_round(
            &env,
            &RoundRecord {
                round_id,
                unresolved_ops,
                has_checkpoint,
            },
        );
    }

    pub fn get_unresolved_round_summary(env: Env) -> UnresolvedRoundSummary {
        let Some(cfg) = get_config(&env) else {
            return UnresolvedRoundSummary {
                status: RoundFinalizerStatus::Unconfigured,
                total_rounds: 0,
                unresolved_rounds: 0,
                unresolved_ops: 0,
                next_unresolved_round_id: 0,
            };
        };

        let ids = get_round_ids(&env);
        let mut unresolved_rounds = 0u32;
        let mut unresolved_ops = 0u32;
        let mut next_unresolved_round_id = 0u64;

        for round_id in ids.iter() {
            if let Some(round) = get_round(&env, round_id) {
                if round.unresolved_ops > 0 {
                    unresolved_rounds += 1;
                    unresolved_ops = unresolved_ops.saturating_add(round.unresolved_ops);
                    if next_unresolved_round_id == 0 || round.round_id < next_unresolved_round_id {
                        next_unresolved_round_id = round.round_id;
                    }
                }
            }
        }

        UnresolvedRoundSummary {
            status: if cfg.paused {
                RoundFinalizerStatus::Paused
            } else {
                RoundFinalizerStatus::Active
            },
            total_rounds: ids.len(),
            unresolved_rounds,
            unresolved_ops,
            next_unresolved_round_id,
        }
    }

    pub fn get_finalize_readiness(env: Env, round_id: u64) -> FinalizeReadiness {
        let Some(cfg) = get_config(&env) else {
            return FinalizeReadiness {
                status: RoundFinalizerStatus::Unconfigured,
                round_id,
                is_ready: false,
                unresolved_ops: 0,
                missing_checkpoint: true,
            };
        };

        let Some(round) = get_round(&env, round_id) else {
            return FinalizeReadiness {
                status: if cfg.paused {
                    RoundFinalizerStatus::Paused
                } else {
                    RoundFinalizerStatus::Active
                },
                round_id,
                is_ready: false,
                unresolved_ops: 0,
                missing_checkpoint: true,
            };
        };

        let missing_checkpoint = !round.has_checkpoint;
        let is_ready = !cfg.paused && round.unresolved_ops == 0 && !missing_checkpoint;

        FinalizeReadiness {
            status: if cfg.paused {
                RoundFinalizerStatus::Paused
            } else {
                RoundFinalizerStatus::Active
            },
            round_id,
            is_ready,
            unresolved_ops: round.unresolved_ops,
            missing_checkpoint,
        }
    }

    /// Return a dashboard-friendly active round summary.
    ///
    /// Active rounds have unresolved operations or lack a checkpoint. Ready
    /// rounds have zero unresolved operations and a checkpoint. Empty and
    /// unconfigured states return zero counts.
    pub fn active_round_summary(env: Env) -> ActiveRoundSummary {
        let Some(cfg) = get_config(&env) else {
            return ActiveRoundSummary {
                status: RoundFinalizerStatus::Unconfigured,
                total_rounds: 0,
                active_rounds: 0,
                ready_rounds: 0,
                blocked_rounds: 0,
                unresolved_ops: 0,
                next_active_round_id: 0,
            };
        };

        let ids = get_round_ids(&env);
        let mut active_rounds = 0u32;
        let mut ready_rounds = 0u32;
        let mut blocked_rounds = 0u32;
        let mut unresolved_ops = 0u32;
        let mut next_active_round_id = 0u64;

        for round_id in ids.iter() {
            if let Some(round) = get_round(&env, round_id) {
                let missing_checkpoint = !round.has_checkpoint;
                let active = round.unresolved_ops > 0 || missing_checkpoint;
                if active {
                    active_rounds = active_rounds.saturating_add(1);
                    unresolved_ops = unresolved_ops.saturating_add(round.unresolved_ops);
                    if next_active_round_id == 0 || round.round_id < next_active_round_id {
                        next_active_round_id = round.round_id;
                    }
                } else {
                    ready_rounds = ready_rounds.saturating_add(1);
                }
                if round.unresolved_ops > 0 || missing_checkpoint || cfg.paused {
                    blocked_rounds = blocked_rounds.saturating_add(1);
                }
            }
        }

        ActiveRoundSummary {
            status: if cfg.paused {
                RoundFinalizerStatus::Paused
            } else {
                RoundFinalizerStatus::Active
            },
            total_rounds: ids.len(),
            active_rounds,
            ready_rounds,
            blocked_rounds,
            unresolved_ops,
            next_active_round_id,
        }
    }

    /// Return aggregate pressure against round finalization.
    ///
    /// Pressure is floored basis-point math over blocked rounds. A paused
    /// contract marks all stored rounds as blocked; empty state returns zero.
    pub fn finalization_pressure(env: Env) -> FinalizationPressure {
        let Some(cfg) = get_config(&env) else {
            return FinalizationPressure {
                status: RoundFinalizerStatus::Unconfigured,
                total_rounds: 0,
                blocked_rounds: 0,
                unresolved_ops: 0,
                missing_checkpoints: 0,
                pressure_bps: 0,
                finalization_paused: false,
            };
        };

        let ids = get_round_ids(&env);
        let mut blocked_rounds = 0u32;
        let mut unresolved_ops = 0u32;
        let mut missing_checkpoints = 0u32;

        for round_id in ids.iter() {
            if let Some(round) = get_round(&env, round_id) {
                let missing_checkpoint = !round.has_checkpoint;
                if missing_checkpoint {
                    missing_checkpoints = missing_checkpoints.saturating_add(1);
                }
                unresolved_ops = unresolved_ops.saturating_add(round.unresolved_ops);
                if cfg.paused || round.unresolved_ops > 0 || missing_checkpoint {
                    blocked_rounds = blocked_rounds.saturating_add(1);
                }
            }
        }

        let total_rounds = ids.len();
        let pressure_bps = if total_rounds == 0 {
            0
        } else {
            (blocked_rounds * 10_000) / total_rounds
        };

        FinalizationPressure {
            status: if cfg.paused {
                RoundFinalizerStatus::Paused
            } else {
                RoundFinalizerStatus::Active
            },
            total_rounds,
            blocked_rounds,
            unresolved_ops,
            missing_checkpoints,
            pressure_bps,
            finalization_paused: cfg.paused,
        }
    }
}
