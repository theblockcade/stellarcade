#![cfg(test)]

use super::*;
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{Address, Env};

fn setup<'a>() -> (Env, Address, RoundVouchersClient<'a>) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_000);
    let contract_id = env.register(RoundVouchers, ());
    let client = RoundVouchersClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    client.init(&admin);
    (env, admin, client)
}

#[test]
fn issuance_summary_tracks_round_supply_and_redemptions() {
    let (env, admin, client) = setup();
    client.upsert_round(&admin, &3u32, &2u64, &2_000u64, &false);
    client.issue_voucher(&admin, &11u64, &3u32);
    client.issue_voucher(&admin, &12u64, &3u32);

    let before = client.voucher_issuance_summary(&3u32);
    assert_eq!(before.total_issued, 2);
    assert_eq!(before.remaining, 0);
    assert_eq!(before.total_redeemed, 0);

    env.ledger().set_timestamp(2_100);
    client.redeem_voucher(&admin, &11u64);
    let after = client.voucher_issuance_summary(&3u32);
    assert_eq!(after.total_redeemed, 1);
}

#[test]
fn redemption_gap_accessor_reports_missing_and_countdown() {
    let (env, admin, client) = setup();
    let missing = client.redemption_gap_accessor(&404u64);
    assert_eq!(missing.exists, false);

    client.upsert_round(&admin, &5u32, &0u64, &5_000u64, &false);
    client.issue_voucher(&admin, &77u64, &5u32);
    let before = client.redemption_gap_accessor(&77u64);
    assert_eq!(before.exists, true);
    assert_eq!(before.seconds_until_redeemable, 4_000);

    env.ledger().set_timestamp(5_500);
    let after = client.redemption_gap_accessor(&77u64);
    assert_eq!(after.seconds_until_redeemable, 0);
}
