//! Stellarcade Wheel of Fortune Contract (experimental)
//!
//! An isolated, standalone Soroban contract implementing an 8-segment prize
//! multiplier wheel with token escrow, commit-reveal random spin resolution,
//! and automatic payout distribution.
//!
//! ## Game Flow
//! 1. `spin_wheel`: the player locks `wager_amount` tokens in escrow and
//!    submits a `client_seed` they choose (and cannot change afterwards).
//!    This is the "commit" half of commit-reveal: the player's contribution
//!    to the randomness is fixed on-chain *before* the outcome is known to
//!    anyone.
//! 2. `settle_spin`: the admin/oracle reveals a `server_secret`. The final
//!    outcome is derived from `sha256(server_secret || client_seed || nonce)`,
//!    so neither side can unilaterally choose (or bias) the result — the
//!    player's seed was already committed, and the server's secret is only
//!    revealed once. The resulting segment's multiplier determines the
//!    payout, which is transferred automatically.
//!
//! ## Wheel Segments
//! 8 equally-likely segments, expressed as basis-100 multipliers:
//! `0x, 0.5x, 1x, 1.5x, 2x, 3x, 5x, 10x` (see [`types::WHEEL_SEGMENTS`]).
//!
//! ## Storage Strategy
//! - `instance()`: admin, token, wager bounds, pause flag, spin nonce,
//!   escrow/house-reserve totals — small fixed-size config/counters shared
//!   across all spins.
//! - `persistent()`: one `SpinRecord` per `spin_id`, TTL-bumped on write.
//!
//! ## Bankroll Safety
//! `spin_wheel` is rejected if the house reserve cannot cover the profit
//! portion of the maximum possible payout (10x wager), so a spin can never
//! be accepted that the house could not honor if it wins.
#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, token::TokenClient, Address, Bytes, BytesN, Env, Vec};

pub use types::{DataKey, Error, SpinRecord, SpinStatus, MULTIPLIER_DIVISOR, WHEEL_SEGMENTS};
use types::{Paused, SpinPlaced, SpinSettled, Unpaused, MAX_MULTIPLIER, SEGMENT_COUNT};

#[contract]
pub struct WheelOfFortune;

#[contractimpl]
impl WheelOfFortune {
    // -----------------------------------------------------------------------
    // initialize
    // -----------------------------------------------------------------------

    /// Initialize the contract. May only be called once.
    pub fn initialize(
        env: Env,
        admin: Address,
        token: Address,
        min_wager: i128,
        max_wager: i128,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();

        if min_wager <= 0 || max_wager <= 0 || min_wager > max_wager {
            return Err(Error::InvalidWagerRange);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::MinWager, &min_wager);
        env.storage().instance().set(&DataKey::MaxWager, &max_wager);
        env.storage().instance().set(&DataKey::Paused, &false);
        env.storage().instance().set(&DataKey::SpinNonce, &0u64);
        env.storage().instance().set(&DataKey::EscrowTotal, &0i128);
        env.storage().instance().set(&DataKey::HouseReserve, &0i128);

        Ok(())
    }

    // -----------------------------------------------------------------------
    // fund_house / house reserve
    // -----------------------------------------------------------------------

    /// Deposit tokens into the house bankroll. Admin only.
    ///
    /// The house reserve backs winning payouts beyond the player's own
    /// wager. Without sufficient reserve, `spin_wheel` will reject wagers
    /// whose max possible (10x) payout it could not cover.
    pub fn fund_house(env: Env, admin: Address, amount: i128) -> Result<(), Error> {
        storage::require_initialized(&env)?;
        storage::require_admin(&env, &admin)?;

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let token = storage::get_token(&env);
        let contract_address = env.current_contract_address();
        TokenClient::new(&env, &token).transfer(&admin, &contract_address, &amount);

        let reserve = storage::get_house_reserve(&env);
        storage::set_house_reserve(&env, reserve.checked_add(amount).ok_or(Error::Overflow)?);

        Ok(())
    }

