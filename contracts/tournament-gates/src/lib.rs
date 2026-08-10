#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, Address, Env};

pub use types::{GateHealthSnapshot, GateRecord, UnlockDelayAccessor};

#[contract]
pub struct TournamentGates;

#[contractimpl]
impl TournamentGates {
    pub fn init(env: Env, admin: Address) {
        if storage::has_admin(&env) {
            panic!("Already initialized");
        }
        admin.require_auth();
        storage::set_admin(&env, &admin);
    }

    pub fn set_gate(
        env: Env,
        admin: Address,
        gate_id: u32,
        capacity: u32,
        entry_fee: i128,
        opens_at: u64,
        closes_at: u64,
    ) {
        admin.require_auth();
        let stored_admin = storage::get_admin(&env).expect("Not initialized");
        assert!(admin == stored_admin, "Not admin");
        assert!(closes_at > opens_at, "closes_at must be after opens_at");

        let record = GateRecord {
            gate_id,
            capacity,
            entry_fee,
            opens_at,
            closes_at,
            paused: false,
        };
        storage::set_gate(&env, &record);
    }

    pub fn set_paused(env: Env, admin: Address, paused: bool) {
        admin.require_auth();
        let stored_admin = storage::get_admin(&env).expect("Not initialized");
        assert!(admin == stored_admin, "Not admin");
        storage::set_global_paused(&env, paused);
    }

    pub fn gate_health_snapshot(env: Env, gate_id: u32) -> GateHealthSnapshot {
        let now = env.ledger().timestamp();
        let configured = storage::has_admin(&env);
        let global_paused = storage::get_global_paused(&env);

        let Some(record) = storage::get_gate(&env, gate_id) else {
            return GateHealthSnapshot {
                gate_id,
                configured,
                exists: false,
                paused: global_paused,
                capacity: 0,
                entry_fee: 0,
                opens_at: 0,
                closes_at: 0,
                is_open: false,
                now,
            };
        };

        let paused = global_paused || record.paused;
        let is_open = !paused && now >= record.opens_at && now < record.closes_at;

        GateHealthSnapshot {
            gate_id,
            configured,
            exists: true,
            paused,
            capacity: record.capacity,
            entry_fee: record.entry_fee,
            opens_at: record.opens_at,
            closes_at: record.closes_at,
            is_open,
            now,
        }
    }

    pub fn unlock_delay_accessor(env: Env, gate_id: u32, now: u64) -> UnlockDelayAccessor {
        let configured = storage::has_admin(&env);

        let Some(record) = storage::get_gate(&env, gate_id) else {
            return UnlockDelayAccessor {
                gate_id,
                configured,
                exists: false,
                opens_at: 0,
                now,
                ledgers_until_open: 0,
                already_open: false,
            };
        };

        let already_open = now >= record.opens_at;
        let ledgers_until_open = record.opens_at.saturating_sub(now);

        UnlockDelayAccessor {
            gate_id,
            configured,
            exists: true,
            opens_at: record.opens_at,
            now,
            ledgers_until_open,
            already_open,
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger};

    fn setup_env() -> (Env, TournamentGatesClient<'static>) {
        let env = Env::default();
        env.mock_all_auths();
        let id = env.register(TournamentGates, ());
        let client = TournamentGatesClient::new(&env, &id);
        (env, client)
    }

    #[test]
    fn test_gate_health_snapshot_happy_path() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(1500);

        let admin = Address::generate(&env);
        client.init(&admin);
        client.set_gate(&admin, &1u32, &100u32, &50i128, &1000u64, &3000u64);

        let snapshot = client.gate_health_snapshot(&1u32);
        assert!(snapshot.exists);
        assert!(snapshot.configured);
        assert!(!snapshot.paused);
        assert_eq!(snapshot.capacity, 100);
        assert_eq!(snapshot.entry_fee, 50);
        assert_eq!(snapshot.opens_at, 1000);
        assert_eq!(snapshot.closes_at, 3000);
        assert!(snapshot.is_open); // 1500 >= 1000 && 1500 < 3000
    }

    #[test]
    fn test_gate_health_snapshot_before_open() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(500);

        let admin = Address::generate(&env);
        client.init(&admin);
        client.set_gate(&admin, &1u32, &50u32, &10i128, &1000u64, &2000u64);

        let snapshot = client.gate_health_snapshot(&1u32);
        assert!(!snapshot.is_open);
    }

    #[test]
    fn test_gate_health_snapshot_paused() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(1500);

        let admin = Address::generate(&env);
        client.init(&admin);
        client.set_gate(&admin, &1u32, &50u32, &10i128, &1000u64, &2000u64);
        client.set_paused(&admin, &true);

        let snapshot = client.gate_health_snapshot(&1u32);
        assert!(snapshot.paused);
        assert!(!snapshot.is_open);
    }

    #[test]
    fn test_gate_health_snapshot_missing() {
        let (env, client) = setup_env();
        let admin = Address::generate(&env);
        client.init(&admin);

        let snapshot = client.gate_health_snapshot(&999u32);
        assert!(!snapshot.exists);
        assert!(snapshot.configured);
        assert!(!snapshot.is_open);
    }

    #[test]
    fn test_unlock_delay_accessor_before_open() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(1000);

        let admin = Address::generate(&env);
        client.init(&admin);
        client.set_gate(&admin, &1u32, &50u32, &10i128, &2000u64, &4000u64);

        let accessor = client.unlock_delay_accessor(&1u32, &1000u64);
        assert!(accessor.exists);
        assert_eq!(accessor.opens_at, 2000);
        assert_eq!(accessor.ledgers_until_open, 1000); // 2000 - 1000
        assert!(!accessor.already_open);
    }

    #[test]
    fn test_unlock_delay_accessor_already_open() {
        let (env, client) = setup_env();
        env.ledger().set_timestamp(3000);

        let admin = Address::generate(&env);
        client.init(&admin);
        client.set_gate(&admin, &1u32, &50u32, &10i128, &2000u64, &5000u64);

        let accessor = client.unlock_delay_accessor(&1u32, &3000u64);
        assert!(accessor.already_open);
        assert_eq!(accessor.ledgers_until_open, 0); // saturating_sub: 2000 - 3000 = 0
    }

    #[test]
    fn test_unlock_delay_accessor_missing() {
        let (env, client) = setup_env();
        let admin = Address::generate(&env);
        client.init(&admin);

        let accessor = client.unlock_delay_accessor(&999u32, &1000u64);
        assert!(!accessor.exists);
        assert!(accessor.configured);
        assert_eq!(accessor.ledgers_until_open, 0);
        assert!(!accessor.already_open);
    }
}
