use soroban_sdk::{contracttype, Address, Symbol};

pub const PERSISTENT_BUMP: u32 = 518_400; // ~30 days

#[contracttype]
pub enum DataKey {
    Admin,
    /// DailyChallenge for a given id.
    Challenge(Symbol),
    /// Vec<Symbol> — list of registered challenge ids.
    ChallengeIds,
    /// bool — completion flag for (challenge, player).
    Completion(Symbol, Address),
    /// u32 — refresh interval in ledgers.
    RefreshInterval,
    /// u32 — ledger of last refresh.
    LastRefreshAt,
    Paused,
}
