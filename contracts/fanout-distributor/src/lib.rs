#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Env};

pub use types::{
    BatchHealthBand, BatchHealthSnapshot, BatchProgressSummary, BatchRecord, BatchStatus, RetryGap,
    RetryableFailure,
};

const DEFAULT_RETRY_GAP_LEDGERS: u32 = 120;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Batch(u64),
    TotalBatches,
    CompletedBatches,
    PendingBatches,
    TotalDistributed,
    FailedBatches,
}

#[contract]
pub struct FanoutDistributor;

#[contractimpl]
impl FanoutDistributor {
    pub fn init(env: Env, admin: soroban_sdk::Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn create_batch(
        env: Env,
        admin: soroban_sdk::Address,
        batch_id: u64,
        total_amount: i128,
        recipient_count: u32,
    ) {
        admin.require_auth();
        assert!(total_amount > 0, "Total amount must be positive");
        assert!(recipient_count > 0, "Recipient count must be positive");

        let record = BatchRecord {
            batch_id,
            total_amount,
            distributed_amount: 0,
            recipient_count,
            completed: false,
            failed: false,
        };

        storage::set_batch(&env, &record);
        storage::increment_total_batches(&env);
        storage::increment_pending_batches(&env);
    }

    pub fn distribute(
        env: Env,
        admin: soroban_sdk::Address,
        batch_id: u64,
        amount: i128,
    ) -> i128 {
        admin.require_auth();

        let mut record = storage::get_batch(&env, batch_id).expect("Batch not found");
        assert!(amount > 0, "Amount must be positive");
        assert!(
            record.distributed_amount + amount <= record.total_amount,
            "Exceeds batch amount"
        );

        record.distributed_amount = record.distributed_amount + amount;
        storage::set_batch(&env, &record);
        storage::add_total_distributed(&env, amount);

        amount
    }

    pub fn complete_batch(env: Env, admin: soroban_sdk::Address, batch_id: u64) {
        admin.require_auth();

        let mut record = storage::get_batch(&env, batch_id).expect("Batch not found");
        assert!(!record.completed, "Already completed");

        record.completed = true;
        storage::set_batch(&env, &record);
        storage::decrement_pending_batches(&env);
        storage::increment_completed_batches(&env);
    }

    pub fn mark_failed(env: Env, admin: soroban_sdk::Address, batch_id: u64) {
        admin.require_auth();

        let mut record = storage::get_batch(&env, batch_id).expect("Batch not found");
        assert!(!record.failed, "Already marked failed");

        record.failed = true;
        storage::set_batch(&env, &record);
        storage::increment_failed_batches(&env);
    }

    pub fn batch_progress_summary(env: Env) -> BatchProgressSummary {
        let configured = env.storage().instance().has(&DataKey::Admin);

        BatchProgressSummary {
            configured,
            total_batches: storage::get_total_batches(&env),
            completed_batches: storage::get_completed_batches(&env),
            pending_batches: storage::get_pending_batches(&env),
            total_distributed: storage::get_total_distributed(&env),
            failed_batches: storage::get_failed_batches(&env),
        }
    }

    /// Backwards-compatible alias for the payout sweep backlog summary.
    pub fn sweep_backlog_summary(env: Env) -> BatchProgressSummary {
        Self::batch_progress_summary(env)
    }

    pub fn retryable_failure(env: Env, batch_id: u64) -> RetryableFailure {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_batch(&env, batch_id) else {
            return RetryableFailure {
                batch_id,
                configured,
                exists: false,
                status: if configured {
                    BatchStatus::Pending
                } else {
                    BatchStatus::NotConfigured
                },
                failed: false,
                total_amount: 0,
                distributed_amount: 0,
                now,
            };
        };

        let status = if record.completed {
            BatchStatus::Completed
        } else if record.failed {
            BatchStatus::Pending
        } else {
            BatchStatus::InProgress
        };

        RetryableFailure {
            batch_id,
            configured,
            exists: true,
            status,
            failed: record.failed,
            total_amount: record.total_amount,
            distributed_amount: record.distributed_amount,
            now,
        }
    }

    /// Return a structured health snapshot for one payout batch.
    ///
    /// Missing batch ids are not errors. They return `exists = false`,
    /// zeroed amounts, and either `Missing` or `NotConfigured` depending on
    /// whether the contract has been initialized. `progress_bps` is floored
    /// basis-point math and returns zero when `total_amount <= 0`.
    pub fn batch_health_snapshot(env: Env, batch_id: u64) -> BatchHealthSnapshot {
        let configured = env.storage().instance().has(&DataKey::Admin);

        let Some(record) = storage::get_batch(&env, batch_id) else {
            return BatchHealthSnapshot {
                batch_id,
                configured,
                exists: false,
                status: if configured {
                    BatchStatus::Pending
                } else {
                    BatchStatus::NotConfigured
                },
                health_band: if configured {
                    BatchHealthBand::Missing
                } else {
                    BatchHealthBand::NotConfigured
                },
                total_amount: 0,
                distributed_amount: 0,
                remaining_amount: 0,
                recipient_count: 0,
                progress_bps: 0,
                failed: false,
            };
        };

        let status = batch_status(&record);
        let remaining_amount = (record.total_amount - record.distributed_amount).max(0);

        BatchHealthSnapshot {
            batch_id,
            configured,
            exists: true,
            status: status.clone(),
            health_band: batch_health_band(&record, &status),
            total_amount: record.total_amount,
            distributed_amount: record.distributed_amount,
            remaining_amount,
            recipient_count: record.recipient_count,
            progress_bps: batch_progress_bps(record.total_amount, record.distributed_amount),
            failed: record.failed,
        }
    }

    /// Return the retry gap for a payout batch using ledger-based fallback math.
    ///
    /// The current storage model does not persist a failure timestamp, so failed
    /// batches use `current_ledger + retry_gap_ledgers` as a conservative
    /// `retry_after_ledger` until a mutation path records richer retry history.
    /// Completed, healthy, missing, and not-configured states return gap zero
    /// and `can_retry = false`.
    pub fn retry_gap(env: Env, batch_id: u64) -> RetryGap {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let current_ledger = env.ledger().sequence();

        let Some(record) = storage::get_batch(&env, batch_id) else {
            return RetryGap {
                batch_id,
                configured,
                exists: false,
                status: if configured {
                    BatchStatus::Pending
                } else {
                    BatchStatus::NotConfigured
                },
                failed: false,
                retry_gap_ledgers: 0,
                retry_after_ledger: 0,
                current_ledger,
                can_retry: false,
            };
        };

        let status = batch_status(&record);
        let retry_gap_ledgers = if record.failed && !record.completed {
            DEFAULT_RETRY_GAP_LEDGERS
        } else {
            0
        };
        let retry_after_ledger = if retry_gap_ledgers > 0 {
            current_ledger.saturating_add(retry_gap_ledgers)
        } else {
            0
        };

        RetryGap {
            batch_id,
            configured,
            exists: true,
            status,
            failed: record.failed,
            retry_gap_ledgers,
            retry_after_ledger,
            current_ledger,
            can_retry: record.failed && !record.completed,
        }
    }

    /// Backwards-compatible alias for the batch retry window accessor.
    pub fn retry_window_accessor(env: Env, batch_id: u64) -> RetryGap {
        Self::retry_gap(env, batch_id)
    }
}

fn batch_status(record: &BatchRecord) -> BatchStatus {
    if record.completed {
        BatchStatus::Completed
    } else if record.failed {
        BatchStatus::Pending
    } else if record.distributed_amount > 0 {
        BatchStatus::InProgress
    } else {
        BatchStatus::Pending
    }
}

fn batch_health_band(record: &BatchRecord, status: &BatchStatus) -> BatchHealthBand {
    if record.completed {
        return BatchHealthBand::Completed;
    }

    if record.failed {
        return BatchHealthBand::Failed;
    }

    if *status == BatchStatus::InProgress {
        BatchHealthBand::Partial
    } else {
        BatchHealthBand::Healthy
    }
}

fn batch_progress_bps(total_amount: i128, distributed_amount: i128) -> u32 {
    if total_amount <= 0 || distributed_amount <= 0 {
        return 0;
    }

    let distributed = distributed_amount.min(total_amount);
    ((distributed * 10_000) / total_amount) as u32
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    fn setup(env: &Env) -> (FanoutDistributorClient<'_>, soroban_sdk::Address) {
        let admin = soroban_sdk::Address::generate(env);
        let contract_id = env.register(FanoutDistributor, ());
        let client = FanoutDistributorClient::new(env, &contract_id);
        env.mock_all_auths();
        (client, admin)
    }

    #[test]
    fn test_init() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        client.init(&admin);
    }

