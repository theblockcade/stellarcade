#![no_std]
#![allow(unexpected_cfgs)]

//! Lobby escrow (#815): admin creates an escrow that lobby participants
//! fund collaboratively; once the required amount is met and the release
//! delay has elapsed, the funds can be released to the lobby pool.
//!
//! Two read accessors back the UI:
//!
//! - [`Self::escrow_coverage_summary`] — required vs funded amounts +
//!   participant count + state, with `coverage_bps` clamped at 10_000.
//! - [`Self::release_delay_accessor`] — per-escrow view of the release
//!   window: `Underfunded` / `Waiting` / `Releasable` / `Released` /
//!   `Blocked` / `Missing` / `NotConfigured`.

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    EscrowConfig, EscrowCoverageSummary, EscrowState, ParticipantStake,
    ReleaseDelayInfo, ReleaseDelayState,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Escrow(u32),
    Stake(u32, Address),
}

#[contract]
pub struct LobbyEscrow;

#[contractimpl]
impl LobbyEscrow {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update an escrow. On update, `required_amount` may
    /// only increase (admins can raise the bar but not retroactively
    /// shrink the requirement after participants funded). `released`
    /// escrows reject updates other than the paused flag.
    pub fn upsert_escrow(
        env: Env,
        admin: Address,
        escrow_id: u32,
        required_amount: u128,
        release_delay_secs: u64,
        paused: bool,
    ) {
        require_admin(&env, &admin);
        assert!(required_amount > 0, "required_amount must be positive");
        assert!(release_delay_secs > 0, "release_delay must be positive");

        match storage::get_escrow(&env, escrow_id) {
            Some(existing) => {
                assert!(!existing.released, "escrow already released");
                assert!(
                    required_amount >= existing.required_amount,
                    "required_amount may not decrease"
                );
                storage::set_escrow(
                    &env,
                    &EscrowConfig {
                        required_amount,
                        release_delay_secs,
                        paused,
                        ..existing
                    },
                );
            }
            None => {
                storage::set_escrow(
                    &env,
                    &EscrowConfig {
                        escrow_id,
                        required_amount,
                        total_funded: 0,
                        participant_count: 0,
                        created_at: env.ledger().timestamp(),
                        release_delay_secs,
                        paused,
                        released: false,
                    },
                );
            }
        }
    }

    /// Add a participant stake to the escrow. Each participant may
    /// only contribute once — subsequent calls revert so the aggregate
    /// counters stay consistent. A paused or already-released escrow
    /// rejects new deposits.
    pub fn fund(
        env: Env,
        participant: Address,
        escrow_id: u32,
        amount: u128,
    ) {
        participant.require_auth();
        assert!(amount > 0, "amount must be positive");
        let mut escrow =
            storage::get_escrow(&env, escrow_id).expect("Escrow not found");
        assert!(!escrow.paused, "Escrow paused");
        assert!(!escrow.released, "Escrow already released");
        assert!(
            storage::get_stake(&env, escrow_id, &participant).is_none(),
            "Participant already funded"
        );

        escrow.total_funded = escrow
            .total_funded
            .checked_add(amount)
            .expect("total_funded overflow");
        escrow.participant_count = escrow
            .participant_count
            .checked_add(1)
            .expect("participant_count overflow");
        storage::set_escrow(&env, &escrow);

        storage::set_stake(
            &env,
            &participant,
            &ParticipantStake {
                escrow_id,
                amount,
                funded_at: env.ledger().timestamp(),
            },
        );
    }

    /// Mark the escrow as released. Admin-gated. Reverts when the
    /// escrow is paused, underfunded, still in the delay window, or
    /// already released.
    pub fn release_funds(env: Env, admin: Address, escrow_id: u32) {
        require_admin(&env, &admin);
        let mut escrow =
            storage::get_escrow(&env, escrow_id).expect("Escrow not found");
        assert!(!escrow.paused, "Escrow paused");
        assert!(!escrow.released, "Escrow already released");
        assert!(
            escrow.total_funded >= escrow.required_amount,
            "Escrow underfunded"
        );
        let now = env.ledger().timestamp();
        let opens_at = escrow
            .created_at
            .saturating_add(escrow.release_delay_secs);
        assert!(now >= opens_at, "Release window not yet open");

        escrow.released = true;
        storage::set_escrow(&env, &escrow);
    }

