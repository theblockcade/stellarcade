#![cfg(test)]

use soroban_sdk::{symbol_short, testutils::Address as _, token, vec, Address, Env};

use crate::{Error, TipInstruction, TippingPool, TippingPoolClient};

const PLATFORM_FEE_BPS: u32 = 100; // 1%

struct Setup {
    env: Env,
    client: TippingPoolClient<'static>,
    token: token::Client<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());

    let contract_id = env.register(TippingPool, ());
    let client = TippingPoolClient::new(&env, &contract_id);
    client.initialize(&admin, &sac.address(), &PLATFORM_FEE_BPS);

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
    }
}

fn fund(s: &Setup, player: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.token.address).mint(player, &amount);
}

#[test]
fn single_tip_credits_balance_net_of_fee_and_withdraws_correctly() {
    let s = setup();
    let tipper = Address::generate(&s.env);
    let creator = Address::generate(&s.env);
    fund(&s, &tipper, 1_000);

    let net = s
        .client
        .tip_creator(&tipper, &creator, &1_000, &symbol_short!("gg"));

    // 1% fee on 1000 = 10, net = 990.
    assert_eq!(net, 990);
    assert_eq!(s.client.get_creator_tip_balance(&creator), 990);
    assert_eq!(s.token.balance(&tipper), 0);
    assert_eq!(s.token.balance(&s.client.address), 1_000);

    let withdrawn = s.client.withdraw_tips(&creator);
    assert_eq!(withdrawn, 990);
    assert_eq!(s.client.get_creator_tip_balance(&creator), 0);
    assert_eq!(s.token.balance(&creator), 990);
    // The 10-unit fee stays in the contract (not withdrawn by the creator).
    assert_eq!(s.token.balance(&s.client.address), 10);
}

#[test]
fn batch_tip_to_three_creators_in_a_single_payment() {
    let s = setup();
    let tipper = Address::generate(&s.env);
    let (c1, c2, c3) = (
        Address::generate(&s.env),
        Address::generate(&s.env),
        Address::generate(&s.env),
    );
    fund(&s, &tipper, 1_000);

    let tips = vec![
        &s.env,
        TipInstruction {
            creator: c1.clone(),
            amount: 100,
            memo: symbol_short!("clip1"),
        },
        TipInstruction {
            creator: c2.clone(),
            amount: 200,
            memo: symbol_short!("clip2"),
        },
        TipInstruction {
            creator: c3.clone(),
            amount: 300,
            memo: symbol_short!("clip3"),
        },
    ];

    s.client.batch_tip(&tipper, &tips);

    assert_eq!(s.client.get_creator_tip_balance(&c1), 99); // 100 - 1%
    assert_eq!(s.client.get_creator_tip_balance(&c2), 198); // 200 - 1%
    assert_eq!(s.client.get_creator_tip_balance(&c3), 297); // 300 - 1%
    assert_eq!(s.token.balance(&tipper), 400); // 1000 - (100+200+300)
}

#[test]
#[should_panic]
fn batch_tip_panics_when_tipper_balance_is_insufficient() {
    let s = setup();
    let tipper = Address::generate(&s.env);
    let (c1, c2) = (Address::generate(&s.env), Address::generate(&s.env));
    // Only enough for the first tip, not both.
    fund(&s, &tipper, 100);

    let tips = vec![
        &s.env,
        TipInstruction {
            creator: c1.clone(),
            amount: 100,
            memo: symbol_short!("a"),
        },
        TipInstruction {
            creator: c2.clone(),
            amount: 100,
            memo: symbol_short!("b"),
        },
    ];

    // The second transfer fails for insufficient balance, panicking and
    // aborting the whole host invocation — Soroban does not commit partial
    // state from a reverted transaction, so there is no risk of c1 being
    // credited while c2's tip fails.
    s.client.batch_tip(&tipper, &tips);
}

#[test]
fn memo_and_tipper_are_tracked_in_recent_tips() {
    let s = setup();
    let tipper = Address::generate(&s.env);
    let creator = Address::generate(&s.env);
    fund(&s, &tipper, 1_000);

    s.client
        .tip_creator(&tipper, &creator, &500, &symbol_short!("nice"));

    let tips = s.client.get_recent_tips(&creator);
    assert_eq!(tips.len(), 1);
    let record = tips.get(0).unwrap();
    assert_eq!(record.tipper, tipper);
    assert_eq!(record.net_amount, 495);
    assert_eq!(record.memo, symbol_short!("nice"));
}

#[test]
fn a_creators_balance_is_independent_of_other_creators() {
    // withdraw_tips always pays out to its `creator` argument, which must
    // itself authorize the call — there is no path for one creator to
    // direct another creator's accrued balance to themselves. This test
    // confirms tipping one creator never bleeds into another's balance.
    let s = setup();
    let tipper = Address::generate(&s.env);
    let creator = Address::generate(&s.env);
    let stranger = Address::generate(&s.env);
    fund(&s, &tipper, 1_000);

    s.client
        .tip_creator(&tipper, &creator, &1_000, &symbol_short!("hi"));

    assert_eq!(s.client.get_creator_tip_balance(&stranger), 0);
    assert_eq!(s.client.get_creator_tip_balance(&creator), 990);
}

#[test]
#[should_panic]
fn withdrawing_with_zero_balance_panics() {
    let s = setup();
    let creator = Address::generate(&s.env);
    s.client.withdraw_tips(&creator);
}

#[test]
fn zero_amount_tip_is_rejected() {
    let s = setup();
    let tipper = Address::generate(&s.env);
    let creator = Address::generate(&s.env);
    fund(&s, &tipper, 1_000);

    let result = s
        .client
        .try_tip_creator(&tipper, &creator, &0, &symbol_short!("x"));
    assert_eq!(result, Err(Ok(Error::InvalidAmount)));
}

#[test]
fn empty_batch_is_rejected() {
    let s = setup();
    let tipper = Address::generate(&s.env);
    fund(&s, &tipper, 1_000);

    let result = s.client.try_batch_tip(&tipper, &vec![&s.env]);
    assert_eq!(result, Err(Ok(Error::EmptyBatch)));
}
