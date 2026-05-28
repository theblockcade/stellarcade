#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

pub use types::{
    CampaignCoverage, CampaignRecord, CampaignStatus, CommittedFundsSummary,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Campaign(u64),
    OpenCampaigns,
    SettledCampaigns,
    CancelledCampaigns,
    OutstandingCommitted,
    LifetimeCommitted,
    LifetimeSettled,
    LifetimeCancelled,
}

#[contract]
pub struct SponsorPool;

#[contractimpl]
impl SponsorPool {
    /// Initialise the pool with an admin who can register / settle / cancel
    /// campaigns.
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    /// Register a new sponsorship campaign. Idempotent on `campaign_id`:
    /// re-registration with the same id panics so the operator notices.
    pub fn register_campaign(
        env: Env,
        admin: Address,
        campaign_id: u64,
        beneficiary: Address,
        token: Address,
        target_amount: i128,
    ) {
        require_admin(&env, &admin);
        admin.require_auth();
        assert!(target_amount > 0, "target_amount must be positive");
        if storage::get_campaign(&env, campaign_id).is_some() {
            panic!("Campaign already registered");
        }
        storage::set_campaign(
            &env,
            &CampaignRecord {
                campaign_id,
                beneficiary,
                token,
                target_amount,
                committed_amount: 0,
                settled: false,
                cancelled: false,
            },
        );
        bump_open(&env, 1);
    }

    /// Add `amount` worth of funds to `campaign_id`. The pool only tracks
    /// the committed amount; actual token movement is handled by the caller
    /// (treasury contract or user-side transfer) since on-chain custody is
    /// out of scope for the issue.
    pub fn commit_funds(env: Env, sponsor: Address, campaign_id: u64, amount: i128) {
        sponsor.require_auth();
        assert!(amount > 0, "amount must be positive");
        let mut campaign =
            storage::get_campaign(&env, campaign_id).expect("Campaign not found");
        assert!(!campaign.cancelled, "Campaign cancelled");
        assert!(!campaign.settled, "Campaign already settled");

        // Cap the running committed amount at the campaign target so a
        // late-arriving commit cannot push the pool past 100% coverage.
        let next = campaign
            .committed_amount
            .checked_add(amount)
            .expect("Overflow")
            .min(campaign.target_amount);
        let actually_committed = next - campaign.committed_amount;
        campaign.committed_amount = next;
        storage::set_campaign(&env, &campaign);

        bump_outstanding(&env, actually_committed);
        bump_lifetime_committed(&env, actually_committed);
    }

    /// Mark a campaign settled. Releases the committed amount as "settled"
    /// in the aggregate counters.
    pub fn settle(env: Env, admin: Address, campaign_id: u64) -> i128 {
        require_admin(&env, &admin);
        admin.require_auth();
        let mut campaign =
            storage::get_campaign(&env, campaign_id).expect("Campaign not found");
        assert!(!campaign.settled, "Already settled");
        assert!(!campaign.cancelled, "Campaign cancelled");

        campaign.settled = true;
        let committed = campaign.committed_amount;
        storage::set_campaign(&env, &campaign);

        bump_open(&env, -1);
        bump_settled_count(&env, 1);
        bump_outstanding(&env, -committed);
        bump_lifetime_settled(&env, committed);
        committed
    }

    /// Cancel a campaign. Returns the amount that was committed at cancel
    /// time so the caller can refund sponsors out-of-band.
    pub fn cancel(env: Env, admin: Address, campaign_id: u64) -> i128 {
        require_admin(&env, &admin);
        admin.require_auth();
        let mut campaign =
            storage::get_campaign(&env, campaign_id).expect("Campaign not found");
        assert!(!campaign.settled, "Cannot cancel a settled campaign");
        assert!(!campaign.cancelled, "Already cancelled");

        campaign.cancelled = true;
        let committed = campaign.committed_amount;
        storage::set_campaign(&env, &campaign);

        bump_open(&env, -1);
        bump_cancelled_count(&env, 1);
        bump_outstanding(&env, -committed);
        bump_lifetime_cancelled(&env, committed);
        committed
    }

    // ---------------------------------------------------------------------
    // Read-only accessors (the body of issues #521 / #541)
    // ---------------------------------------------------------------------

    /// Aggregate snapshot of the pool's committed funds across every state.
    pub fn committed_funds_summary(env: Env) -> CommittedFundsSummary {
        let configured = env.storage().instance().has(&DataKey::Admin);
        CommittedFundsSummary {
            configured,
            open_campaigns: storage::read_u32(&env, &DataKey::OpenCampaigns),
            settled_campaigns: storage::read_u32(&env, &DataKey::SettledCampaigns),
            cancelled_campaigns: storage::read_u32(&env, &DataKey::CancelledCampaigns),
            outstanding_committed: storage::read_i128(&env, &DataKey::OutstandingCommitted),
            lifetime_committed: storage::read_i128(&env, &DataKey::LifetimeCommitted),
            lifetime_settled: storage::read_i128(&env, &DataKey::LifetimeSettled),
            lifetime_cancelled: storage::read_i128(&env, &DataKey::LifetimeCancelled),
            now: env.ledger().timestamp(),
        }
    }

