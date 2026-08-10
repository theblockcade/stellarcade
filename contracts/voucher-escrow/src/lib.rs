#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;
#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env};
pub use types::{EscrowRecord, ExpiryPressure, ReservedVoucherSummary};

#[contract]
pub struct VoucherEscrow;

#[contractimpl]
impl VoucherEscrow {
    pub fn init(env: Env, admin: Address) {
        if storage::get_admin(&env).is_some() {
            panic!("Already initialized");
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
    }

    /// Reserve a voucher in escrow. Admin only.
    pub fn reserve(
        env: Env,
        admin: Address,
        holder: Address,
        reserved_amount: i128,
        expiry_ledger: u32,
    ) -> u64 {
        admin.require_auth();
        assert!(
            storage::get_admin(&env) == Some(admin.clone()),
            "Unauthorized"
        );
        assert!(reserved_amount > 0, "Amount must be positive");
        assert!(
            expiry_ledger > env.ledger().sequence(),
            "Expiry must be in future"
        );

        let voucher_id = storage::get_next_id(&env);
        storage::set_next_id(&env, voucher_id + 1);

        storage::set_escrow(
            &env,
            &EscrowRecord {
                voucher_id,
                holder,
                reserved_amount,
                expiry_ledger,
                claimed: false,
            },
        );

        let mut summary = storage::get_summary(&env);
        summary.total_reserved += reserved_amount;
        summary.active_escrow_count += 1;
        storage::set_summary(&env, &summary);

        voucher_id
    }

    /// Claim an escrowed voucher. Caller must be the holder.
    pub fn claim(env: Env, holder: Address, voucher_id: u64) -> i128 {
        holder.require_auth();
        let mut record = storage::get_escrow(&env, voucher_id).expect("Escrow not found");
        assert!(!record.claimed, "Already claimed");
        assert!(record.holder == holder, "Not the holder");
        assert!(
            env.ledger().sequence() <= record.expiry_ledger,
            "Escrow expired"
        );

        record.claimed = true;
        storage::set_escrow(&env, &record);

        let mut summary = storage::get_summary(&env);
        summary.claimed_count += 1;
        summary.active_escrow_count = summary.active_escrow_count.saturating_sub(1);
        storage::set_summary(&env, &summary);

        record.reserved_amount
    }

    /// Reserved voucher summary: total reserved, active/expired/claimed counts.
    pub fn reserved_voucher_summary(env: Env) -> ReservedVoucherSummary {
        storage::get_summary(&env)
    }

    /// Expiry pressure for a specific voucher: ledgers remaining, expired flag.
    pub fn expiry_pressure(env: Env, voucher_id: u64) -> ExpiryPressure {
        let current_ledger = env.ledger().sequence();
        match storage::get_escrow(&env, voucher_id) {
            Some(record) => {
                let is_expired = current_ledger > record.expiry_ledger;
                let ledgers_until_expiry = if is_expired {
                    0
                } else {
                    record.expiry_ledger - current_ledger
                };
                ExpiryPressure {
                    voucher_id,
                    exists: true,
                    expiry_ledger: record.expiry_ledger,
                    current_ledger,
                    ledgers_until_expiry,
                    is_expired,
                    is_claimed: record.claimed,
                }
            }
            None => ExpiryPressure {
                voucher_id,
                exists: false,
                expiry_ledger: 0,
                current_ledger,
                ledgers_until_expiry: 0,
                is_expired: false,
                is_claimed: false,
            },
        }
    }
}
