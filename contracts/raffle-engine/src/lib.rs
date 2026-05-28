#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

pub use types::{DrawReadiness, RoundData, TicketDistributionSummary};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    MinTicketsRequired,
    Round(u64),
}

#[contract]
pub struct RaffleEngine;

#[contractimpl]
impl RaffleEngine {
    pub fn init(env: Env, admin: Address, min_tickets_required: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage()
            .instance()
            .set(&DataKey::MinTicketsRequired, &min_tickets_required);
    }

    #[allow(clippy::too_many_arguments)]
    pub fn upsert_round(
        env: Env,
        admin: Address,
        round_id: u64,
        total_tickets: u32,
        unique_players: u32,
        common_tickets: u32,
        rare_tickets: u32,
        epic_tickets: u32,
        sales_closed: bool,
    ) {
        require_admin(&env, &admin);
        assert!(
            total_tickets == common_tickets + rare_tickets + epic_tickets,
            "Distribution mismatch"
        );

        storage::set_round(
            &env,
            &RoundData {
                round_id,
                total_tickets,
                unique_players,
                common_tickets,
                rare_tickets,
                epic_tickets,
                sales_closed,
            },
        );
    }

    pub fn ticket_distribution_summary(env: Env, round_id: u64) -> TicketDistributionSummary {
        if let Some(round) = storage::get_round(&env, round_id) {
            TicketDistributionSummary {
                round_id,
                exists: true,
                total_tickets: round.total_tickets,
                unique_players: round.unique_players,
                common_tickets: round.common_tickets,
                rare_tickets: round.rare_tickets,
                epic_tickets: round.epic_tickets,
            }
        } else {
            TicketDistributionSummary {
                round_id,
                exists: false,
                total_tickets: 0,
                unique_players: 0,
                common_tickets: 0,
                rare_tickets: 0,
                epic_tickets: 0,
            }
        }
    }

    pub fn draw_readiness(env: Env, round_id: u64) -> DrawReadiness {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let min_tickets_required = env
            .storage()
            .instance()
            .get(&DataKey::MinTicketsRequired)
            .unwrap_or(0u32);

        if !configured {
            return DrawReadiness {
                round_id,
                configured: false,
                exists: false,
                ready: false,
                min_tickets_required,
                total_tickets: 0,
                blocker: Some(String::from_str(&env, "uninitialized")),
            };
        }

        let Some(round) = storage::get_round(&env, round_id) else {
            return DrawReadiness {
                round_id,
                configured: true,
                exists: false,
                ready: false,
                min_tickets_required,
                total_tickets: 0,
                blocker: Some(String::from_str(&env, "missing_round")),
            };
        };

        let threshold_met = round.total_tickets >= min_tickets_required;
        let ready = round.sales_closed && threshold_met;
        let blocker = if ready {
            None
        } else if !round.sales_closed {
            Some(String::from_str(&env, "sales_open"))
        } else {
            Some(String::from_str(&env, "insufficient_tickets"))
        };

        DrawReadiness {
            round_id,
            configured: true,
            exists: true,
            ready,
            min_tickets_required,
            total_tickets: round.total_tickets,
            blocker,
        }
    }
}

fn require_admin(env: &Env, admin: &Address) {
    admin.require_auth();
    let stored: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .expect("Not initialized");
    assert!(stored == *admin, "Unauthorized");
}

#[cfg(test)]
mod test;
