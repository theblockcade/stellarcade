use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PoolTotals {
    pub total_supplied: i128,
    pub total_borrowed: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct UtilizationSnapshot {
    pub configured: bool,
    pub total_supplied: i128,
    pub total_borrowed: i128,
    pub available_liquidity: i128,
    pub utilization_bps: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct LiquidationBufferSnapshot {
    pub configured: bool,
    pub liquidation_buffer_bps: u32,
    pub has_borrow_exposure: bool,
}
