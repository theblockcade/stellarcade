//! Shared data types for the peer-to-peer lending contract.

use soroban_sdk::{contracttype, Address};

/// Lifecycle of a loan.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum LoanStatus {
    /// Posted by the borrower, awaiting a lender.
    Requested,
    /// Funded by a lender; collateral locked, principal owed.
    Active,
    /// Repaid in full before maturity; collateral returned.
    Repaid,
    /// Overdue and liquidated by the lender; collateral forfeited.
    Liquidated,
}

/// A single collateralized loan.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Loan {
    pub loan_id: u64,
    pub borrower: Address,
    pub lender: Option<Address>,
    pub loan_amount: u128,
    pub collateral_amount: u128,
    pub interest_bps: u32,
    pub duration_sec: u64,
    pub status: LoanStatus,
    /// Ledger timestamp the loan was funded at (0 until funded).
    pub funded_at: u64,
    /// Ledger timestamp the loan matures at (`funded_at + duration_sec`,
    /// 0 until funded).
    pub maturity_at: u64,
}

/// Read-only external summary of a loan.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LoanSummary {
    pub loan_id: u64,
    pub borrower: Address,
    pub lender: Option<Address>,
    pub loan_amount: u128,
    pub collateral_amount: u128,
    pub interest_bps: u32,
    pub duration_sec: u64,
    pub status: LoanStatus,
    pub funded_at: u64,
    pub maturity_at: u64,
}