    /// Coverage view: required vs funded + participant count + state.
    ///
    /// `coverage_bps = floor(10_000 * total_funded / required_amount)`,
    /// clamped at 10_000 (over-funding is fine but doesn't go above
    /// 100% in the UI). The `state` enum is the canonical branch
    /// signal — `Funding` (not yet at the required amount), `Active`
    /// (fully funded), `Paused`, `Released`, `Missing`, or
    /// `NotConfigured`.
    pub fn escrow_coverage_summary(env: Env, escrow_id: u32) -> EscrowCoverageSummary {
        let configured = is_configured(&env);
        let Some(escrow) = storage::get_escrow(&env, escrow_id) else {
            return EscrowCoverageSummary {
                escrow_id,
                configured,
                exists: false,
                state: if configured {
                    EscrowState::Missing
                } else {
                    EscrowState::NotConfigured
                },
                required_amount: 0,
                total_funded: 0,
                remaining_amount: 0,
                participant_count: 0,
                coverage_bps: 0,
                fully_funded: false,
            };
        };

        let fully_funded = escrow.total_funded >= escrow.required_amount;
        let remaining_amount = escrow
            .required_amount
            .saturating_sub(escrow.total_funded);
        let coverage_bps = if escrow.required_amount == 0 {
            0
        } else {
            let bps = escrow.total_funded.saturating_mul(10_000) / escrow.required_amount;
            core::cmp::min(bps, 10_000) as u32
        };

        let state = if escrow.released {
            EscrowState::Released
        } else if escrow.paused {
            EscrowState::Paused
        } else if fully_funded {
            EscrowState::Active
        } else {
            EscrowState::Funding
        };

        EscrowCoverageSummary {
            escrow_id,
            configured,
            exists: true,
            state,
            required_amount: escrow.required_amount,
            total_funded: escrow.total_funded,
            remaining_amount,
            participant_count: escrow.participant_count,
            coverage_bps,
            fully_funded,
        }
    }

    /// Release-delay view. The state distinguishes underfunded /
    /// waiting-for-window / releasable / released / blocked-by-pause,
    /// plus the missing / not-configured zero cases.
    pub fn release_delay_accessor(env: Env, escrow_id: u32) -> ReleaseDelayInfo {
        let configured = is_configured(&env);
        let now = env.ledger().timestamp();
        let Some(escrow) = storage::get_escrow(&env, escrow_id) else {
            return ReleaseDelayInfo {
                escrow_id,
                configured,
                exists: false,
                state: if configured {
                    ReleaseDelayState::Missing
                } else {
                    ReleaseDelayState::NotConfigured
                },
                created_at: 0,
                release_window_opens_at: 0,
                seconds_until_release: 0,
                required_amount: 0,
                total_funded: 0,
                fully_funded: false,
                paused: false,
                already_released: false,
            };
        };

        let fully_funded = escrow.total_funded >= escrow.required_amount;
        let opens_at = escrow
            .created_at
            .saturating_add(escrow.release_delay_secs);
        let seconds_until_release = opens_at.saturating_sub(now);

        let state = if escrow.released {
            ReleaseDelayState::Released
        } else if escrow.paused {
            ReleaseDelayState::Blocked
        } else if !fully_funded {
            ReleaseDelayState::Underfunded
        } else if now < opens_at {
            ReleaseDelayState::Waiting
        } else {
            ReleaseDelayState::Releasable
        };

        ReleaseDelayInfo {
            escrow_id,
            configured,
            exists: true,
            state,
            created_at: escrow.created_at,
            release_window_opens_at: opens_at,
            seconds_until_release,
            required_amount: escrow.required_amount,
            total_funded: escrow.total_funded,
            fully_funded,
            paused: escrow.paused,
            already_released: escrow.released,
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

#[cfg(test)]
mod test;