    /// Withdraw tokens from the house bankroll. Admin only.
    pub fn withdraw_house(env: Env, admin: Address, amount: i128) -> Result<(), Error> {
        storage::require_initialized(&env)?;
        storage::require_admin(&env, &admin)?;

        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let reserve = storage::get_house_reserve(&env);
        if amount > reserve {
            return Err(Error::InsufficientBankroll);
        }

        storage::set_house_reserve(&env, reserve - amount);

        let token = storage::get_token(&env);
        TokenClient::new(&env, &token).transfer(&env.current_contract_address(), &admin, &amount);

        Ok(())
    }

    /// Current house reserve balance (tokens set aside to back payouts).
    pub fn house_reserve(env: Env) -> i128 {
        storage::get_house_reserve(&env)
    }

    /// Current total wagers held in escrow across open (unsettled) spins.
    pub fn escrow_total(env: Env) -> i128 {
        storage::get_escrow_total(&env)
    }

    // -----------------------------------------------------------------------
    // pause controls
    // -----------------------------------------------------------------------

    /// Pause spin placement and settlement. Admin only.
    pub fn pause(env: Env, admin: Address) -> Result<(), Error> {
        storage::require_initialized(&env)?;
        storage::require_admin(&env, &admin)?;

        env.storage().instance().set(&DataKey::Paused, &true);
        Paused { admin }.publish(&env);
        Ok(())
    }

    /// Resume spin placement and settlement. Admin only.
    pub fn unpause(env: Env, admin: Address) -> Result<(), Error> {
        storage::require_initialized(&env)?;
        storage::require_admin(&env, &admin)?;

        env.storage().instance().set(&DataKey::Paused, &false);
        Unpaused { admin }.publish(&env);
        Ok(())
    }

