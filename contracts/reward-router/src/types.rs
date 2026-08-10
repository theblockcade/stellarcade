use soroban_sdk::{contracttype, Address, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RouteImbalanceSummary {
    pub route_id: Symbol,
    pub total_allocated: i128,
    pub total_routed: i128,
    pub imbalance: i128,
    pub is_balanced: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FallbackBucket {
    pub bucket_address: Address,
    pub total_collected: i128,
    pub last_fallback_ledger: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RouteData {
    pub allocated: i128,
    pub routed: i128,
}

/// Snapshot of overall routing state across all routes.
///
/// `split_ratio_bps` is the basis-point share of total allocated rewards that
/// have been routed: `total_routed * 10_000 / total_allocated`, floored to 0
/// when `total_allocated == 0`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoutingStateSnapshot {
    pub total_allocated: i128,
    pub total_routed: i128,
    pub total_imbalance: i128,
    pub split_ratio_bps: u32,
    pub fallback_collected: i128,
    pub has_fallback: bool,
}
