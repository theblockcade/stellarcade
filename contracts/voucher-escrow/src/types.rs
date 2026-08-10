use soroban_sdk::contracttype;

/// Escrow record for a reserved voucher.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowRecord {
    pub voucher_id: u64,
    pub holder: soroban_sdk::Address,
    pub reserved_amount: i128,
    pub expiry_ledger: u32,
    pub claimed: bool,
}

/// Summary of all reserved vouchers in escrow.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReservedVoucherSummary {
    pub total_reserved: i128,
    pub active_escrow_count: u32,
    pub expired_escrow_count: u32,
    pub claimed_count: u32,
}

/// Expiry pressure: how many ledgers remain before a specific voucher expires.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ExpiryPressure {
    pub voucher_id: u64,
    pub exists: bool,
    pub expiry_ledger: u32,
    pub current_ledger: u32,
    /// ledgers remaining before expiry (0 if expired)
    pub ledgers_until_expiry: u32,
    pub is_expired: bool,
    pub is_claimed: bool,
}
