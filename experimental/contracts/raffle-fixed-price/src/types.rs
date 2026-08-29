use soroban_sdk::{contracttype, Address, BytesN};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RafflePhase {
    /// Accepting ticket purchases; not yet sold out or past its deadline.
    Open,
    /// A winner has been drawn and the prize is attributable.
    Drawn,
    /// The deadline passed without reaching the minimum-sold threshold;
    /// buyers may claim a refund of their ticket spend.
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RaffleState {
    pub raffle_id: u64,
    pub host: Address,
    pub ticket_price: u128,
    pub total_tickets: u32,
    pub tickets_sold: u32,
    pub prize_amount: u128,
    pub deadline_ts: u64,
    pub phase: RafflePhase,
    pub winner: Option<Address>,
    pub winning_ticket: Option<u32>,
    pub draw_seed: Option<BytesN<32>>,
}

/// One ticket-purchase record: `[start_index, end_index)` is the
/// contiguous, sequentially-assigned range of ticket numbers this
/// purchase covers.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TicketPurchase {
    pub buyer: Address,
    pub start_index: u32,
    pub end_index: u32,
    pub refunded: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RaffleSummary {
    pub raffle_id: u64,
    pub host: Address,
    pub ticket_price: u128,
    pub total_tickets: u32,
    pub tickets_sold: u32,
    pub prize_amount: u128,
    pub deadline_ts: u64,
    pub phase: RafflePhase,
    pub winner: Option<Address>,
    pub winning_ticket: Option<u32>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RaffleResult {
    pub raffle_id: u64,
    pub winner: Option<Address>,
    pub winning_ticket: Option<u32>,
    pub prize_amount: u128,
    pub cancelled: bool,
}
