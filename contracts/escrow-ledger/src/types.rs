use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum SettlementState {
    Pending,
    Settled,
    Disputed,
    NotConfigured,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct EscrowRecord {
    pub escrow_id: u64,
    pub payor: soroban_sdk::Address,
    pub payee: soroban_sdk::Address,
    pub amount: i128,
    pub locked_until: u64,
    pub settled: bool,
    pub disputed: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct LiabilitySummary {
    pub configured: bool,
    pub total_escrowed: i128,
    pub total_settled: i128,
    pub total_disputed: i128,
    pub pending_count: u32,
    pub settled_count: u32,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct SettlementWindow {
    pub escrow_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: SettlementState,
    pub amount: i128,
    pub locked_until: u64,
    pub now: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct LedgerBalanceSummary {
    pub configured: bool,
    pub total_escrowed: i128,
    pub total_settled: i128,
    pub total_disputed: i128,
    pub pending_count: u32,
    pub settled_count: u32,
    pub net_balance: i128,
    pub dispute_exposure: i128,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct DisputeWindowAccessor {
    pub escrow_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub state: SettlementState,
    pub amount: i128,
    pub locked_until: u64,
    pub dispute_window_secs: u64,
    pub dispute_deadline: u64,
    pub in_dispute_window: bool,
    pub window_remaining: u64,
    pub now: u64,
}
