//! Stellarcade Fixed-Price Raffle Contract (experimental)
//!
//! A capped ticket lottery: a host opens a raffle with a fixed ticket
//! price, a total ticket cap, a jackpot prize, and a deadline. Players buy
//! one or more tickets and receive sequential ticket indices. Once the
//! raffle sells out (or its deadline passes with enough tickets sold), the
//! host draws a winner; if too few tickets sold by the deadline, the
//! raffle is cancelled and buyers can claim a refund of their ticket
//! spend.
//!
//! ## Ticket number permutation
//! The draw does not just take `sha256(seed) % tickets_sold` — it expands
//! `seed` into a pseudo-random byte stream (via repeated
//! `sha256(seed || counter)` calls) and runs a seeded Fisher-Yates shuffle
//! over every sold ticket index. The first element of the resulting
//! permutation is the winning ticket. This is deterministic and
//! reproducible from the stored `draw_seed` (see [`get_draw_seed`]), while
//! avoiding any structural bias a plain modulo reduction over a large
//! range could introduce.
//!
//! ## Economics
//! Like `coinflip-streak` and `lottery-syndicate` elsewhere in this
//! experimental workspace, this contract tracks amounts as plain `u128`
//! ledger values rather than moving real tokens via `token::Client` — its
//! interface takes no token address, so ticket purchases and refunds are
//! bookkeeping only; a production deployment would wire these into real
//! escrow.

#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Bytes, BytesN, Env, Vec};
use types::{RaffleResult, RafflePhase, RaffleState, RaffleSummary, TicketPurchase};

/// Upper bound on `total_tickets`: the draw runs an O(n) seeded shuffle
/// over every sold ticket, so this keeps that bounded to something
/// reasonable for a demo/experimental raffle.
pub const MAX_TOTAL_TICKETS: u32 = 1_000;
/// Minimum fraction of `total_tickets` that must be sold by the deadline
/// for the raffle to draw a winner instead of cancelling (50%, in bps).
pub const MIN_SOLD_BPS: u32 = 5_000;

#[contract]
pub struct RaffleFixedPriceContract;

impl RaffleFixedPriceContract {
    /// Expands `seed` into a pseudo-random `u32` via `sha256(seed || counter)`.
    fn seeded_random_u32(env: &Env, seed: &BytesN<32>, counter: u32) -> u32 {
        let mut preimage = Bytes::new(env);
        preimage.extend_from_array(&seed.to_array());
        preimage.extend_from_array(&counter.to_be_bytes());
        let digest = env.crypto().sha256(&preimage).to_bytes();
        let bytes = digest.to_array();
        u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
    }

    /// Seeded Fisher-Yates shuffle of `0..n`.
    fn permuted_ticket_indices(env: &Env, seed: &BytesN<32>, n: u32) -> Vec<u32> {
        let mut ids: Vec<u32> = Vec::new(env);
        for i in 0..n {
            ids.push_back(i);
        }
        let mut counter: u32 = 0;
        let mut i = n;
        while i > 1 {
            i -= 1;
            let r = Self::seeded_random_u32(env, seed, counter) % (i + 1);
            counter += 1;
            let a = ids.get(i).unwrap();
            let b = ids.get(r).unwrap();
            ids.set(i, b);
            ids.set(r, a);
        }
        ids
    }

    fn owner_of_ticket(purchases: &Vec<TicketPurchase>, ticket: u32) -> Address {
        for purchase in purchases.iter() {
            if ticket >= purchase.start_index && ticket < purchase.end_index {
                return purchase.buyer;
            }
        }
        panic!("winning ticket has no owner");
    }
}

#[contractimpl]
impl RaffleFixedPriceContract {
    /// Opens a new fixed-price raffle. Returns the new raffle id.
    pub fn create_raffle(
        env: Env,
        host: Address,
        ticket_price: u128,
        total_tickets: u32,
        prize_amount: u128,
        deadline_ts: u64,
    ) -> u64 {
        host.require_auth();

        if ticket_price == 0 {
            panic!("ticket_price must be greater than 0");
        }
        if total_tickets == 0 {
            panic!("total_tickets must be greater than 0");
        }
        if total_tickets > MAX_TOTAL_TICKETS {
            panic!("total_tickets exceeds the maximum allowed");
        }
        if prize_amount == 0 {
            panic!("prize_amount must be greater than 0");
        }
        if deadline_ts <= env.ledger().timestamp() {
            panic!("deadline_ts must be in the future");
        }

        let raffle_id = storage::get_next_raffle_id(&env);
        storage::set_next_raffle_id(&env, raffle_id + 1);

        let state = RaffleState {
            raffle_id,
            host,
            ticket_price,
            total_tickets,
            tickets_sold: 0,
            prize_amount,
            deadline_ts,
            phase: RafflePhase::Open,
            winner: None,
            winning_ticket: None,
            draw_seed: None,
        };
        storage::set_raffle(&env, &state);
        storage::set_purchases(&env, raffle_id, &Vec::new(&env));

        raffle_id
    }

