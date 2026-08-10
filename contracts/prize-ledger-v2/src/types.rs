use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug)]
pub struct PrizeRecord {
    pub prize_id: u64,
    pub recipient: Address,
    pub amount: i128,
    pub payout_at: u64,
    pub paid: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct LiabilityRollupSummary {
    pub configured: bool,
    pub total_prizes: u32,
    pub unpaid_count: u32,
    pub total_liability: i128,
    pub paid_count: u32,
    pub total_paid: i128,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct PayoutWindowAccessor {
    pub prize_id: u64,
    pub exists: bool,
    pub paid: bool,
    pub amount: i128,
    pub payout_at: u64,
    pub window_ledgers: u32,
    pub window_deadline: u64,
    pub in_payout_window: bool,
    pub now: u64,
}
