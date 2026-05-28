#![no_std]

mod storage;
mod types;

#[cfg(test)]
mod test;

use crate::storage::{
    get_all_ids, get_config, get_next_ticket_id, get_queue_entry, get_scan_window, push_ticket_id,
    set_config, set_next_ticket_id, set_queue_entry, set_scan_window,
};
use crate::types::{
    QueueEntry, QueueEntryView, QueueSnapshot, RedeemerConfig, ScanWindow, TicketStatus,
};
use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, Vec};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NotAuthorized = 3,
    Paused = 4,
    QueueFull = 5,
    InvalidTicket = 6,
    ScanWindowActive = 7,
    NotActive = 8,
}

#[contract]
pub struct TicketRedeemer;

#[contractimpl]
impl TicketRedeemer {
    /// Initialize the ticket redeemer.
    pub fn init(
        env: Env,
        admin: Address,
        token: Address,
        queue_capacity: u32,
        scan_window_size: u32,
    ) -> Result<(), Error> {
        if get_config(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();

        let config = RedeemerConfig {
            admin,
            token,
            queue_capacity,
            scan_window_size,
            is_paused: false,
        };
        set_config(&env, &config);
        set_next_ticket_id(&env, 0);
        Ok(())
    }

    /// Set the paused state. Admin only.
    pub fn set_pause(env: Env, paused: bool) -> Result<(), Error> {
        let mut config = get_config(&env).ok_or(Error::NotInitialized)?;
        config.admin.require_auth();
        config.is_paused = paused;
        set_config(&env, &config);
        Ok(())
    }

    /// Submit a ticket to the redemption queue.
    pub fn submit_ticket(env: Env, owner: Address, _ticket_id: u64) -> Result<(), Error> {
        let config = get_config(&env).ok_or(Error::NotInitialized)?;
        if config.is_paused {
            return Err(Error::Paused);
        }
        owner.require_auth();

        let current_count = get_all_ids(&env).len();
        if current_count >= config.queue_capacity {
            return Err(Error::QueueFull);
        }

        let next_id = get_next_ticket_id(&env);
        let entry = QueueEntry {
            ticket_id: next_id,
            owner: owner.clone(),
            status: TicketStatus::Pending,
            submitted_at: env.ledger().sequence(),
            redeemed_at: None,
        };

        set_queue_entry(&env, &entry);
        push_ticket_id(&env, next_id);
        set_next_ticket_id(&env, next_id + 1);

        Ok(())
    }

    /// Mark a ticket as redeemed.
    pub fn redeem_ticket(env: Env, owner: Address, ticket_id: u64) -> Result<(), Error> {
        let config = get_config(&env).ok_or(Error::NotInitialized)?;
        if config.is_paused {
            return Err(Error::Paused);
        }
        owner.require_auth();

        let mut entry = get_queue_entry(&env, ticket_id).ok_or(Error::InvalidTicket)?;
        if entry.owner != owner {
            return Err(Error::NotAuthorized);
        }
        if entry.status != TicketStatus::Pending {
            return Err(Error::InvalidTicket);
        }

        entry.status = TicketStatus::Redeemed;
        entry.redeemed_at = Some(env.ledger().sequence());
        set_queue_entry(&env, &entry);

        Ok(())
    }

    /// Cancel a ticket. Admin only.
    pub fn cancel_ticket(env: Env, admin: Address, ticket_id: u64) -> Result<(), Error> {
        let _config = get_config(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let mut entry = get_queue_entry(&env, ticket_id).ok_or(Error::InvalidTicket)?;
        if entry.status != TicketStatus::Pending {
            return Err(Error::InvalidTicket);
        }

        entry.status = TicketStatus::Cancelled;
        set_queue_entry(&env, &entry);

        Ok(())
    }

    /// Start a scan window. Admin only.
    pub fn start_scan_window(env: Env, admin: Address) -> Result<(), Error> {
        let config = get_config(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        if let Some(window) = get_scan_window(&env) {
            if window.is_active {
                return Err(Error::ScanWindowActive);
            }
        }

        let window = ScanWindow {
            start_ledger: env.ledger().sequence(),
            end_ledger: env.ledger().sequence() + config.scan_window_size,
            entries_scanned: 0,
            is_active: true,
        };
        set_scan_window(&env, &window);
        Ok(())
    }

    /// Close the current scan window. Admin only.
    pub fn close_scan_window(env: Env, admin: Address) -> Result<(), Error> {
        let _config = get_config(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let mut window = get_scan_window(&env).ok_or(Error::NotActive)?;
        if !window.is_active {
            return Err(Error::NotActive);
        }

        window.is_active = false;
        window.end_ledger = env.ledger().sequence();
        set_scan_window(&env, &window);
        Ok(())
    }

    // ─── Public Read-Only Methods ──────────────────────────────────────────

    /// Returns an aggregate snapshot of the redemption queue state.
    ///
    /// Handles uninitialized contract by returning zero-state with `config_initialized: false`.
    pub fn get_queue_snapshot(env: Env) -> QueueSnapshot {
        let config = get_config(&env);
        let config_initialized = config.is_some();
        let is_paused = config.as_ref().map(|c| c.is_paused).unwrap_or(true);

        let all_ids = get_all_ids(&env);
        let mut pending_count: u64 = 0;
        let mut redeemed_count: u64 = 0;
        let mut expired_count: u64 = 0;

        for ticket_id in all_ids.iter() {
            if let Some(entry) = get_queue_entry(&env, ticket_id) {
                match entry.status {
                    TicketStatus::Pending => pending_count += 1,
                    TicketStatus::Redeemed => redeemed_count += 1,
                    TicketStatus::Expired => expired_count += 1,
                    TicketStatus::Cancelled => {}
                }
            }
        }

        let scan_window = get_scan_window(&env);

        QueueSnapshot {
            total_entries: (pending_count + redeemed_count + expired_count),
            pending_count,
            redeemed_count,
            expired_count,
            has_scan_window: scan_window.is_some(),
            scan_window: scan_window.unwrap_or(ScanWindow {
                start_ledger: 0,
                end_ledger: 0,
                entries_scanned: 0,
                is_active: false,
            }),
            is_paused,
            config_initialized,
        }
    }

    /// Returns a single queue entry view for the given ticket ID.
    ///
    /// If the ticket does not exist, returns a view with `exists: false` and all fields `None`.
    pub fn get_queue_entry(env: Env, ticket_id: u64) -> QueueEntryView {
        match get_queue_entry(&env, ticket_id) {
            Some(entry) => QueueEntryView {
                exists: true,
                ticket_id: Some(entry.ticket_id),
                owner: Some(entry.owner),
                status: entry.status,
                submitted_at: Some(entry.submitted_at),
                redeemed_at: entry.redeemed_at,
            },
            None => QueueEntryView {
                exists: false,
                ticket_id: None,
                owner: None,
                status: TicketStatus::Pending,
                submitted_at: None,
                redeemed_at: None,
            },
        }
    }

    /// Returns the current scan window state, or None if no window exists.
    pub fn get_scan_window(env: Env) -> Option<ScanWindow> {
        get_scan_window(&env)
    }

    /// Returns a paginated list of queue entry views.
    ///
    /// Returns empty views for any IDs that don't have stored entries.
    pub fn get_queue_entries(env: Env, offset: u32, limit: u32) -> Vec<QueueEntryView> {
        let all_ids = get_all_ids(&env);
        let mut result = Vec::new(&env);
        let len = all_ids.len();

        let start = offset;
        let end = core::cmp::min(offset + limit, len);

        for i in start..end {
            let ticket_id = all_ids.get(i).unwrap();
            let view = match storage::get_queue_entry(&env, ticket_id) {
                Some(entry) => QueueEntryView {
                    exists: true,
                    ticket_id: Some(entry.ticket_id),
                    owner: Some(entry.owner),
                    status: entry.status,
                    submitted_at: Some(entry.submitted_at),
                    redeemed_at: entry.redeemed_at,
                },
                None => QueueEntryView {
                    exists: false,
                    ticket_id: None,
                    owner: None,
                    status: TicketStatus::Pending,
                    submitted_at: None,
                    redeemed_at: None,
                },
            };
            result.push_back(view);
        }

        result
    }

    /// Returns whether the contract is paused.
    pub fn is_paused(env: Env) -> bool {
        get_config(&env).map(|c| c.is_paused).unwrap_or(true)
    }
}
