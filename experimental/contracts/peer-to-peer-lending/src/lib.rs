//! Stellarcade Peer-to-Peer Lending Contract (experimental)
//!
//! Collateralized micro-lending between players: a borrower posts a loan
//! request locking collateral (e.g. at a 150% collateral ratio relative to
//! the requested loan amount), a lender funds it, and the borrower repays
//! principal + interest before maturity to reclaim the collateral. If the
//! borrower defaults (the loan is overdue past its maturity timestamp),
//! the lender may liquidate and claim the full collateral instead.
//!
//! Like sibling contracts in this experimental workspace (see
//! `rental-vault`, `escrow-milestone`), this contract is bookkeeping-only:
//! it tracks who is owed what (principal, interest, collateral) but does
//! not itself move tokens. A caller integrating this contract is
//! responsible for the actual token transfers once `fund_loan`,
//! `repay_loan`, or `liquidate_loan` report the amounts owed.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env};

pub use types::{LoanStatus, LoanSummary};
use types::Loan;

/// Minimum collateral ratio: collateral must be at least 150% of the loan
/// amount (`collateral_amount * 100 >= loan_amount * MIN_COLLATERAL_RATIO_BPS / 100`,
/// expressed in basis points below).
pub const MIN_COLLATERAL_RATIO_BPS: u32 = 15_000;
const BPS_DENOMINATOR: u128 = 10_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    LoanNotFound = 1,
    InvalidLoanAmount = 2,
    InvalidCollateralRatio = 3,
    InvalidInterestRate = 4,
    InvalidDuration = 5,
    LoanNotRequested = 6,
    LoanNotActive = 7,
    UnauthorizedBorrower = 8,
    UnauthorizedLender = 9,
    LoanNotMatured = 10,
    LoanAlreadySettled = 11,
}

#[contract]
pub struct PeerToPeerLending;

#[contractimpl]
impl PeerToPeerLending {
    /// Posts a new loan request. `collateral_amount` must be at least
    /// `MIN_COLLATERAL_RATIO_BPS` (150%) of `loan_amount`. The loan sits in
    /// `Requested` status, with collateral considered locked (bookkeeping
    /// only), until a lender funds it via `fund_loan`.
    pub fn create_loan_request(
        env: Env,
        borrower: Address,
        loan_amount: u128,
        collateral_amount: u128,
        interest_bps: u32,
        duration_sec: u64,
    ) -> Result<u64, Error> {
        borrower.require_auth();

        if loan_amount == 0 {
            return Err(Error::InvalidLoanAmount);
        }
        if duration_sec == 0 {
            return Err(Error::InvalidDuration);
        }
        // interest_bps == 0 (interest-free loan) is allowed; only guard
        // against nonsensical values above 100% (10_000 bps).
        if interest_bps as u128 > BPS_DENOMINATOR {
            return Err(Error::InvalidInterestRate);
        }
        if collateral_amount * BPS_DENOMINATOR < loan_amount * (MIN_COLLATERAL_RATIO_BPS as u128) {
            return Err(Error::InvalidCollateralRatio);
        }

        let loan_id = storage::get_next_loan_id(&env);
        storage::set_next_loan_id(&env, loan_id + 1);

        let loan = Loan {
            loan_id,
            borrower,
            lender: None,
            loan_amount,
            collateral_amount,
            interest_bps,
            duration_sec,
            status: LoanStatus::Requested,
            funded_at: 0,
            maturity_at: 0,
        };

        storage::set_loan(&env, &loan);
        Ok(loan_id)
    }

    /// Funds a `Requested` loan: the lender is recorded, the loan
    /// transitions to `Active`, and the maturity timestamp is set to
    /// `now + duration_sec`. Returns the principal amount owed to the
    /// borrower (bookkeeping-only; see module docs).
    pub fn fund_loan(env: Env, loan_id: u64, lender: Address) -> Result<u128, Error> {
        lender.require_auth();

        let mut loan = storage::get_loan(&env, loan_id).ok_or(Error::LoanNotFound)?;

        if loan.status != LoanStatus::Requested {
            return Err(Error::LoanNotRequested);
        }

        let now = env.ledger().timestamp();
        loan.lender = Some(lender);
        loan.status = LoanStatus::Active;
        loan.funded_at = now;
        loan.maturity_at = now + loan.duration_sec;

        storage::set_loan(&env, &loan);
        Ok(loan.loan_amount)
    }

    /// Repays an `Active` loan in full (principal + interest) before
    /// maturity. Only the borrower may repay. Returns the total amount owed
    /// to the lender (principal + interest); the collateral is released
    /// back to the borrower as part of this settlement (bookkeeping-only).
    pub fn repay_loan(env: Env, loan_id: u64, borrower: Address) -> Result<u128, Error> {
        borrower.require_auth();

        let mut loan = storage::get_loan(&env, loan_id).ok_or(Error::LoanNotFound)?;

        if loan.borrower != borrower {
            return Err(Error::UnauthorizedBorrower);
        }
        match loan.status {
            LoanStatus::Requested => return Err(Error::LoanNotActive),
            LoanStatus::Repaid | LoanStatus::Liquidated => return Err(Error::LoanAlreadySettled),
            LoanStatus::Active => {}
        }

        let interest = (loan.loan_amount * (loan.interest_bps as u128)) / BPS_DENOMINATOR;
        let total_owed = loan.loan_amount + interest;

        loan.status = LoanStatus::Repaid;
        storage::set_loan(&env, &loan);
        Ok(total_owed)
    }

    /// Liquidates an overdue `Active` loan (past `maturity_at`) whose
    /// borrower has not repaid. Only the funding lender may liquidate.
    /// Returns the full collateral amount now owed to the lender
    /// (bookkeeping-only).
    pub fn liquidate_loan(env: Env, loan_id: u64, lender: Address) -> Result<u128, Error> {
        lender.require_auth();

        let mut loan = storage::get_loan(&env, loan_id).ok_or(Error::LoanNotFound)?;

        if loan.lender != Some(lender) {
            return Err(Error::UnauthorizedLender);
        }
        match loan.status {
            LoanStatus::Requested => return Err(Error::LoanNotActive),
            LoanStatus::Repaid | LoanStatus::Liquidated => return Err(Error::LoanAlreadySettled),
            LoanStatus::Active => {}
        }
        if env.ledger().timestamp() < loan.maturity_at {
            return Err(Error::LoanNotMatured);
        }

        loan.status = LoanStatus::Liquidated;
        storage::set_loan(&env, &loan);
        Ok(loan.collateral_amount)
    }

    /// Read-only summary of a loan's current state.
    pub fn get_loan_status(env: Env, loan_id: u64) -> Result<LoanSummary, Error> {
        let loan = storage::get_loan(&env, loan_id).ok_or(Error::LoanNotFound)?;
        Ok(LoanSummary {
            loan_id: loan.loan_id,
            borrower: loan.borrower,
            lender: loan.lender,
            loan_amount: loan.loan_amount,
            collateral_amount: loan.collateral_amount,
            interest_bps: loan.interest_bps,
            duration_sec: loan.duration_sec,
            status: loan.status,
            funded_at: loan.funded_at,
            maturity_at: loan.maturity_at,
        })
    }
}