    /// Coverage view for a single campaign. Collapses to the documented
    /// fallback when the id is unknown or the pool is unconfigured so the
    /// frontend can render without a separate lookup.
    pub fn campaign_coverage(env: Env, campaign_id: u64) -> CampaignCoverage {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(campaign) = storage::get_campaign(&env, campaign_id) else {
            return CampaignCoverage {
                campaign_id,
                configured,
                exists: false,
                status: if configured {
                    CampaignStatus::Unknown
                } else {
                    CampaignStatus::NotConfigured
                },
                target_amount: 0,
                committed_amount: 0,
                remaining_amount: 0,
                coverage_bps: 0,
                now,
            };
        };

        let status = if campaign.cancelled {
            CampaignStatus::Cancelled
        } else if campaign.settled {
            CampaignStatus::Settled
        } else {
            CampaignStatus::Open
        };
        let remaining = (campaign.target_amount - campaign.committed_amount).max(0);
        // Integer basis points to keep the contract floating-point-free.
        // `coverage_bps = (committed * 10_000) / target`, capped at 10_000.
        let coverage_bps: u32 = if campaign.target_amount == 0 {
            0
        } else {
            let raw = (campaign.committed_amount * 10_000) / campaign.target_amount;
            raw.min(10_000) as u32
        };

        CampaignCoverage {
            campaign_id,
            configured,
            exists: true,
            status,
            target_amount: campaign.target_amount,
            committed_amount: campaign.committed_amount,
            remaining_amount: remaining,
            coverage_bps,
            now,
        }
    }
}

fn require_admin(env: &Env, claimed: &Address) {
    let stored: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    assert!(stored == *claimed, "Caller is not admin");
}

fn bump_open(env: &Env, delta: i32) {
    let count = storage::read_u32(env, &DataKey::OpenCampaigns);
    storage::write_u32(
        env,
        &DataKey::OpenCampaigns,
        storage::apply_count_delta(count, delta),
    );
}

fn bump_settled_count(env: &Env, delta: i32) {
    let count = storage::read_u32(env, &DataKey::SettledCampaigns);
    storage::write_u32(
        env,
        &DataKey::SettledCampaigns,
        storage::apply_count_delta(count, delta),
    );
}

fn bump_cancelled_count(env: &Env, delta: i32) {
    let count = storage::read_u32(env, &DataKey::CancelledCampaigns);
    storage::write_u32(
        env,
        &DataKey::CancelledCampaigns,
        storage::apply_count_delta(count, delta),
    );
}

fn bump_outstanding(env: &Env, delta: i128) {
    let value = storage::read_i128(env, &DataKey::OutstandingCommitted);
    storage::write_i128(env, &DataKey::OutstandingCommitted, value + delta);
}

fn bump_lifetime_committed(env: &Env, delta: i128) {
    let value = storage::read_i128(env, &DataKey::LifetimeCommitted);
    storage::write_i128(env, &DataKey::LifetimeCommitted, value + delta);
}

fn bump_lifetime_settled(env: &Env, delta: i128) {
    let value = storage::read_i128(env, &DataKey::LifetimeSettled);
    storage::write_i128(env, &DataKey::LifetimeSettled, value + delta);
}