    /// Whether the contract is currently paused.
    pub fn is_paused(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Paused)
            .unwrap_or(false)
    }

    // -----------------------------------------------------------------------
    // spin_wheel
    // -----------------------------------------------------------------------

    /// Place a wheel-of-fortune spin.
    ///
    /// Locks `wager_amount` tokens from `player` into contract escrow,
    /// records a new spin with a fresh nonce, and returns the `spin_id`.
    /// The spin remains `Pending` until `settle_spin` is called.
    pub fn spin_wheel(
        env: Env,
        player: Address,
        wager_amount: i128,
        client_seed: BytesN<32>,
    ) -> Result<u64, Error> {
        storage::require_initialized(&env)?;
        storage::require_not_paused(&env)?;
        player.require_auth();

        if wager_amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        let min_wager: i128 = env.storage().instance().get(&DataKey::MinWager).unwrap();
        let max_wager: i128 = env.storage().instance().get(&DataKey::MaxWager).unwrap();
        if wager_amount < min_wager {
            return Err(Error::WagerTooLow);
        }
        if wager_amount > max_wager {
            return Err(Error::WagerTooHigh);
        }

        // The house must be able to cover the profit portion of the
        // maximum possible payout (10x wager) before accepting the spin.
        let max_payout = wager_amount
            .checked_mul(MAX_MULTIPLIER)
            .and_then(|v| v.checked_div(MULTIPLIER_DIVISOR))
            .ok_or(Error::Overflow)?;
        let max_profit = max_payout
            .checked_sub(wager_amount)
            .ok_or(Error::Overflow)?;
        let house_reserve = storage::get_house_reserve(&env);
        if max_profit > house_reserve {
            return Err(Error::InsufficientBankroll);
        }

        // Lock the wager in escrow.
        let token = storage::get_token(&env);
        let contract_address = env.current_contract_address();
        TokenClient::new(&env, &token).transfer(&player, &contract_address, &wager_amount);

        let escrow_total = storage::get_escrow_total(&env);
        storage::set_escrow_total(
            &env,
            escrow_total
                .checked_add(wager_amount)
                .ok_or(Error::Overflow)?,
        );

        let spin_id = storage::next_spin_id(&env);
        let nonce = spin_id;

        let spin = SpinRecord {
            spin_id,
            player: player.clone(),
            wager_amount,
            client_seed,
            nonce,
            status: SpinStatus::Pending,
            segment_index: 0,
            multiplier_bp: 0,
            payout: 0,
        };
        storage::save_spin(&env, &spin);

        SpinPlaced {
            spin_id,
            player,
            wager_amount,
        }
        .publish(&env);

        Ok(spin_id)
    }

    // -----------------------------------------------------------------------
    // settle_spin
    // -----------------------------------------------------------------------

    /// Reveal the server secret and settle a pending spin. Admin only.
    ///
    /// The outcome segment is derived from
    /// `sha256(server_secret || client_seed || nonce) % 8`. Winnings (or the
    /// full wager on a bust) are transferred automatically; returns the
    /// payout amount (0 on a 0x bust).
    pub fn settle_spin(env: Env, spin_id: u64, server_secret: BytesN<32>) -> Result<i128, Error> {
        storage::require_initialized(&env)?;
        storage::require_not_paused(&env)?;
        let admin = storage::get_admin(&env)?;
        admin.require_auth();

        let mut spin = storage::get_spin(&env, spin_id)?;
        if spin.status == SpinStatus::Settled {
            return Err(Error::SpinAlreadySettled);
        }

        let segment_index =
            derive_segment_index(&env, &server_secret, &spin.client_seed, spin.nonce);
        let multiplier_bp = WHEEL_SEGMENTS[segment_index as usize];

        let payout = spin
            .wager_amount
            .checked_mul(multiplier_bp as i128)
            .and_then(|v| v.checked_div(MULTIPLIER_DIVISOR))
            .ok_or(Error::Overflow)?;

        // Remove this spin's wager from escrow — it is now being settled.
        let escrow_total = storage::get_escrow_total(&env);
        storage::set_escrow_total(
            &env,
            escrow_total
                .checked_sub(spin.wager_amount)
                .ok_or(Error::Overflow)?,
        );

        let house_reserve = storage::get_house_reserve(&env);
        if payout > spin.wager_amount {
            // House pays out the profit portion from its reserve.
            let profit = payout - spin.wager_amount;
            storage::set_house_reserve(
                &env,
                house_reserve.checked_sub(profit).ok_or(Error::Overflow)?,
            );
        } else {
            // House keeps the difference between wager and payout
            // (the full wager on a 0x bust).
            let retained = spin.wager_amount - payout;
            storage::set_house_reserve(
                &env,
                house_reserve.checked_add(retained).ok_or(Error::Overflow)?,
            );
        }

        spin.status = SpinStatus::Settled;
        spin.segment_index = segment_index;
        spin.multiplier_bp = multiplier_bp;
        spin.payout = payout;
        storage::save_spin(&env, &spin);

        if payout > 0 {
            let token = storage::get_token(&env);
            TokenClient::new(&env, &token).transfer(
                &env.current_contract_address(),
                &spin.player,
                &payout,
            );
        }

        SpinSettled {
            spin_id,
            player: spin.player,
            segment_index,
            multiplier_bp,
            payout,
        }
        .publish(&env);

        Ok(payout)
    }

    // -----------------------------------------------------------------------
    // views
    // -----------------------------------------------------------------------

    /// Read a spin's full record.
    pub fn get_spin_info(env: Env, spin_id: u64) -> Result<SpinRecord, Error> {
        storage::get_spin(&env, spin_id)
    }

    /// The 8 wheel segment multipliers, in basis-100 units
    /// (e.g. `50` == `0.5x`, `1000` == `10x`).
    pub fn get_wheel_segments(env: Env) -> Vec<u32> {
        let mut out = Vec::new(&env);
        for m in WHEEL_SEGMENTS.iter() {
            out.push_back(*m);
        }
        out
    }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Derive the winning segment index (0..SEGMENT_COUNT) from the
/// commit-reveal inputs: `sha256(server_secret || client_seed || nonce_be)`.
fn derive_segment_index(
    env: &Env,
    server_secret: &BytesN<32>,
    client_seed: &BytesN<32>,
    nonce: u64,
) -> u32 {
    let mut preimage = [0u8; 72];
    preimage[..32].copy_from_slice(&server_secret.to_array());
    preimage[32..64].copy_from_slice(&client_seed.to_array());
    preimage[64..].copy_from_slice(&nonce.to_be_bytes());

    let digest: BytesN<32> = env
        .crypto()
        .sha256(&Bytes::from_slice(env, &preimage))
        .into();
    let arr = digest.to_array();
    let raw = u64::from_be_bytes([
        arr[0], arr[1], arr[2], arr[3], arr[4], arr[5], arr[6], arr[7],
    ]);
    (raw % SEGMENT_COUNT as u64) as u32
}
