use soroban_sdk::contracttype;

/// Summary of issuance activity for a voucher type.
///
/// Returned by `issuance_summary`. When the voucher type has not been
/// configured, `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IssuanceSummary {
    pub voucher_type_id: u32,
    /// `true` when the voucher type exists in storage.
    pub exists: bool,
    /// Total vouchers issued so far.
    pub total_issued: u64,
    /// Maximum vouchers that may be issued (0 = uncapped).
    pub max_supply: u64,
    /// Remaining issuable vouchers. `u64::MAX` when uncapped.
    pub remaining: u64,
    /// Whether new issuance is currently paused.
    pub paused: bool,
}

/// Claim-expiry details for a specific voucher instance.
///
/// Returned by `claim_expiry`. When the voucher id is unknown, `exists` is
/// `false` and timing fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ClaimExpiry {
    pub voucher_id: u64,
    /// `true` when the voucher id exists in storage.
    pub exists: bool,
    /// Ledger sequence after which the voucher can no longer be claimed.
    pub expires_at_ledger: u32,
    /// Whether the voucher has already been claimed.
    pub claimed: bool,
    /// Whether the voucher is currently expired (based on current ledger).
    pub is_expired: bool,
}

/// Persistent voucher-type record.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoucherTypeRecord {
    pub max_supply: u64,
    pub total_issued: u64,
    pub paused: bool,
}

/// Persistent per-voucher record.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoucherRecord {
    pub voucher_type_id: u32,
    pub expires_at_ledger: u32,
    pub claimed: bool,
}
