use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, PartialEq, Eq, Debug)]
pub enum LockStatus {
    Locked,
    Unlockable,
    Unlocked,
    NotConfigured,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct LockRecord {
    pub lock_id: u64,
    pub locker: soroban_sdk::Address,
    pub amount: i128,
    pub locked_at: u64,
    pub unlock_time: u64,
    pub unlocked: bool,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct LockDurationBreakdown {
    pub configured: bool,
    pub total_locked_amount: i128,
    pub total_locks: u32,
    pub short_locks: u32,
    pub long_locks: u32,
    pub unlocked_amount: i128,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct UnlockPressure {
    pub lock_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub status: LockStatus,
    pub amount: i128,
    pub locked_at: u64,
    pub unlock_time: u64,
    pub now: u64,
    pub time_remaining: i64,
}
