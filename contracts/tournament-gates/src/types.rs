use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug)]
pub struct GateRecord {
    pub gate_id: u32,
    pub capacity: u32,
    pub entry_fee: i128,
    pub opens_at: u64,
    pub closes_at: u64,
    pub paused: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct GateHealthSnapshot {
    pub gate_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub paused: bool,
    pub capacity: u32,
    pub entry_fee: i128,
    pub opens_at: u64,
    pub closes_at: u64,
    pub is_open: bool,
    pub now: u64,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct UnlockDelayAccessor {
    pub gate_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub opens_at: u64,
    pub now: u64,
    pub ledgers_until_open: u64,
    pub already_open: bool,
}
