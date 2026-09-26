#![cfg(test)]

use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, IssuerFlags, Ledger},
    token, vec, Address, BytesN, Env, IntoVal, Symbol,
};

use crate::{Bounty, BountyEscrow, BountyEscrowClient, BountyStatus, PayoutTier};

const NOW: u64 = 1_000;
const DEADLINE: u64 = 2_000;

struct Setup<'a> {
    env: &'a Env,
    client: BountyEscrowClient<'a>,
    token: token::Client<'a>,
    token_admin: token::StellarAssetClient<'a>,
    sponsor: Address,
    oracle_a: Address,
    oracle_b: Address,
    stranger: Address,
}

fn setup(env: &Env, threshold: u32) -> Setup<'_> {
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);

    let admin = Address::generate(env);
    let sponsor = Address::generate(env);
    let oracle_a = Address::generate(env);
    let oracle_b = Address::generate(env);
    let stranger = Address::generate(env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    sac.issuer().set_flag(IssuerFlags::RevocableFlag);
    let token_admin = token::StellarAssetClient::new(env, &sac.address());
    let token = token::Client::new(env, &sac.address());
    let contract_id = env.register(BountyEscrow, ());
    let client = BountyEscrowClient::new(env, &contract_id);
    let oracles = vec![env, oracle_a.clone(), oracle_b.clone()];
    client.initialize(&admin, &sac.address(), &oracles, &threshold);

    Setup {
        env,
        client,
        token,
        token_admin,
        sponsor,
        oracle_a,
        oracle_b,
        stranger,
    }
}

fn fund(s: &Setup<'_>, amount: i128) {
    s.token_admin.mint(&s.sponsor, &amount);
}

fn post(s: &Setup<'_>, amount: i128, score: u32) -> u64 {
    fund(s, amount);
    s.client.post_bounty(
        &s.sponsor,
        &Symbol::new(s.env, "speedrun"),
        &score,
        &amount,
        &DEADLINE,
    )
}

fn proof(env: &Env, marker: u8) -> BytesN<32> {
    BytesN::from_array(env, &[marker; 32])
}

#[test]
fn funded_claim_waits_for_oracle_threshold_then_pays_once() {
    let env = Env::default();
    let s = setup(&env, 2);
    let bounty_id = post(&s, 100, 50);
    let player = Address::generate(&env);
    let claim_id = s
        .client
        .submit_claim(&player, &bounty_id, &75, &proof(&env, 1));

    assert_eq!(s.token.balance(&s.sponsor), 0);
    assert_eq!(s.token.balance(&player), 0);
    assert_eq!(s.token.balance(&s.client.address), 100);

    assert_eq!(
        s.client.approve_bounty(&s.oracle_a, &bounty_id, &claim_id),
        0
    );
    assert_eq!(s.token.balance(&player), 0);
    assert_eq!(
        s.client.approve_bounty(&s.oracle_b, &bounty_id, &claim_id),
        100
    );
    assert_eq!(s.token.balance(&player), 100);
    assert_eq!(s.token.balance(&s.client.address), 0);
    assert!(s.client.get_claim(&bounty_id, &claim_id).paid);

    assert!(s
        .client
        .try_approve_bounty(&s.oracle_a, &bounty_id, &claim_id)
        .is_err());
}

