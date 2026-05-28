use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoucherIssuanceSummary {
    pub round_id: u32,
    pub exists: bool,
    pub total_issued: u64,
    pub total_redeemed: u64,
    pub max_vouchers: u64,
    pub remaining: u64,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RedemptionGapAccessor {
    pub voucher_id: u64,
    pub exists: bool,
    pub round_id: u32,
    pub redeemable_after: u64,
    pub redeemed: bool,
    pub paused: bool,
    pub now: u64,
    pub seconds_until_redeemable: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoucherRoundRecord {
    pub max_vouchers: u64,
    pub total_issued: u64,
    pub total_redeemed: u64,
    pub redeemable_after: u64,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoundVoucherRecord {
    pub round_id: u32,
    pub redeemed: bool,
}
