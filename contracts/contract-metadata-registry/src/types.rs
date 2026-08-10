use soroban_sdk::{contracttype, Address, BytesN, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MetadataSummary {
    pub contract_id: Address,
    pub registered: bool,
    pub version: u32,
    pub schema_hash: BytesN<32>,
    pub docs_uri: String,
    pub updated_at: u64,
    pub version_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RegistryConfig {
    pub initialized: bool,
    pub admin: Option<Address>,
    pub registered_contracts: u32,
}