#[test]
fn tiered_claim_pays_highest_qualified_amount_and_caps_the_pool() {
    let env = Env::default();
    let s = setup(&env, 1);
    fund(&s, 100);
    let tiers = vec![
        &env,
        PayoutTier {
            min_score: 10,
            amount: 25,
        },
        PayoutTier {
            min_score: 50,
            amount: 75,
        },
    ];
    let bounty_id = s.client.post_bounty_with_tiers(
        &s.sponsor,
        &Symbol::new(&env, "speedrun"),
        &tiers,
        &DEADLINE,
    );

    let first_player = Address::generate(&env);
    let first_claim = s
        .client
        .submit_claim(&first_player, &bounty_id, &20, &proof(&env, 2));
    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_a, &bounty_id, &first_claim),
        25
    );

    let second_player = Address::generate(&env);
    let second_claim = s
        .client
        .submit_claim(&second_player, &bounty_id, &60, &proof(&env, 3));
    assert_eq!(
        s.client
            .approve_bounty(&s.sponsor, &bounty_id, &second_claim),
        75
    );

    let bounty: Bounty = s.client.get_bounty(&bounty_id);
    assert_eq!(bounty.total_amount, 100);
    assert_eq!(bounty.remaining_amount, 0);
    assert_eq!(bounty.status, BountyStatus::Exhausted);
    assert_eq!(s.token.balance(&first_player), 25);
    assert_eq!(s.token.balance(&second_player), 75);
}

#[test]
fn one_low_tier_claim_cannot_drain_the_higher_tier_reserve() {
    let env = Env::default();
    let s = setup(&env, 1);
    fund(&s, 100);
    let tiers = vec![
        &env,
        PayoutTier {
            min_score: 10,
            amount: 25,
        },
        PayoutTier {
            min_score: 50,
            amount: 75,
        },
    ];
    let bounty_id = s.client.post_bounty_with_tiers(
        &s.sponsor,
        &Symbol::new(&env, "speedrun"),
        &tiers,
        &DEADLINE,
    );

    let first_player = Address::generate(&env);
    let first_claim = s
        .client
        .submit_claim(&first_player, &bounty_id, &10, &proof(&env, 10));
    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_a, &bounty_id, &first_claim),
        25
    );

    let second_player = Address::generate(&env);
    assert!(s
        .client
        .try_submit_claim(&second_player, &bounty_id, &20, &proof(&env, 11))
        .is_err());

    let high_score_claim = s
        .client
        .submit_claim(&second_player, &bounty_id, &50, &proof(&env, 12));
    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_a, &bounty_id, &high_score_claim),
        75
    );
    assert_eq!(s.token.balance(&second_player), 75);
}

#[test]
fn sponsor_deposit_authorization_covers_the_token_transfer() {
    let env = Env::default();
    let s = setup(&env, 1);
    post(&s, 100, 50);
    let auths = env.auths();
    assert_eq!(auths.len(), 1);
    let (address, invocation) = &auths[0];
    assert_eq!(address, &s.sponsor);
    assert_eq!(
        invocation.function,
        AuthorizedFunction::Contract((
            s.client.address.clone(),
            Symbol::new(&env, "post_bounty"),
            (
                &s.sponsor,
                Symbol::new(&env, "speedrun"),
                50u32,
                100i128,
                DEADLINE
            )
                .into_val(&env),
        ))
    );
    assert_eq!(invocation.sub_invocations.len(), 1);
    assert_eq!(
        invocation.sub_invocations[0].function,
        AuthorizedFunction::Contract((
            s.token.address.clone(),
            Symbol::new(&env, "transfer"),
            (&s.sponsor, &s.client.address, 100i128).into_val(&env),
        ))
    );
}

#[test]
fn unsigned_mutations_are_rejected() {
    let env = Env::default();
    let s = setup(&env, 1);
    let bounty_id = post(&s, 100, 50);
    let player = Address::generate(&env);
    let claim_id = s
        .client
        .submit_claim(&player, &bounty_id, &50, &proof(&env, 23));
    env.mock_auths(&[]);
    assert!(s
        .client
        .try_submit_claim(&player, &bounty_id, &50, &proof(&env, 24))
        .is_err());
    assert!(s
        .client
        .try_post_bounty(
            &s.sponsor,
            &Symbol::new(&env, "speedrun"),
            &50,
            &100,
            &DEADLINE
        )
        .is_err());
    assert!(s
        .client
        .try_approve_bounty(&s.oracle_a, &bounty_id, &claim_id)
        .is_err());
    env.ledger().set_timestamp(DEADLINE + 1);
    assert!(s.client.try_refund_expired(&s.sponsor, &bounty_id).is_err());
    assert_eq!(s.token.balance(&s.client.address), 100);
    assert!(!s.client.get_claim(&bounty_id, &claim_id).paid);
}

