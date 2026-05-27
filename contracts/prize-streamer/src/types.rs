use soroban_sdk::contracttype;

/// Aggregated outflow metrics for a prize stream.
///
/// Returned by `stream_outflow_summary`. When no stream has been configured,
/// `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamOutflowSummary {
    pub stream_id: u32,
    /// `true` when the stream_id exists in storage.
    pub exists: bool,
    /// Total amount that has been streamed out since inception.
    pub total_streamed: i128,
    /// Configured outflow rate in tokens per ledger.
    pub outflow_rate_per_ledger: i128,
    /// Ledger sequence of the last recorded outflow event.
    pub last_outflow_ledger: u32,
    /// `true` when the stream is actively draining (not paused, not exhausted).
    pub is_draining: bool,
}

/// Funding gap report for a prize stream.
///
/// Returned by `funding_gap`. When no stream has been configured,
/// `exists` is `false` and all numeric fields are zero.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FundingGap {
    pub stream_id: u32,
    /// `true` when the stream_id exists in storage.
    pub exists: bool,
    /// Total tokens ever deposited into the stream.
    pub total_funding: i128,
    /// Remaining balance (total_funding − total_streamed), floored at zero.
    pub current_balance: i128,
    /// Tokens still required to reach the configured target, floored at zero.
    pub gap_amount: i128,
    /// `true` when current_balance is below the configured funding_target.
    pub is_underfunded: bool,
}

/// Persistent stream record written by admin mutations.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamRecord {
    pub total_streamed: i128,
    pub outflow_rate_per_ledger: i128,
    pub last_outflow_ledger: u32,
    pub is_draining: bool,
    pub total_funding: i128,
    pub funding_target: i128,
}
