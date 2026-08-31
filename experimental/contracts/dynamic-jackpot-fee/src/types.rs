use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FeeDeductionSummary {
    pub wager_amount: i128,
    pub fee_bps: u32,
    pub fee_amount: i128,
    pub jackpot_amount: i128,
    pub pool_amount: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VolumeStats {
    pub total_24h_volume: u128,
    pub current_fee_bps: u32,
}