#[test]
fn failed_transfer_keeps_the_claim_retryable() {
    let env = Env::default();
    let s = setup(&env, 1);
    let bounty_id = post(&s, 100, 50);
    let player = Address::generate(&env);
    let claim_id = s
        .client
        .submit_claim(&player, &bounty_id, &50, &proof(&env, 25));
    s.token_admin.set_authorized(&player, &false);
    assert!(s
        .client
        .try_approve_bounty(&s.oracle_a, &bounty_id, &claim_id)
        .is_err());
    assert_eq!(s.client.get_bounty(&bounty_id).remaining_amount, 100);
    assert!(!s.client.get_claim(&bounty_id, &claim_id).paid);
    assert_eq!(s.token.balance(&player), 0);
    s.token_admin.set_authorized(&player, &true);
    assert_eq!(
        s.client.approve_bounty(&s.oracle_a, &bounty_id, &claim_id),
        100
    );
    assert_eq!(s.token.balance(&player), 100);
}

#[test]
fn unapproved_copy_cannot_block_the_proof_owner() {
    let env = Env::default();
    let s = setup(&env, 1);
    let bounty_id = post(&s, 100, 50);
    let owner = Address::generate(&env);
    let hash = proof(&env, 20);

    // A session hash can be public before its owner claims the reward.
    // Approvers will not approve the copy, so submission must not consume it.
    let copied_claim = s.client.submit_claim(&s.stranger, &bounty_id, &50, &hash);
    let owner_claim = s.client.submit_claim(&owner, &bounty_id, &50, &hash);
    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_a, &bounty_id, &owner_claim),
        100
    );
    assert_eq!(s.token.balance(&owner), 100);
    assert_eq!(s.token.balance(&s.stranger), 0);
    assert!(!s.client.get_claim(&bounty_id, &copied_claim).paid);
}

#[test]
fn claim_rejects_low_scores_and_reused_proofs() {
    let env = Env::default();
    let s = setup(&env, 1);
    let bounty_id = post(&s, 100, 50);
    let first_player = Address::generate(&env);

    assert!(s
        .client
        .try_submit_claim(&first_player, &bounty_id, &49, &proof(&env, 4))
        .is_err());

    let hash = proof(&env, 5);
    s.client.submit_claim(&first_player, &bounty_id, &50, &hash);
    assert!(s
        .client
        .try_submit_claim(&first_player, &bounty_id, &50, &hash)
        .is_err());
}

#[test]
fn only_one_pending_claim_with_the_same_proof_can_settle() {
    let env = Env::default();
    let s = setup(&env, 2);
    let first_bounty = post(&s, 100, 50);
    let second_bounty = post(&s, 100, 50);
    let first_player = Address::generate(&env);
    let second_player = Address::generate(&env);
    let hash = proof(&env, 21);
    let first_claim = s
        .client
        .submit_claim(&first_player, &first_bounty, &50, &hash);
    let second_claim = s
        .client
        .submit_claim(&second_player, &second_bounty, &50, &hash);

    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_a, &first_bounty, &first_claim),
        0
    );
    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_a, &second_bounty, &second_claim),
        0
    );
    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_b, &first_bounty, &first_claim),
        100
    );
    assert!(s
        .client
        .try_approve_bounty(&s.oracle_b, &second_bounty, &second_claim)
        .is_err());
    assert_eq!(s.token.balance(&first_player), 100);
    assert_eq!(s.token.balance(&second_player), 0);
    assert_eq!(s.client.get_bounty(&second_bounty).remaining_amount, 100);
    assert!(!s.client.get_claim(&second_bounty, &second_claim).paid);
    assert!(s
        .client
        .try_submit_claim(&first_player, &second_bounty, &50, &hash)
        .is_err());
    env.ledger().set_timestamp(DEADLINE + 1);
    assert_eq!(s.client.refund_expired(&s.sponsor, &second_bounty), 100);
}

