//! Shared data types for the European roulette mini-contract.

use soroban_sdk::{contracttype, Address, Vec};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum BetType {
    Straight = 0,
    Split = 1,
    Red = 2,
    Black = 3,
    Odd = 4,
    Even = 5,
    Column = 6,
    Dozen = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Bet {
    pub bet_type: BetType,
    /// Straight: one number 0..=36. Split: two numbers. Column/Dozen: 1, 2, or 3.
    /// Color / odd-even: empty.
    pub numbers: Vec<u32>,
    pub amount: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Round {
    pub id: u64,
    pub player: Address,
    pub bets: Vec<Bet>,
    pub total_wager: u128,
    pub resolved: bool,
    pub winning_number: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SpinResult {
    pub round_id: u64,
    pub winning_number: u32,
    pub is_red: bool,
    pub total_payout: u128,
    pub house_rake: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TableLimitSummary {
    pub min_bet: u128,
    pub max_bet: u128,
    pub bankroll: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoundRecord {
    pub round_id: u64,
    pub winning_number: u32,
    pub total_wager: u128,
    pub total_payout: u128,
}
