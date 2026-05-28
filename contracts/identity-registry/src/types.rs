use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationState {
    pub email_verified: bool,
    pub phone_verified: bool,
    pub government_id_verified: bool,
    pub wallet_linked: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct IdentityRecord {
    pub identity: Address,
    pub display_name: Option<String>,
    pub country_code: Option<String>,
    pub bio: Option<String>,
    pub avatar_uri: Option<String>,
    pub verification: VerificationState,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProfileCompleteness {
    pub identity: Address,
    pub exists: bool,
    pub score_bps: u32,
    pub completed_fields: u32,
    pub total_fields: u32,
    pub has_display_name: bool,
    pub has_country_code: bool,
    pub has_bio: bool,
    pub has_avatar_uri: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VerificationSummary {
    pub identity: Address,
    pub exists: bool,
    pub completed_dimensions: u32,
    pub total_dimensions: u32,
    pub email_verified: bool,
    pub phone_verified: bool,
    pub government_id_verified: bool,
    pub wallet_linked: bool,
    pub is_fully_verified: bool,
    pub pending_requirements: Vec<String>,
}