fn bump_lifetime_cancelled(env: &Env, delta: i128) {
    let value = storage::read_i128(env, &DataKey::LifetimeCancelled);
    storage::write_i128(env, &DataKey::LifetimeCancelled, value + delta);
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};
    use soroban_sdk::{Address, Env};

    fn setup<'a>() -> (Env, Address, SponsorPoolClient<'a>) {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().set_timestamp(1_000);
        let contract_id = env.register(SponsorPool, ());
        let client = SponsorPoolClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.init(&admin);
        (env, admin, client)
    }

    fn register(
        env: &Env,
        client: &SponsorPoolClient,
        admin: &Address,
        campaign_id: u64,
        target: i128,
    ) -> Address {
        let beneficiary = Address::generate(env);
        let token = Address::generate(env);
        client.register_campaign(admin, &campaign_id, &beneficiary, &token, &target);
        beneficiary
    }

    #[test]
    fn committed_funds_summary_starts_at_zero() {
        let (_env, _admin, client) = setup();
        let s = client.committed_funds_summary();
        assert_eq!(s.configured, true);
        assert_eq!(s.open_campaigns, 0);
        assert_eq!(s.settled_campaigns, 0);
        assert_eq!(s.cancelled_campaigns, 0);
        assert_eq!(s.outstanding_committed, 0);
        assert_eq!(s.lifetime_committed, 0);
    }

    #[test]
    fn committed_funds_summary_tracks_lifecycle() {
        let (env, admin, client) = setup();
        let _b1 = register(&env, &client, &admin, 1, 1_000);
        let _b2 = register(&env, &client, &admin, 2, 500);
        let _b3 = register(&env, &client, &admin, 3, 2_000);

        let sponsor = Address::generate(&env);
        client.commit_funds(&sponsor, &1u64, &400i128);
        client.commit_funds(&sponsor, &2u64, &500i128);
        client.commit_funds(&sponsor, &3u64, &200i128);

        let s = client.committed_funds_summary();
        assert_eq!(s.open_campaigns, 3);
        assert_eq!(s.outstanding_committed, 1_100);
        assert_eq!(s.lifetime_committed, 1_100);

        client.settle(&admin, &2u64);
        client.cancel(&admin, &3u64);

        let s = client.committed_funds_summary();
        assert_eq!(s.open_campaigns, 1);
        assert_eq!(s.settled_campaigns, 1);
        assert_eq!(s.cancelled_campaigns, 1);
        // Only campaign 1 is still outstanding (400 committed).
        assert_eq!(s.outstanding_committed, 400);
        assert_eq!(s.lifetime_committed, 1_100);
        assert_eq!(s.lifetime_settled, 500);
        assert_eq!(s.lifetime_cancelled, 200);
    }

    #[test]
    fn campaign_coverage_unknown_id_returns_unknown_state() {
        let (_env, _admin, client) = setup();
        let c = client.campaign_coverage(&999u64);
        assert_eq!(c.exists, false);
        assert_eq!(c.status, CampaignStatus::Unknown);
        assert_eq!(c.configured, true);
        assert_eq!(c.coverage_bps, 0);
    }

    #[test]
    fn campaign_coverage_reports_status_and_basis_points() {
        let (env, admin, client) = setup();
        let _b = register(&env, &client, &admin, 1, 1_000);

        let zero = client.campaign_coverage(&1u64);
        assert_eq!(zero.status, CampaignStatus::Open);
        assert_eq!(zero.coverage_bps, 0);
        assert_eq!(zero.remaining_amount, 1_000);

        let sponsor = Address::generate(&env);
        client.commit_funds(&sponsor, &1u64, &500i128);

        let half = client.campaign_coverage(&1u64);
        assert_eq!(half.status, CampaignStatus::Open);
        assert_eq!(half.committed_amount, 500);
        assert_eq!(half.remaining_amount, 500);
        // 50% coverage → 5000 bps.
        assert_eq!(half.coverage_bps, 5_000);

        // A late commit larger than the remaining amount caps at the target.
        client.commit_funds(&sponsor, &1u64, &10_000i128);
        let full = client.campaign_coverage(&1u64);
        assert_eq!(full.committed_amount, 1_000);
        assert_eq!(full.remaining_amount, 0);
        assert_eq!(full.coverage_bps, 10_000);
    }

    #[test]
    fn campaign_coverage_reflects_settled_and_cancelled() {
        let (env, admin, client) = setup();
        let _b = register(&env, &client, &admin, 1, 1_000);
        let sponsor = Address::generate(&env);
        client.commit_funds(&sponsor, &1u64, &1_000i128);

        client.settle(&admin, &1u64);
        let s = client.campaign_coverage(&1u64);
        assert_eq!(s.status, CampaignStatus::Settled);
        assert_eq!(s.coverage_bps, 10_000);

        let _b2 = register(&env, &client, &admin, 2, 1_000);
        client.commit_funds(&sponsor, &2u64, &200i128);
        client.cancel(&admin, &2u64);
        let c = client.campaign_coverage(&2u64);
        assert_eq!(c.status, CampaignStatus::Cancelled);
        assert_eq!(c.committed_amount, 200);
    }

    #[test]
    fn commit_funds_caps_at_target() {
        let (env, admin, client) = setup();
        let _b = register(&env, &client, &admin, 1, 100);
        let sponsor = Address::generate(&env);
        client.commit_funds(&sponsor, &1u64, &500i128);
        let c = client.campaign_coverage(&1u64);
        assert_eq!(c.committed_amount, 100);
        assert_eq!(c.coverage_bps, 10_000);
        // outstanding mirrors the actually-committed amount, not the input.
        let s = client.committed_funds_summary();
        assert_eq!(s.outstanding_committed, 100);
        assert_eq!(s.lifetime_committed, 100);
    }
}
