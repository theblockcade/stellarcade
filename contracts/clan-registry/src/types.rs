use soroban_sdk::{contracttype, Address, Vec, String};

/// Summary of clan roster.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RosterSummary {
    /// Total number of clans.
    pub total_clans: u32,
    /// Total number of members across all clans.
    pub total_members: u32,
    /// Number of active clans.
    pub active_clans: u32,
}

/// Snapshot of pending invites.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PendingInviteSnapshot {
    /// Total number of pending invites.
    pub total_pending_invites: u32,
    /// Number of invites expiring soon.
    pub expiring_soon: u32,
    /// List of pending invite addresses.
    pub pending_addresses: Vec<Address>,
}