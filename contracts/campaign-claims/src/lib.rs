#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    BudgetExhaustion, CampaignRecord, ClaimSaturationSummary, ClaimWindowState,
    ClaimWindowSummary, CooldownWindowAccessor,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Campaign(u64),
    PendingClaim(u64, Address),
}

#[contract]
pub struct CampaignClaims;

#[contractimpl]
impl CampaignClaims {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }

        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Create or update a campaign definition while preserving committed claim
    /// accounting. `budget` must remain at or above the already committed
    /// amount so existing pending or claimed rewards stay valid.
    pub fn upsert_campaign(
        env: Env,
        admin: Address,
        campaign_id: u64,
        budget: i128,
        starts_at: u64,
        ends_at: u64,
        paused: bool,
    ) {
        require_admin(&env, &admin);
        assert!(budget > 0, "Budget must be positive");
        assert!(starts_at < ends_at, "Invalid claim window");

        let mut record = storage::get_campaign(&env, campaign_id).unwrap_or(CampaignRecord {
            campaign_id,
            budget,
            committed_budget: 0,
            claimed_budget: 0,
            remaining_budget: budget,
            starts_at,
            ends_at,
            paused,
            pending_claimants: 0,
            total_claims: 0,
        });

        assert!(
            budget >= record.committed_budget,
            "Budget cannot be reduced below committed amount"
        );

        record.budget = budget;
        record.remaining_budget = budget
            .checked_sub(record.committed_budget)
            .expect("Committed budget overflow");
        record.starts_at = starts_at;
        record.ends_at = ends_at;
        record.paused = paused;

        storage::set_campaign(&env, &record);
    }

    /// Commit budget for a pending user claim during the active claim window.
    /// This reduces `remaining_budget` immediately so the accessor never needs
    /// to reconstruct commitment totals from individual claimant balances.
    pub fn record_claim(env: Env, admin: Address, campaign_id: u64, user: Address, amount: i128) {
        require_admin(&env, &admin);
        assert!(amount > 0, "Claim amount must be positive");

        let now = env.ledger().timestamp();
        let mut campaign = storage::get_campaign(&env, campaign_id).expect("Campaign not found");
        assert!(!campaign.paused, "Campaign paused");
        assert!(
            read_window_state(now, &campaign) == ClaimWindowState::Open,
            "Claim window closed"
        );
        assert!(
            campaign.remaining_budget >= amount,
            "Campaign budget exhausted"
        );

        let existing_pending = storage::get_pending_claim(&env, campaign_id, &user).unwrap_or(0);
        if existing_pending == 0 {
            campaign.pending_claimants = campaign
                .pending_claimants
                .checked_add(1)
                .expect("Pending claimant overflow");
        }

        let next_pending = existing_pending
            .checked_add(amount)
            .expect("Pending claim overflow");
        campaign.committed_budget = campaign
            .committed_budget
            .checked_add(amount)
            .expect("Committed budget overflow");
        campaign.remaining_budget = campaign
            .budget
            .checked_sub(campaign.committed_budget)
            .expect("Remaining budget overflow");

        storage::set_pending_claim(&env, campaign_id, &user, &next_pending);
        storage::set_campaign(&env, &campaign);
    }

    /// Claim the caller's committed reward. Paused campaigns intentionally
    /// block this path so reads and writes agree on the currently blocked state.
    pub fn claim(env: Env, user: Address, campaign_id: u64) -> i128 {
        user.require_auth();

        let mut campaign = storage::get_campaign(&env, campaign_id).expect("Campaign not found");
        assert!(!campaign.paused, "Campaign paused");

        let amount = storage::get_pending_claim(&env, campaign_id, &user).unwrap_or(0);
        assert!(amount > 0, "Nothing to claim");

        storage::remove_pending_claim(&env, campaign_id, &user);
        campaign.pending_claimants = campaign
            .pending_claimants
            .checked_sub(1)
            .expect("Pending claimant underflow");
        campaign.claimed_budget = campaign
            .claimed_budget
            .checked_add(amount)
            .expect("Claimed budget overflow");
        campaign.total_claims = campaign
            .total_claims
            .checked_add(1)
            .expect("Claim count overflow");

        storage::set_campaign(&env, &campaign);
        amount
    }

    /// Return a stable claim-window summary for `campaign_id`.
    ///
    /// Before `init` the response is zeroed with `configured = false` and
    /// `state = NotConfigured`. Unknown campaign ids after initialization return
    /// `configured = true`, `exists = false`, and `state = Missing`. Time-state
    /// uses the current ledger timestamp and the window is open when
    /// `starts_at <= now <= ends_at`.
    pub fn claim_window_summary(env: Env, campaign_id: u64) -> ClaimWindowSummary {
        let now = env.ledger().timestamp();
        let configured = is_configured(&env);

        let Some(campaign) = storage::get_campaign(&env, campaign_id) else {
            return ClaimWindowSummary {
                campaign_id,
                configured,
                exists: false,
                state: if configured {
                    ClaimWindowState::Missing
                } else {
                    ClaimWindowState::NotConfigured
                },
                now,
                starts_at: 0,
                ends_at: 0,
                budget: 0,
                remaining_budget: 0,
                pending_claimants: 0,
                total_claims: 0,
            };
        };

        ClaimWindowSummary {
            campaign_id,
            configured,
            exists: true,
            state: read_window_state(now, &campaign),
            now,
            starts_at: campaign.starts_at,
            ends_at: campaign.ends_at,
            budget: campaign.budget,
            remaining_budget: campaign.remaining_budget,
            pending_claimants: campaign.pending_claimants,
            total_claims: campaign.total_claims,
        }
    }

    /// Return a compact budget exhaustion view for `campaign_id`.
    ///
    /// `exhaustion_bps` uses floor division in basis points:
    /// `committed_budget * 10_000 / budget`. Missing and not-yet-configured
    /// campaigns return zero balances and `exhaustion_bps = 0`.
    pub fn budget_exhaustion(env: Env, campaign_id: u64) -> BudgetExhaustion {
        let summary = Self::claim_window_summary(env.clone(), campaign_id);
        if !summary.exists {
            return BudgetExhaustion {
                campaign_id,
                configured: summary.configured,
                exists: false,
                state: summary.state,
                paused: false,
                budget: 0,
                committed_budget: 0,
                claimed_budget: 0,
                remaining_budget: 0,
                exhaustion_bps: 0,
                can_record_claims: false,
            };
        }

        let campaign = storage::get_campaign(&env, campaign_id)
            .expect("Campaign summary and storage out of sync");
        let exhaustion_bps = if campaign.budget > 0 {
            let committed = u128::try_from(campaign.committed_budget).expect("negative committed");
            let budget = u128::try_from(campaign.budget).expect("negative budget");
            u32::try_from((committed * 10_000) / budget).expect("bps overflow")
        } else {
            0
        };

        BudgetExhaustion {
            campaign_id,
            configured: summary.configured,
            exists: true,
            state: summary.state,
            paused: campaign.paused,
            budget: campaign.budget,
            committed_budget: campaign.committed_budget,
            claimed_budget: campaign.claimed_budget,
            remaining_budget: campaign.remaining_budget,
            exhaustion_bps,
            can_record_claims: summary.state == ClaimWindowState::Open
                && campaign.remaining_budget > 0,
        }
    }

    /// Return a structured claim saturation summary for `campaign_id`.
    ///
    /// Saturation uses floor division in basis points:
    /// `committed_budget * 10_000 / budget`. Unknown ids and unconfigured
    /// contracts return zero balances with `exists = false`.
    pub fn claim_saturation_summary(env: Env, campaign_id: u64) -> ClaimSaturationSummary {
        let summary = Self::claim_window_summary(env.clone(), campaign_id);
        if !summary.exists {
            return ClaimSaturationSummary {
                campaign_id,
                configured: summary.configured,
                exists: false,
                state: summary.state,
                paused: false,
                budget: 0,
                committed_budget: 0,
                claimed_budget: 0,
                remaining_budget: 0,
                pending_claimants: 0,
                total_claims: 0,
                saturation_bps: 0,
                saturated: false,
            };
        }

        let campaign = storage::get_campaign(&env, campaign_id)
            .expect("Campaign summary and storage out of sync");
        let saturation_bps = saturation_bps(campaign.committed_budget, campaign.budget);

        ClaimSaturationSummary {
            campaign_id,
            configured: summary.configured,
            exists: true,
            state: summary.state,
            paused: campaign.paused,
            budget: campaign.budget,
            committed_budget: campaign.committed_budget,
            claimed_budget: campaign.claimed_budget,
            remaining_budget: campaign.remaining_budget,
            pending_claimants: campaign.pending_claimants,
            total_claims: campaign.total_claims,
            saturation_bps,
            saturated: campaign.remaining_budget == 0,
        }
    }

    /// Return the claim cooldown/window timing for `campaign_id`.
    ///
    /// Missing and not-yet-configured campaigns return zero timestamps and
    /// durations. Paused campaigns keep their configured times but
    /// `can_record_claims = false`.
    pub fn cooldown_window_accessor(env: Env, campaign_id: u64) -> CooldownWindowAccessor {
        let summary = Self::claim_window_summary(env, campaign_id);
        let seconds_until_open = if summary.state == ClaimWindowState::Scheduled {
            summary.starts_at.saturating_sub(summary.now)
        } else {
            0
        };
        let seconds_until_closed = if summary.state == ClaimWindowState::Open {
            summary.ends_at.saturating_sub(summary.now)
        } else {
            0
        };

        CooldownWindowAccessor {
            campaign_id,
            configured: summary.configured,
            exists: summary.exists,
            state: summary.state,
            now: summary.now,
            starts_at: summary.starts_at,
            ends_at: summary.ends_at,
            seconds_until_open,
            seconds_until_closed,
            can_record_claims: summary.state == ClaimWindowState::Open
                && summary.remaining_budget > 0,
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

fn read_window_state(now: u64, campaign: &CampaignRecord) -> ClaimWindowState {
    if campaign.paused {
        ClaimWindowState::Paused
    } else if now < campaign.starts_at {
        ClaimWindowState::Scheduled
    } else if now <= campaign.ends_at {
        ClaimWindowState::Open
    } else {
        ClaimWindowState::Closed
    }
}

fn saturation_bps(committed_budget: i128, budget: i128) -> u32 {
    if budget <= 0 || committed_budget <= 0 {
        0
    } else {
        let committed = u128::try_from(committed_budget).expect("negative committed");
        let budget = u128::try_from(budget).expect("negative budget");
        u32::try_from((committed * 10_000) / budget).expect("bps overflow")
    }
}

#[cfg(test)]
mod test;
