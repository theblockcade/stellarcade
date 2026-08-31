#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, BytesN, Env};

const START_TS: u64 = 1_000;

fn setup() -> (Env, RaffleFixedPriceContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| l.timestamp = START_TS);

    let contract_id = env.register(RaffleFixedPriceContract, ());
    let client = RaffleFixedPriceContractClient::new(&env, &contract_id);
    (env, client)
}

#[test]
fn test_full_sellout_and_instant_draw() {
    let (env, client) = setup();
    let host = Address::generate(&env);
    let buyer1 = Address::generate(&env);
    let buyer2 = Address::generate(&env);

    let raffle_id = client.create_raffle(&host, &5u128, &10u32, &1000u128, &(START_TS + 3_600));

    client.buy_tickets(&raffle_id, &buyer1, &6);
    client.buy_tickets(&raffle_id, &buyer2, &4);

    let seed = BytesN::from_array(&env, &[7u8; 32]);
    let result = client.draw_raffle(&raffle_id, &seed);

    assert!(!result.cancelled);
    assert!(result.winner.is_some());
    assert!(result.winning_ticket.unwrap() < 10);
    assert_eq!(result.prize_amount, 1000u128);

    let summary = client.get_raffle_status(&raffle_id);
    assert_eq!(summary.phase, RafflePhase::Drawn);
    assert_eq!(summary.tickets_sold, 10);

    assert_eq!(client.get_draw_seed(&raffle_id), Some(seed));
}

#[test]
fn test_multi_ticket_purchase_sequential_ids() {
    let (env, client) = setup();
    let host = Address::generate(&env);
    let buyer1 = Address::generate(&env);
    let buyer2 = Address::generate(&env);

    let raffle_id = client.create_raffle(&host, &5u128, &20u32, &1000u128, &(START_TS + 3_600));

    let (start1, end1) = client.buy_tickets(&raffle_id, &buyer1, &5);
    assert_eq!((start1, end1), (0, 5));

    let (start2, end2) = client.buy_tickets(&raffle_id, &buyer2, &3);
    assert_eq!((start2, end2), (5, 8));

    let summary = client.get_raffle_status(&raffle_id);
    assert_eq!(summary.tickets_sold, 8);
}

#[test]
fn test_undersubscribed_cancellation_and_refund() {
    let (env, client) = setup();
    let host = Address::generate(&env);
    let buyer = Address::generate(&env);

    // 50% threshold of 10 tickets is 5; only buy 2.
    let raffle_id = client.create_raffle(&host, &5u128, &10u32, &1000u128, &(START_TS + 3_600));
    client.buy_tickets(&raffle_id, &buyer, &2);

    env.ledger().with_mut(|l| l.timestamp = START_TS + 3_601);

    let seed = BytesN::from_array(&env, &[1u8; 32]);
    let result = client.draw_raffle(&raffle_id, &seed);
    assert!(result.cancelled);
    assert!(result.winner.is_none());

    let summary = client.get_raffle_status(&raffle_id);
    assert_eq!(summary.phase, RafflePhase::Cancelled);

    let refund = client.claim_refund(&raffle_id, &buyer);
    assert_eq!(refund, 10u128); // 2 tickets * 5 price
}

#[test]
#[should_panic(expected = "nothing to refund")]
fn test_double_refund_claim_panics() {
    let (env, client) = setup();
    let host = Address::generate(&env);
    let buyer = Address::generate(&env);

    let raffle_id = client.create_raffle(&host, &5u128, &10u32, &1000u128, &(START_TS + 3_600));
    client.buy_tickets(&raffle_id, &buyer, &2);
    env.ledger().with_mut(|l| l.timestamp = START_TS + 3_601);
    let seed = BytesN::from_array(&env, &[1u8; 32]);
    client.draw_raffle(&raffle_id, &seed);

    client.claim_refund(&raffle_id, &buyer);
    client.claim_refund(&raffle_id, &buyer);
}

#[test]
#[should_panic(expected = "exceeds raffle ticket capacity")]
fn test_purchase_exceeding_capacity_panics() {
    let (_env, client) = setup();
    let host = Address::generate(&_env);
    let buyer = Address::generate(&_env);

    let raffle_id = client.create_raffle(&host, &5u128, &5u32, &1000u128, &(START_TS + 3_600));
    client.buy_tickets(&raffle_id, &buyer, &6);
}

#[test]
#[should_panic(expected = "raffle is not ready to draw")]
fn test_draw_before_sellout_or_deadline_panics() {
    let (env, client) = setup();
    let host = Address::generate(&env);
    let buyer = Address::generate(&env);

    let raffle_id = client.create_raffle(&host, &5u128, &10u32, &1000u128, &(START_TS + 3_600));
    client.buy_tickets(&raffle_id, &buyer, &2);

    let seed = BytesN::from_array(&env, &[3u8; 32]);
    client.draw_raffle(&raffle_id, &seed);
}
