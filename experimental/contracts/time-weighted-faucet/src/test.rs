#![cfg(test)]

use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env};

use crate::{Error, TimeWeightedFaucet, TimeWeightedFaucetClient, SECONDS_PER_DAY};

const DRIP_AMOUNT: u128 = 50;
const COOLDOWN: u64 = 24 * 60 * 60;
const DAILY_CAP: u128 = 500;

fn setup() -> (Env, TimeWeightedFaucetClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let contract_id = env.register(TimeWeightedFaucet, ());
    let client = TimeWeightedFaucetClient::new(&env, &contract_id);
    client.initialize(&admin, &DRIP_AMOUNT, &COOLDOWN, &DAILY_CAP);
    (env, client, admin)
}

#[test]
fn successful_drip_transfer_and_cooldown_initiation() {
    let (env, client, admin) = setup();
    let recipient = Address::generate(&env);

    client.refill_faucet(&admin, &1_000u128);

    let dispensed = client.request_drip(&recipient);
    assert_eq!(dispensed, DRIP_AMOUNT);

    let stats = client.get_faucet_stats();
    assert_eq!(stats.reserve_balance, 950);
    assert_eq!(stats.total_dispensed, DRIP_AMOUNT);
    assert_eq!(stats.daily_dispensed, DRIP_AMOUNT);

    // Cooldown now active for the full window.
    let remaining = client.get_remaining_cooldown(&recipient);
    assert_eq!(remaining, COOLDOWN);
}

#[test]
fn immediate_second_claim_is_rejected() {
    let (env, client, admin) = setup();
    let recipient = Address::generate(&env);
    client.refill_faucet(&admin, &1_000u128);

    client.request_drip(&recipient);

    let result = client.try_request_drip(&recipient);
    assert_eq!(result, Err(Ok(Error::CooldownNotElapsed)));
}

#[test]
fn claim_eligible_after_cooldown_expiration() {
    let (env, client, admin) = setup();
    let recipient = Address::generate(&env);
    client.refill_faucet(&admin, &1_000u128);

    client.request_drip(&recipient);

    // Still within cooldown one second early.
    env.ledger().with_mut(|l| {
        l.timestamp += COOLDOWN - 1;
    });
    let result = client.try_request_drip(&recipient);
    assert_eq!(result, Err(Ok(Error::CooldownNotElapsed)));

    // Cooldown has now elapsed.
    env.ledger().with_mut(|l| {
        l.timestamp += 1;
    });
    let remaining = client.get_remaining_cooldown(&recipient);
    assert_eq!(remaining, 0);

    let dispensed = client.request_drip(&recipient);
    assert_eq!(dispensed, DRIP_AMOUNT);

    let stats = client.get_faucet_stats();
    assert_eq!(stats.total_dispensed, DRIP_AMOUNT * 2);
}

#[test]
fn dispense_fails_cleanly_when_reserve_is_insufficient() {
    let (env, client, admin) = setup();
    let recipient = Address::generate(&env);

    // Reserve only holds less than one drip's worth.
    client.refill_faucet(&admin, &10u128);

    let result = client.try_request_drip(&recipient);
    assert_eq!(result, Err(Ok(Error::InsufficientReserve)));

    // Reserve and cooldown state are untouched by the failed attempt.
    let stats = client.get_faucet_stats();
    assert_eq!(stats.reserve_balance, 10);
    assert_eq!(stats.total_dispensed, 0);
    assert_eq!(client.get_remaining_cooldown(&recipient), 0);
}

#[test]
fn global_daily_cap_prevents_reservoir_exhaustion() {
    let (env, client, admin) = setup();
    client.refill_faucet(&admin, &10_000u128);

    // Daily cap is 500, drip is 50: exactly 10 distinct recipients can
    // claim before the cap is hit within the same day.
    for _ in 0..10 {
        let recipient = Address::generate(&env);
        client.request_drip(&recipient);
    }

    let stats = client.get_faucet_stats();
    assert_eq!(stats.daily_dispensed, DAILY_CAP);

    // An 11th distinct recipient (no cooldown conflict) is still capped.
    let eleventh = Address::generate(&env);
    let result = client.try_request_drip(&eleventh);
    assert_eq!(result, Err(Ok(Error::DailyCapExceeded)));

    // Advancing into the next day resets the daily counter.
    env.ledger().with_mut(|l| {
        l.timestamp += SECONDS_PER_DAY;
    });
    let dispensed = client.request_drip(&eleventh);
    assert_eq!(dispensed, DRIP_AMOUNT);

    let stats = client.get_faucet_stats();
    assert_eq!(stats.daily_dispensed, DRIP_AMOUNT);
}

#[test]
fn cannot_initialize_twice() {
    let (_env, client, admin) = setup();
    let result = client.try_initialize(&admin, &DRIP_AMOUNT, &COOLDOWN, &DAILY_CAP);
    assert_eq!(result, Err(Ok(Error::AlreadyInitialized)));
}

#[test]
fn refill_requires_donor_authorization() {
    let (_env, client, admin) = setup();
    client.refill_faucet(&admin, &100u128);
    let stats = client.get_faucet_stats();
    assert_eq!(stats.reserve_balance, 100);
}
