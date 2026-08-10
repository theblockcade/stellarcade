use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationState {
    pub email_verified: bool,
    pub phone_verified: bool,
    pub government_id_verified: bool,
    pub wallet_linked: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IdentityRecord {
    pub identity: Address,
    pub display_name: Option<String>,
    pub country_code: Option<String>,
    pub bio: Option<String>,
    pub avatar_uri: Option<String>,
    pub verification: VerificationState,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProfileCompleteness {
    pub identity: Address,
    pub exists: bool,
    pub score_bps: u32,
    pub completed_fields: u32,
    pub total_fields: u32,
    pub has_display_name: bool,
    pub has_country_code: bool,
    pub has_bio: bool,
    pub has_avatar_uri: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationSummary {
    pub identity: Address,
    pub exists: bool,
    pub completed_dimensions: u32,
    pub total_dimensions: u32,
    pub email_verified: bool,
    pub phone_verified: bool,
    pub government_id_verified: bool,
    pub wallet_linked: bool,
    pub is_fully_verified: bool,
    pub pending_requirements: Vec<String>,
}

/// Lifecycle state of an identity for renewal-window purposes.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum IdentityRenewalState {
    /// Contract has not been initialized yet.
    NotConfigured,
    /// Identity does not exist in the registry.
    Unknown,
    /// Identity exists but is not yet fully verified.
    Unverified,
    /// Identity is fully verified and the renewal window has not opened.
    Active,
    /// Identity is in the renewal window (approaching expiry).
    RenewalDue,
    /// Identity renewal window has passed; needs re-registration.
    Expired,
}

/// Point-in-time snapshot of an identity's verification status.
///
/// Combines profile existence with the four verification dimensions in one
/// call, suitable for display or gating access.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StatusVerificationSnapshot {
    pub identity: Address,
    pub configured: bool,
    pub exists: bool,
    pub email_verified: bool,
    pub phone_verified: bool,
    pub government_id_verified: bool,
    pub wallet_linked: bool,
    /// Number of dimensions completed (0–4).
    pub completed_dimensions: u32,
    pub total_dimensions: u32,
    pub is_fully_verified: bool,
    /// Completeness score in basis points (0–10 000).
    pub score_bps: u32,
}

/// Renewal-window details for a single identity.
///
/// The caller supplies `renewal_window_ledgers` — the number of ledgers before
/// `expires_at_ledger` at which the renewal window opens.
/// The contract does not store either value.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RenewalWindowAccessor {
    pub identity: Address,
    pub configured: bool,
    pub exists: bool,
    pub state: IdentityRenewalState,
    /// Caller-supplied absolute expiry ledger for this identity.
    pub expires_at_ledger: u32,
    /// Caller-supplied window size (in ledgers) before expiry.
    pub renewal_window_ledgers: u32,
    /// First ledger of the renewal window.
    pub renewal_window_start: u32,
    /// True when we are inside the renewal window.
    pub in_renewal_window: bool,
    /// True when the identity has passed its expiry ledger.
    pub is_expired: bool,
    /// Ledgers remaining until expiry (0 once expired).
    pub ledgers_until_expiry: u32,
    pub current_ledger: u32,
}
