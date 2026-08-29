#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};
use types::{StreamStatus, StreamSummary, TokenStream};

#[contract]
pub struct TokenStreamingContract;

impl TokenStreamingContract {
    /// Linearly-vested amount as of `now`, clamped to [0, deposit].
    fn streamed_amount(stream: &TokenStream, now: u64) -> u128 {
        if now <= stream.start_ts {
            return 0;
        }
        if now >= stream.stop_ts {
            return stream.deposit;
        }

        let elapsed = (now - stream.start_ts) as u128;
        let duration = (stream.stop_ts - stream.start_ts) as u128;
        (stream.deposit * elapsed) / duration
    }
}

#[contractimpl]
impl TokenStreamingContract {
    pub fn create_stream(
        env: Env,
        sender: Address,
        recipient: Address,
        deposit: u128,
        start_ts: u64,
        stop_ts: u64,
    ) -> u64 {
        sender.require_auth();

        if deposit == 0 {
            panic!("deposit must be > 0");
        }
        if stop_ts <= start_ts {
            panic!("stop_ts must be after start_ts");
        }

        let stream_id = storage::get_next_stream_id(&env);
        storage::set_next_stream_id(&env, stream_id + 1);

        let stream = TokenStream {
            stream_id,
            sender,
            recipient,
            deposit,
            withdrawn: 0,
            start_ts,
            stop_ts,
            status: StreamStatus::Active,
        };

        storage::set_stream(&env, &stream);
        stream_id
    }

    pub fn withdraw_from_stream(env: Env, stream_id: u64, recipient: Address, amount: u128) -> u128 {
        recipient.require_auth();

        let mut stream = storage::get_stream(&env, stream_id).expect("stream not found");

        if stream.status != StreamStatus::Active {
            panic!("stream is not active");
        }
        if stream.recipient != recipient {
            panic!("only the recipient can withdraw from this stream");
        }
        if amount == 0 {
            panic!("amount must be > 0");
        }

        let now = env.ledger().timestamp();
        let streamed = Self::streamed_amount(&stream, now);
        let available = streamed - stream.withdrawn;

        if amount > available {
            panic!("amount exceeds available streamed balance");
        }

        stream.withdrawn += amount;

        if now >= stream.stop_ts && stream.withdrawn == stream.deposit {
            stream.status = StreamStatus::Completed;
        }

        storage::set_stream(&env, &stream);
        amount
    }

    /// Cancels the stream, splitting the deposit by exact elapsed seconds:
    /// the recipient's vested-but-unwithdrawn share, and the sender's
    /// remaining unvested share. Returns (sender_refund, recipient_payout).
    pub fn cancel_stream(env: Env, stream_id: u64, caller: Address) -> (u128, u128) {
        caller.require_auth();

        let mut stream = storage::get_stream(&env, stream_id).expect("stream not found");

        if stream.status != StreamStatus::Active {
            panic!("stream is not active");
        }
        if caller != stream.sender && caller != stream.recipient {
            panic!("only the sender or recipient can cancel this stream");
        }

        let now = env.ledger().timestamp();
        let streamed = Self::streamed_amount(&stream, now);

        let recipient_payout = streamed - stream.withdrawn;
        let sender_refund = stream.deposit - streamed;

        stream.withdrawn = streamed;
        stream.status = StreamStatus::Cancelled;
        storage::set_stream(&env, &stream);

        (sender_refund, recipient_payout)
    }

    pub fn get_stream(env: Env, stream_id: u64) -> StreamSummary {
        let stream = storage::get_stream(&env, stream_id).expect("stream not found");
        StreamSummary {
            stream_id: stream.stream_id,
            sender: stream.sender,
            recipient: stream.recipient,
            deposit: stream.deposit,
            withdrawn: stream.withdrawn,
            start_ts: stream.start_ts,
            stop_ts: stream.stop_ts,
            status: stream.status,
        }
    }

    pub fn get_available_balance(env: Env, stream_id: u64) -> u128 {
        let stream = storage::get_stream(&env, stream_id).expect("stream not found");
        let now = env.ledger().timestamp();
        let streamed = Self::streamed_amount(&stream, now);
        streamed - stream.withdrawn
    }
}

#[cfg(test)]
mod test;
