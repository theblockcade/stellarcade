#![cfg(test)]

use soroban_sdk::{testutils::Address as _, token, vec, Address, Env};

use crate::{Error, RecipientShare, RoyaltyDistributor, RoyaltyDistributorClient};

struct Setup {
    env: Env,
    client: RoyaltyDistributorClient<'static>,
    token: token::Client<'static>,
    admin: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());

    let contract_id = env.register(RoyaltyDistributor, ());
    let client = RoyaltyDistributorClient::new(&env, &contract_id);

    Setup {
        token: token::Client::new(&env, &sac.address()),
        env,
        client,
        admin,
    }
}

fn fund(s: &Setup, who: &Address, amount: i128) {
    token::StellarAssetClient::new(&s.env, &s.token.address).mint(who, &amount);
}

#[test]
fn three_way_split_over_multiple_deposits_and_claims() {
    let s = setup();
    let depositor = Address::generate(&s.env);
    let (creator, artist, treasury) = (
        Address::generate(&s.env),
        Address::generate(&s.env),
        Address::generate(&s.env),
    );
    fund(&s, &depositor, 10_000);

    let split_id = s.client.create_split(
        &s.admin,
        &s.token.address,
        &vec![
            &s.env,
            RecipientShare {
                recipient: creator.clone(),
                share_bps: 5_000, // 50%
            },
            RecipientShare {
                recipient: artist.clone(),
                share_bps: 3_000, // 30%
            },
            RecipientShare {
                recipient: treasury.clone(),
                share_bps: 2_000, // 20%
            },
        ],
    );

    // First deposit.
    s.client.deposit_funds(&depositor, &split_id, &1_000);
    assert_eq!(s.client.get_claimable(&split_id, &creator), 500);
    assert_eq!(s.client.get_claimable(&split_id, &artist), 300);
    assert_eq!(s.client.get_claimable(&split_id, &treasury), 200);

    // creator claims their share so far.
    let paid = s.client.claim_share(&split_id, &creator);
    assert_eq!(paid, 500);
    assert_eq!(s.token.balance(&creator), 500);
    assert_eq!(s.client.get_claimable(&split_id, &creator), 0);

    // Second deposit — claimable balances reflect the cumulative total,
    // so creator's fresh claimable is only the new deposit's share, while
    // artist/treasury (who haven't claimed) see their full cumulative share.
    s.client.deposit_funds(&depositor, &split_id, &2_000);
    assert_eq!(s.client.get_claimable(&split_id, &creator), 1_000); // 50% of 2000
    assert_eq!(s.client.get_claimable(&split_id, &artist), 900); // 30% of 3000
    assert_eq!(s.client.get_claimable(&split_id, &treasury), 600); // 20% of 3000

    let artist_paid = s.client.claim_share(&split_id, &artist);
    assert_eq!(artist_paid, 900);
    let treasury_paid = s.client.claim_share(&split_id, &treasury);
    assert_eq!(treasury_paid, 600);

    let creator_paid_again = s.client.claim_share(&split_id, &creator);
    assert_eq!(creator_paid_again, 1_000);
    assert_eq!(s.token.balance(&creator), 1_500);
}

#[test]
fn invalid_share_sum_over_100_percent_is_rejected() {
    let s = setup();
    let (r1, r2) = (Address::generate(&s.env), Address::generate(&s.env));

    let result = s.client.try_create_split(
        &s.admin,
        &s.token.address,
        &vec![
            &s.env,
            RecipientShare {
                recipient: r1,
                share_bps: 6_000,
            },
            RecipientShare {
                recipient: r2,
                share_bps: 5_000,
            },
        ],
    );

    assert_eq!(result, Err(Ok(Error::InvalidShareSum)));
}

