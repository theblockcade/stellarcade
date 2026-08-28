use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SyndicatePool {
    pub id: u64,
    pub manager: Address,
    pub share_price: u128,
    pub total_shares_bought: u32,
    pub max_shares: u32,
    pub target_lottery: Address,
    pub total_prizes: u128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MemberHolding {
    pub shares: u32,
    pub claimed_dividend: u128,
}
