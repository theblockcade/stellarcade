#![cfg(test)]

use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env};

use crate::{Error, LoanStatus, PeerToPeerLending, PeerToPeerLendingClient};

const ONE_DAY: u64 = 86_400;

fn setup() -> (Env, PeerToPeerLendingClient<'static>, Address) {
    let env = Env::default();
    env.mock_all_auths();
    let borrower = Address::generate(&env);
    let contract_id = env.register(PeerToPeerLending, ());
    let client = PeerToPeerLendingClient::new(&env, &contract_id);
    (env, client, borrower)
}

#[test]
fn full_loan_lifecycle_create_fund_repay_collateral_returned() {
    let (env, client, borrower) = setup();
    let lender = Address::generate(&env);

    let loan_amount: u128 = 1_000;
    let collateral_amount: u128 = 1_500; // 150% ratio
    let interest_bps: u32 = 500; // 5%

    let loan_id = client.create_loan_request(
        &borrower,
        &loan_amount,
        &collateral_amount,
        &interest_bps,
        &ONE_DAY,
    );

    let summary = client.get_loan_status(&loan_id);
    assert_eq!(summary.status, LoanStatus::Requested);
    assert_eq!(summary.lender, None);

    let principal = client.fund_loan(&loan_id, &lender);
    assert_eq!(principal, loan_amount);

    let summary = client.get_loan_status(&loan_id);
    assert_eq!(summary.status, LoanStatus::Active);
    assert_eq!(summary.lender, Some(lender.clone()));
    assert_eq!(summary.maturity_at, summary.funded_at + ONE_DAY);

    // Repay before maturity: principal + 5% interest = 1050.
    let repayment = client.repay_loan(&loan_id, &borrower);
    assert_eq!(repayment, 1_050);

    let summary = client.get_loan_status(&loan_id);
    assert_eq!(summary.status, LoanStatus::Repaid);

    // Already settled: cannot repay or liquidate again.
    let result = client.try_repay_loan(&loan_id, &borrower);
    assert_eq!(result, Err(Ok(Error::LoanAlreadySettled)));

    let result = client.try_liquidate_loan(&loan_id, &lender);
    assert_eq!(result, Err(Ok(Error::LoanAlreadySettled)));
}

#[test]
fn default_and_successful_liquidation_by_lender() {
    let (env, client, borrower) = setup();
    let lender = Address::generate(&env);

    let loan_id = client.create_loan_request(&borrower, &1_000u128, &1_500u128, &500u32, &ONE_DAY);
    client.fund_loan(&loan_id, &lender);

    // Fast-forward past maturity without repayment.
    env.ledger().with_mut(|l| {
        l.timestamp += ONE_DAY + 1;
    });

    let collateral = client.liquidate_loan(&loan_id, &lender);
    assert_eq!(collateral, 1_500);

    let summary = client.get_loan_status(&loan_id);
    assert_eq!(summary.status, LoanStatus::Liquidated);

    // Borrower can no longer repay a liquidated loan.
    let result = client.try_repay_loan(&loan_id, &borrower);
    assert_eq!(result, Err(Ok(Error::LoanAlreadySettled)));
}

#[test]
fn premature_liquidation_is_rejected() {
    let (env, client, borrower) = setup();
    let lender = Address::generate(&env);

    let loan_id = client.create_loan_request(&borrower, &1_000u128, &1_500u128, &500u32, &ONE_DAY);
    client.fund_loan(&loan_id, &lender);

    // Still within the loan duration: liquidation must be rejected.
    let result = client.try_liquidate_loan(&loan_id, &lender);
    assert_eq!(result, Err(Ok(Error::LoanNotMatured)));

    // One second before maturity: still rejected.
    env.ledger().with_mut(|l| {
        l.timestamp += ONE_DAY - 1;
    });
    let result = client.try_liquidate_loan(&loan_id, &lender);
    assert_eq!(result, Err(Ok(Error::LoanNotMatured)));
}

#[test]
fn undercollateralized_loan_request_is_rejected() {
    let (_env, client, borrower) = setup();

    // 120% collateral ratio is below the required 150% minimum.
    let result =
        client.try_create_loan_request(&borrower, &1_000u128, &1_200u128, &500u32, &ONE_DAY);
    assert_eq!(result, Err(Ok(Error::InvalidCollateralRatio)));
}

#[test]
fn only_designated_lender_can_liquidate() {
    let (env, client, borrower) = setup();
    let lender = Address::generate(&env);
    let outsider = Address::generate(&env);

    let loan_id = client.create_loan_request(&borrower, &1_000u128, &1_500u128, &500u32, &ONE_DAY);
    client.fund_loan(&loan_id, &lender);

    env.ledger().with_mut(|l| {
        l.timestamp += ONE_DAY + 1;
    });

    let result = client.try_liquidate_loan(&loan_id, &outsider);
    assert_eq!(result, Err(Ok(Error::UnauthorizedLender)));
}

#[test]
fn only_borrower_can_repay() {
    let (env, client, borrower) = setup();
    let lender = Address::generate(&env);
    let outsider = Address::generate(&env);

    let loan_id = client.create_loan_request(&borrower, &1_000u128, &1_500u128, &500u32, &ONE_DAY);
    client.fund_loan(&loan_id, &lender);

    let result = client.try_repay_loan(&loan_id, &outsider);
    assert_eq!(result, Err(Ok(Error::UnauthorizedBorrower)));
}

#[test]
fn cannot_fund_an_already_active_loan() {
    let (env, client, borrower) = setup();
    let lender = Address::generate(&env);
    let second_lender = Address::generate(&env);

    let loan_id = client.create_loan_request(&borrower, &1_000u128, &1_500u128, &500u32, &ONE_DAY);
    client.fund_loan(&loan_id, &lender);

    let result = client.try_fund_loan(&loan_id, &second_lender);
    assert_eq!(result, Err(Ok(Error::LoanNotRequested)));
}