#[test]
fn only_configured_oracles_or_sponsor_can_approve() {
    let env = Env::default();
    let s = setup(&env, 1);
    let bounty_id = post(&s, 100, 50);
    let player = Address::generate(&env);
    let claim_id = s
        .client
        .submit_claim(&player, &bounty_id, &50, &proof(&env, 6));

    assert!(s
        .client
        .try_approve_bounty(&s.stranger, &bounty_id, &claim_id)
        .is_err());
    assert_eq!(s.token.balance(&player), 0);
    assert_eq!(s.client.get_claim(&bounty_id, &claim_id).approvals.len(), 0);
}

#[test]
fn sponsor_can_refund_remaining_pool_only_after_expiry() {
    let env = Env::default();
    let s = setup(&env, 1);
    let bounty_id = post(&s, 100, 50);
    let player = Address::generate(&env);
    let claim_id = s
        .client
        .submit_claim(&player, &bounty_id, &50, &proof(&env, 7));
    assert_eq!(
        s.client.approve_bounty(&s.oracle_a, &bounty_id, &claim_id),
        100
    );

    // A second bounty remains partly unspent when its deadline passes.
    let second_id = post(&s, 120, 50);
    let second_player = Address::generate(&env);
    let second_claim = s
        .client
        .submit_claim(&second_player, &second_id, &50, &proof(&env, 8));
    // Threshold is one, so this payout consumes the whole single-tier pool.
    // A separate tiered pool below verifies an actual partial refund.
    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_a, &second_id, &second_claim),
        120
    );

    fund(&s, 100);
    let tiers = vec![
        &env,
        PayoutTier {
            min_score: 10,
            amount: 25,
        },
        PayoutTier {
            min_score: 50,
            amount: 75,
        },
    ];
    let third_id = s.client.post_bounty_with_tiers(
        &s.sponsor,
        &Symbol::new(&env, "speedrun"),
        &tiers,
        &DEADLINE,
    );
    let third_player = Address::generate(&env);
    let third_claim = s
        .client
        .submit_claim(&third_player, &third_id, &10, &proof(&env, 9));
    assert_eq!(
        s.client
            .approve_bounty(&s.oracle_a, &third_id, &third_claim),
        25
    );

    env.ledger().set_timestamp(DEADLINE);
    assert!(s.client.try_refund_expired(&s.sponsor, &third_id).is_err());
    env.ledger().set_timestamp(DEADLINE + 1);
    assert_eq!(s.client.refund_expired(&s.sponsor, &third_id), 75);
    assert_eq!(s.token.balance(&s.sponsor), 75);
    assert_eq!(
        s.client.get_bounty(&third_id).status,
        BountyStatus::Refunded
    );
    assert!(s
        .client
        .try_approve_bounty(&s.sponsor, &third_id, &third_claim)
        .is_err());
}

#[test]
fn invalid_oracle_configuration_and_tier_order_are_rejected() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(token_admin);
    let contract_id = env.register(BountyEscrow, ());
    let client = BountyEscrowClient::new(&env, &contract_id);
    env.mock_all_auths();
    let oracle = Address::generate(&env);
    let duplicate_oracles = vec![&env, oracle.clone(), oracle];
    assert!(client
        .try_initialize(&admin, &sac.address(), &duplicate_oracles, &1)
        .is_err());

    let s = setup(&env, 1);
    fund(&s, 100);
    let invalid_tiers = vec![
        &env,
        PayoutTier {
            min_score: 50,
            amount: 75,
        },
        PayoutTier {
            min_score: 10,
            amount: 25,
        },
    ];
    assert!(s
        .client
        .try_post_bounty_with_tiers(
            &s.sponsor,
            &Symbol::new(&env, "speedrun"),
            &invalid_tiers,
            &DEADLINE
        )
        .is_err());
}
