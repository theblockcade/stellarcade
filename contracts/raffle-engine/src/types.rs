use soroban_sdk::{contracttype, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoundData {
    pub round_id: u64,
    pub total_tickets: u32,
    pub unique_players: u32,
    pub common_tickets: u32,
    pub rare_tickets: u32,
    pub epic_tickets: u32,
    pub sales_closed: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TicketDistributionSummary {
    pub round_id: u64,
    pub exists: bool,
    pub total_tickets: u32,
    pub unique_players: u32,
    pub common_tickets: u32,
    pub rare_tickets: u32,
    pub epic_tickets: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DrawReadiness {
    pub round_id: u64,
    pub configured: bool,
    pub exists: bool,
    pub ready: bool,
    pub min_tickets_required: u32,
    pub total_tickets: u32,
    pub blocker: Option<String>,
}
