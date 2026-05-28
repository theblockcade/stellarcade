use soroban_sdk::contracttype;

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum QuestState {
    NotConfigured,
    Missing,
    Active,
    Paused,
}

/// Storage-backed quest definition. The active / paid counters are mutated
/// in-place by `record_completion` and `mark_paid` so the summary view can
/// stay O(1).
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct QuestConfig {
    pub quest_id: u32,
    /// Per-completion payout in token base units.
    pub payout_per_completion: u128,
    pub pending_completion_count: u32,
    pub paid_completion_count: u32,
    pub total_payout_owed: u128,
    pub total_payout_paid: u128,
    pub paused: bool,
}

/// Per-completion record, keyed by `(quest_id, user)`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CompletionRecord {
    pub quest_id: u32,
    pub completed_at: u64,
    pub paid: bool,
}

/// Structured response for `completion_queue_summary` (#776).
///
/// Fields are flat (rather than `Option`s) so consumers can render a panel
/// before any completions exist. `total_completion_count` is the sum of
/// pending + paid and is surfaced as a single field so the frontend does
/// not have to compute it.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CompletionQueueSummary {
    pub quest_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub state: QuestState,
    pub payout_per_completion: u128,
    pub pending_completion_count: u32,
    pub paid_completion_count: u32,
    pub total_completion_count: u32,
}

/// Structured response for `payout_gap_accessor` (#776).
///
/// `gap = owed - paid` — surfaced explicitly so the UI doesn't have to do
/// any arithmetic. Underflow is impossible because `mark_paid` enforces
/// `owed >= paid` on every write.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PayoutGapInfo {
    pub quest_id: u32,
    pub configured: bool,
    pub exists: bool,
    pub state: QuestState,
    pub total_payout_owed: u128,
    pub total_payout_paid: u128,
    pub payout_gap: u128,
}
