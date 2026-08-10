extern crate std;

use soroban_sdk::{testutils::Address as _, vec, Address, Env};

use crate::{MemberPayout, SquadRewards, SquadRewardsClient};

fn setup() -> (Env, Address, soroban_sdk::Address, SquadRewardsClient<'static>) {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(SquadRewards, ());
    let client = SquadRewardsClient::new(&env, &id);
    env.mock_all_auths();
    client.init(&admin);
    (env, admin, id, client)
}

#[test]
fn team_payout_coverage_success_path() {
    let (env, admin, _id, client) = setup();
    let payouts = vec![
        &env,
        MemberPayout { member_index: 0, amount: 100, claimed: false },
        MemberPayout { member_index: 1, amount: 200, claimed: false },
    ];
    client.fund_pool(&admin, &300);
    client.register_members(&admin, &payouts);
    client.claim(&0);

    let coverage = client.team_payout_coverage();
    assert_eq!(coverage.total_members, 2);
    assert_eq!(coverage.claimed_count, 1);
    assert_eq!(coverage.unclaimed_count, 1);
    assert_eq!(coverage.total_amount, 300);
    assert_eq!(coverage.claimed_amount, 100);
}

#[test]
fn claim_readiness_empty_state() {
    let (_env, _admin, _id, client) = setup();
    let readiness = client.claim_readiness();
    assert!(!readiness.is_ready);
    assert_eq!(readiness.members_registered, 0);
    assert!(!readiness.pool_funded);
}

#[test]
fn claim_readiness_with_members_and_pool() {
    let (env, admin, _id, client) = setup();
    let payouts = vec![
        &env,
        MemberPayout { member_index: 0, amount: 500, claimed: false },
    ];
    client.fund_pool(&admin, &500);
    client.register_members(&admin, &payouts);

    let readiness = client.claim_readiness();
    assert!(readiness.is_ready);
    assert_eq!(readiness.members_registered, 1);
    assert!(readiness.pool_funded);
    assert_eq!(readiness.total_pool, 500);
}
