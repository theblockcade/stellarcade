use soroban_sdk::contracttype;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AdminView {
    pub initialized: bool,
    pub admin: Option<soroban_sdk::Address>,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleStatus {
    pub target: soroban_sdk::Address,
    pub role: soroban_sdk::Symbol,
    pub assigned: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TargetRoleCount {
    pub target: soroban_sdk::Address,
    pub role_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RoleTargetCount {
    pub role: soroban_sdk::Symbol,
    pub target_count: u32,
}
