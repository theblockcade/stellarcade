use soroban_sdk::{contracttype, Address, String};

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum AuctionPhase {
    Missing,
    Pending,
    Live,
    Ended,
    Settled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReserveAuctionLot {
    pub auction_id: u64,
    pub seller: Address,
    pub asset_label: String,
    pub reserve_price: i128,
    pub start_ledger: u32,
    pub end_ledger: u32,
    pub highest_bid: i128,
    pub highest_bidder: Option<Address>,
    pub bid_count: u32,
    pub settled: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SellerAuctionStats {
    pub total_created: u32,
    pub active_auction_count: u32,
    pub settled_auction_count: u32,
    pub reserve_met_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReserveAuctionSnapshot {
    pub auction_id: u64,
    pub exists: bool,
    pub paused: bool,
    pub seller: Option<Address>,
    pub asset_label: Option<String>,
    pub reserve_price: i128,
    pub highest_bid: i128,
    pub highest_bidder: Option<Address>,
    pub start_ledger: u32,
    pub end_ledger: u32,
    pub bid_count: u32,
    pub reserve_met: bool,
    pub phase: AuctionPhase,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SellerAuctionSummary {
    pub seller: Address,
    pub exists: bool,
    pub paused: bool,
    pub total_created: u32,
    pub active_auction_count: u32,
    pub settled_auction_count: u32,
    pub reserve_met_count: u32,
    pub highest_open_bid: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SettlementOutcome {
    pub auction_id: u64,
    pub seller: Address,
    pub winner: Option<Address>,
    pub reserve_met: bool,
    pub settled: bool,
    pub winning_bid: i128,
    pub seller_proceeds: i128,
}