#[test]
fn invalid_share_sum_under_100_percent_is_rejected() {
    let s = setup();
    let (r1, r2) = (Address::generate(&s.env), Address::generate(&s.env));

    let result = s.client.try_create_split(
        &s.admin,
        &s.token.address,
        &vec![
            &s.env,
            RecipientShare {
                recipient: r1,
                share_bps: 4_000,
            },
            RecipientShare {
                recipient: r2,
                share_bps: 4_000,
            },
        ],
    );

    assert_eq!(result, Err(Ok(Error::InvalidShareSum)));
}

#[test]
fn batch_claim_pays_every_recipient_and_reports_amounts() {
    let s = setup();
    let depositor = Address::generate(&s.env);
    let (r1, r2) = (Address::generate(&s.env), Address::generate(&s.env));
    fund(&s, &depositor, 1_000);

    let split_id = s.client.create_split(
        &s.admin,
        &s.token.address,
        &vec![
            &s.env,
            RecipientShare {
                recipient: r1.clone(),
                share_bps: 7_000,
            },
            RecipientShare {
                recipient: r2.clone(),
                share_bps: 3_000,
            },
        ],
    );
    s.client.deposit_funds(&depositor, &split_id, &1_000);

    let results = s.client.claim_all(&split_id);
    assert_eq!(results.len(), 2);
    assert_eq!(results.get(0).unwrap(), (r1.clone(), 700));
    assert_eq!(results.get(1).unwrap(), (r2.clone(), 300));
    assert_eq!(s.token.balance(&r1), 700);
    assert_eq!(s.token.balance(&r2), 300);

    // A second batch claim with no new deposits pays everyone 0.
    let results_again = s.client.claim_all(&split_id);
    assert_eq!(results_again.get(0).unwrap(), (r1, 0));
    assert_eq!(results_again.get(1).unwrap(), (r2, 0));
}

#[test]
fn empty_recipients_is_rejected() {
    let s = setup();
    let result = s
        .client
        .try_create_split(&s.admin, &s.token.address, &vec![&s.env]);
    assert_eq!(result, Err(Ok(Error::EmptyRecipients)));
}

#[test]
fn zero_share_recipient_is_rejected() {
    let s = setup();
    let (r1, r2) = (Address::generate(&s.env), Address::generate(&s.env));
    let result = s.client.try_create_split(
        &s.admin,
        &s.token.address,
        &vec![
            &s.env,
            RecipientShare {
                recipient: r1,
                share_bps: 10_000,
            },
            RecipientShare {
                recipient: r2,
                share_bps: 0,
            },
        ],
    );
    assert_eq!(result, Err(Ok(Error::ZeroShare)));
}

#[test]
fn claiming_from_unknown_split_errors() {
    let s = setup();
    let recipient = Address::generate(&s.env);
    let result = s.client.try_get_claimable(&999, &recipient);
    assert_eq!(result, Err(Ok(Error::SplitNotFound)));
}

#[test]
fn non_recipient_cannot_claim() {
    let s = setup();
    let depositor = Address::generate(&s.env);
    let r1 = Address::generate(&s.env);
    let stranger = Address::generate(&s.env);
    fund(&s, &depositor, 1_000);

    let split_id = s.client.create_split(
        &s.admin,
        &s.token.address,
        &vec![
            &s.env,
            RecipientShare {
                recipient: r1,
                share_bps: 10_000,
            },
        ],
    );
    s.client.deposit_funds(&depositor, &split_id, &1_000);

    let result = s.client.try_claim_share(&split_id, &stranger);
    assert_eq!(result, Err(Ok(Error::NotARecipient)));
}

#[test]
fn zero_amount_deposit_is_rejected() {
    let s = setup();
    let depositor = Address::generate(&s.env);
    let r1 = Address::generate(&s.env);

    let split_id = s.client.create_split(
        &s.admin,
        &s.token.address,
        &vec![
            &s.env,
            RecipientShare {
                recipient: r1,
                share_bps: 10_000,
            },
        ],
    );

    let result = s.client.try_deposit_funds(&depositor, &split_id, &0);
    assert_eq!(result, Err(Ok(Error::InvalidAmount)));
}
