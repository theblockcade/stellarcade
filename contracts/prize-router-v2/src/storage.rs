use soroban_sdk::contracttype;

pub const PERSISTENT_BUMP: u32 = 518_400; // ~30 days

#[contracttype]
pub enum DataKey {
    Admin,
    /// Vec<PendingPayout>
    Queue,
    /// u32 — payout delay in ledgers applied to every new enqueue
    DelayLedgers,
    /// u32 — pending_count threshold at which overloaded=true
    PressureThreshold,
    Paused,
}
