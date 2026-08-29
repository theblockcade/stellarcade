use soroban_sdk::{contracttype, Address};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StreamStatus {
    Active,
    Cancelled,
    Completed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TokenStream {
    pub stream_id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub deposit: u128,
    pub withdrawn: u128,
    pub start_ts: u64,
    pub stop_ts: u64,
    pub status: StreamStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamSummary {
    pub stream_id: u64,
    pub sender: Address,
    pub recipient: Address,
    pub deposit: u128,
    pub withdrawn: u128,
    pub start_ts: u64,
    pub stop_ts: u64,
    pub status: StreamStatus,
}