    #[test]
    fn test_batch_lifecycle() {
        let env = Env::default();
        let (client, admin) = setup(&env);

        client.init(&admin);
        client.create_batch(&admin, &1, &1000, &5);

        let summary = client.batch_progress_summary();
        assert_eq!(summary.total_batches, 1);
        assert_eq!(summary.pending_batches, 1);

        client.distribute(&admin, &1, &500);
        let summary = client.batch_progress_summary();
        assert_eq!(summary.total_distributed, 500);

        client.complete_batch(&admin, &1);
        let summary = client.batch_progress_summary();
        assert_eq!(summary.completed_batches, 1);
        assert_eq!(summary.pending_batches, 0);
    }

    #[test]
    fn test_retryable_failure_missing() {
        let env = Env::default();
        let (client, admin) = setup(&env);
        client.init(&admin);

        let failure = client.retryable_failure(&999);
        assert_eq!(failure.exists, false);
        assert_eq!(failure.configured, true);
    }

    #[test]
    fn test_batch_health_snapshot_and_retry_gap_failed_batch() {
        let env = Env::default();
        let (client, admin) = setup(&env);

        client.init(&admin);
        client.create_batch(&admin, &7, &1_000, &4);
        client.distribute(&admin, &7, &250);
        client.mark_failed(&admin, &7);

        let snapshot = client.batch_health_snapshot(&7);
        assert_eq!(snapshot.exists, true);
        assert_eq!(snapshot.health_band, BatchHealthBand::Failed);
        assert_eq!(snapshot.remaining_amount, 750);
        assert_eq!(snapshot.progress_bps, 2_500);

        let gap = client.retry_gap(&7);
        assert_eq!(gap.exists, true);
        assert_eq!(gap.failed, true);
        assert_eq!(gap.retry_gap_ledgers, DEFAULT_RETRY_GAP_LEDGERS);
        assert_eq!(gap.retry_after_ledger, gap.current_ledger + DEFAULT_RETRY_GAP_LEDGERS);
        assert_eq!(gap.can_retry, true);
    }

    #[test]
    fn test_batch_health_snapshot_missing_state() {
        let env = Env::default();
        let (client, _) = setup(&env);

        let snapshot = client.batch_health_snapshot(&404);
        assert_eq!(snapshot.configured, false);
        assert_eq!(snapshot.exists, false);
        assert_eq!(snapshot.health_band, BatchHealthBand::NotConfigured);
        assert_eq!(snapshot.progress_bps, 0);

        let gap = client.retry_gap(&404);
        assert_eq!(gap.exists, false);
        assert_eq!(gap.can_retry, false);
        assert_eq!(gap.retry_gap_ledgers, 0);
    }
}
