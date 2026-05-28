#![no_std]

use soroban_sdk::{contracttype, Address, Symbol};

/// Risk levels for depletion assessment
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

/// Recommended actions based on risk assessment
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum RecommendedAction {
    Normal,
    Monitor,
    Refill,
    Urgent,
    Emergency,
}

/// Reserve status for tracking allocation state
#[derive(Clone, PartialEq)]
#[contracttype]
pub enum ReserveStatus {
    Active,
    Paused,
    Depleted,
    Suspended,
}

/// Extended reserve allocation with additional metadata
#[derive(Clone)]
#[contracttype]
pub struct ExtendedReserveAllocation {
    pub wallet: Address,
    pub allocated_amount: i128,
    pub available_amount: i128,
    pub depletion_threshold: i128,
    pub last_updated: u64,
    pub status: ReserveStatus,
    pub usage_rate: i128, // Amount used per time period
    pub refill_count: u32,
    pub last_refill: Option<u64>,
}

/// Detailed depletion risk with historical data
#[derive(Clone)]
#[contracttype]
pub struct DetailedDepletionRisk {
    pub wallet: Address,
    pub current_balance: i128,
    pub allocated_amount: i128,
    pub depletion_threshold: i128,
    pub risk_level: RiskLevel,
    pub risk_score: u32, // 0-100 risk score
    pub estimated_depletion_time: Option<u64>,
    pub recommended_action: RecommendedAction,
    pub historical_usage: i128,
    pub trend_direction: Symbol, // "UP", "DOWN", "STABLE"
}

/// Aggregated summary with risk breakdown
#[derive(Clone)]
#[contracttype]
pub struct DetailedAllocationSummary {
    pub total_allocated: i128,
    pub total_available: i128,
    pub total_used: i128,
    pub total_wallets: u32,
    pub active_wallets: u32,
    pub paused_wallets: u32,
    pub depleted_wallets: u32,
    pub high_risk_wallets: u32,
    pub medium_risk_wallets: u32,
    pub low_risk_wallets: u32,
    pub average_usage_rate: i128,
    pub last_updated: u64,
}

/// Configuration for reserve management
#[derive(Clone)]
#[contracttype]
pub struct ReserveConfig {
    pub default_depletion_threshold: i128,
    pub auto_refill_enabled: bool,
    pub auto_refill_threshold: i128,
    pub max_allocation_per_wallet: i128,
    pub monitoring_interval: u64,
    pub emergency_threshold: i128,
}

/// Event data for reserve operations
#[derive(Clone)]
#[contracttype]
pub struct ReserveEvent {
    pub event_type: Symbol,
    pub wallet: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub metadata: Symbol,
}