    /// Buys `quantity` tickets, returning the assigned `[start, end)`
    /// sequential ticket-index range.
    pub fn buy_tickets(env: Env, raffle_id: u64, buyer: Address, quantity: u32) -> (u32, u32) {
        buyer.require_auth();

        let mut state = storage::get_raffle(&env, raffle_id).expect("raffle not found");
        if state.phase != RafflePhase::Open {
            panic!("raffle is not open");
        }
        if env.ledger().timestamp() > state.deadline_ts {
            panic!("raffle deadline has passed");
        }
        if quantity == 0 {
            panic!("quantity must be greater than 0");
        }
        if state.tickets_sold + quantity > state.total_tickets {
            panic!("purchase exceeds raffle ticket capacity");
        }

        let start = state.tickets_sold;
        let end = start + quantity;

        let mut purchases = storage::get_purchases(&env, raffle_id);
        purchases.push_back(TicketPurchase {
            buyer,
            start_index: start,
            end_index: end,
            refunded: false,
        });
        storage::set_purchases(&env, raffle_id, &purchases);

        state.tickets_sold = end;
        storage::set_raffle(&env, &state);

        (start, end)
    }

    /// Draws a winner once the raffle has sold out, or resolves the
    /// deadline outcome (draw if the minimum-sold threshold was met,
    /// otherwise cancel).
    pub fn draw_raffle(env: Env, raffle_id: u64, seed: BytesN<32>) -> RaffleResult {
        let mut state = storage::get_raffle(&env, raffle_id).expect("raffle not found");
        if state.phase != RafflePhase::Open {
            panic!("raffle is not open");
        }

        let sold_out = state.tickets_sold == state.total_tickets;
        let deadline_passed = env.ledger().timestamp() >= state.deadline_ts;
        if !sold_out && !deadline_passed {
            panic!("raffle is not ready to draw");
        }

        let threshold = core::cmp::max(1u32, (state.total_tickets * MIN_SOLD_BPS) / 10_000);

        if sold_out || state.tickets_sold >= threshold {
            let purchases = storage::get_purchases(&env, raffle_id);
            let permuted = Self::permuted_ticket_indices(&env, &seed, state.tickets_sold);
            let winning_ticket = permuted.get(0).expect("no tickets sold");
            let winner = Self::owner_of_ticket(&purchases, winning_ticket);

            state.winner = Some(winner.clone());
            state.winning_ticket = Some(winning_ticket);
            state.draw_seed = Some(seed);
            state.phase = RafflePhase::Drawn;
            storage::set_raffle(&env, &state);

            RaffleResult {
                raffle_id,
                winner: Some(winner),
                winning_ticket: Some(winning_ticket),
                prize_amount: state.prize_amount,
                cancelled: false,
            }
        } else {
            state.phase = RafflePhase::Cancelled;
            storage::set_raffle(&env, &state);

            RaffleResult {
                raffle_id,
                winner: None,
                winning_ticket: None,
                prize_amount: 0,
                cancelled: true,
            }
        }
    }

    /// Claims a refund of `buyer`'s ticket spend once a raffle has been
    /// cancelled for under-subscription.
    pub fn claim_refund(env: Env, raffle_id: u64, buyer: Address) -> u128 {
        buyer.require_auth();

        let state = storage::get_raffle(&env, raffle_id).expect("raffle not found");
        if state.phase != RafflePhase::Cancelled {
            panic!("raffle is not cancelled");
        }

        let mut purchases = storage::get_purchases(&env, raffle_id);
        let mut total_due: u128 = 0;
        for i in 0..purchases.len() {
            let mut purchase = purchases.get(i).unwrap();
            if purchase.buyer == buyer && !purchase.refunded {
                let quantity = (purchase.end_index - purchase.start_index) as u128;
                total_due += quantity * state.ticket_price;
                purchase.refunded = true;
                purchases.set(i, purchase);
            }
        }

        if total_due == 0 {
            panic!("nothing to refund for this buyer");
        }

        storage::set_purchases(&env, raffle_id, &purchases);
        total_due
    }

    /// Read-only snapshot of a raffle's status.
    pub fn get_raffle_status(env: Env, raffle_id: u64) -> RaffleSummary {
        let state = storage::get_raffle(&env, raffle_id).expect("raffle not found");
        RaffleSummary {
            raffle_id: state.raffle_id,
            host: state.host,
            ticket_price: state.ticket_price,
            total_tickets: state.total_tickets,
            tickets_sold: state.tickets_sold,
            prize_amount: state.prize_amount,
            deadline_ts: state.deadline_ts,
            phase: state.phase,
            winner: state.winner,
            winning_ticket: state.winning_ticket,
        }
    }

    /// The seed used to draw a raffle's winner, if it has been drawn.
    pub fn get_draw_seed(env: Env, raffle_id: u64) -> Option<BytesN<32>> {
        storage::get_raffle(&env, raffle_id)
            .expect("raffle not found")
            .draw_seed
    }
}

#[cfg(test)]
mod test;
