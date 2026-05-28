use soroban_sdk::contracttype;

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum EscrowState {
    NotConfigured,
    Missing,
    Funding,
    Active,
    Paused,
    Released,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum ReleaseDelayState {
    /// Pre-init.
    NotConfigured,
    /// The requested escrow id does not exist.
    Missing,
    /// The escrow exists but is not yet fully funded.
    Underfunded,
    /// Fully funded; the release window has not yet opened.
    Waiting,
    /// Fully funded and the release window has opened.
    Releasable,
    /// Funds have already been released.
    Released,
    /// Paused administratively — release affordance suppressed.
    Blocked,
}

/// Storage-backed lobby-escrow record. The aggregate `total_funded`
/// counter is kept in storage so the coverage summary is O(1) — no
/// need to scan participants on every read.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowConfig {
    pub escrow_id: u32,
    /// USD-equivalent (or token base-unit) total the escrow must hold
    /// before the lobby can launch. Set once at upsert; admins may
    /// increase but not decrease (mirrors the team-prizes precedent).
    pub required_amount: u128,
    pub total_funded: u128,
    pub participant_count: u32,
    /// Ledger timestamp at which the escrow was created. Used by the
    /// release-delay accessor.
    pub created_at: u64,
    /// Release window opens at `created_at + release_delay_secs`.
    pub release_delay_secs: u64,
    pub paused: bool,
    /// Set to `true` by `release_funds`; subsequent fundings revert.
    pub released: bool,
}

/// Per-participant deposit record, keyed by `(escrow_id, account)`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ParticipantStake {
    pub escrow_id: u32,
    pub amount: u128,
    pub funded_at: u64,
}

/// Structured response for `escrow_coverage_summary` (#815). The
/// `coverage_bps` field is `floor(10_000 * total_funded / required)`,
/// clamped at 10_000 to avoid surfacing >100% when the same account
/// over-funds.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowCoverageSummary {
    pub escrow_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub state: EscrowState,
    pub required_amount: u128,
    pub total_funded: u128,
    pub remaining_amount: u128,
    pub participant_count: u32,
    pub coverage_bps: u32,
    pub fully_funded: bool,
}

/// Structured response for `release_delay_accessor` (#815). All
/// timing fields are exact seconds; the `state` enum is the field
/// callers should branch on rather than inspecting sentinel zeros.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReleaseDelayInfo {
    pub escrow_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub state: ReleaseDelayState,
    pub created_at: u64,
    pub release_window_opens_at: u64,
    pub seconds_until_release: u64,
    pub required_amount: u128,
    pub total_funded: u128,
    pub fully_funded: bool,
    pub paused: bool,
    pub already_released: bool,
}
