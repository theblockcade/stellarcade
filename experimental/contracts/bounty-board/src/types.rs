use soroban_sdk::{contracttype, Address, BytesN};

/// Lifecycle stage of a bounty.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum BountyStatus {
    /// Created and funded; open for hunter claims.
    Open,
    /// A hunter has claimed the bounty and is working on it.
    Claimed,
    /// The hunter submitted a deliverable; awaiting creator review.
    Submitted,
    /// The creator approved the work (or the review window lapsed) and the
    /// reward has been released to the hunter.
    Completed,
    /// The creator cancelled an expired, unclaimed bounty and was refunded.
    Cancelled,
}

/// Optional BountyStatus wrapper for use in `#[contracttype]` structs.
/// Soroban's XDR layer does not support `Option<CustomEnum>` directly.
///
/// Zero-state: `OptionalBountyStatus::None`
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum OptionalBountyStatus {
    None,
    Some(BountyStatus),
}

/// Persistent storage record for a single bounty.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountyRecord {
    pub bounty_id: u64,
    /// Address of the creator who funded the bounty.
    pub creator: Address,
    /// Escrowed reward amount, locked in the contract until payout.
    pub reward_amount: i128,
    /// Ledger sequence by which the bounty must be claimed.
    pub deadline: u32,
    /// Hash of the bounty description / task spec.
    pub desc_hash: BytesN<32>,
    pub status: BountyStatus,
    /// Address of the hunter who claimed the bounty, if any.
    pub hunter: Option<Address>,
    /// Hash of the submitted deliverable, if any.
    pub proof_hash: Option<BytesN<32>>,
    /// Ledger sequence by which the creator must review submitted work.
    /// Zero when no work has been submitted yet.
    pub review_deadline: u32,
}

/// View of a single bounty returned to callers by `get_bounty`.
///
/// Zero-state fallback (when `exists` is `false`): every field is `None` /
/// `OptionalBountyStatus::None` and `review_deadline` is `None`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct BountySummary {
    pub bounty_id: u64,
    pub exists: bool,
    pub creator: Option<Address>,
    pub reward_amount: Option<i128>,
    pub deadline: Option<u32>,
    pub desc_hash: Option<BytesN<32>>,
    pub status: OptionalBountyStatus,
    pub hunter: Option<Address>,
    pub proof_hash: Option<BytesN<32>>,
    pub review_deadline: Option<u32>,
}
