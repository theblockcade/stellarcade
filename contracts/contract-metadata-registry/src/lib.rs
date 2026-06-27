#![no_std]

mod storage;
pub mod types;

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, BytesN, Env,
    String, Vec,
};

pub use types::{MetadataSummary, RegistryConfig};

use storage::*;

const PERSISTENT_BUMP_LEDGERS: u32 = 518_400;
const PERSISTENT_BUMP_THRESHOLD: u32 = PERSISTENT_BUMP_LEDGERS - 100_800;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    ContractAlreadyRegistered = 4,
    ContractNotFound = 5,
    InvalidVersion = 6,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct MetadataRecord {
    pub version: u32,
    pub schema_hash: BytesN<32>,
    pub docs_uri: String,
    pub updated_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Metadata(Address),
    History(Address, u32),
    RegisteredContracts,
}

#[contractevent]
pub struct ContractInitialized {
    pub admin: Address,
}

#[contractevent]
pub struct MetadataRegistered {
    pub contract_id: Address,
    pub version: u32,
}

#[contractevent]
pub struct MetadataUpdated {
    pub contract_id: Address,
    pub old_version: u32,
    pub new_version: u32,
}

#[contract]
pub struct ContractMetadataRegistry;

#[contractimpl]
impl ContractMetadataRegistry {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if is_initialized(&env) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        set_admin(&env, &admin);

        ContractInitialized { admin }.publish(&env);

        Ok(())
    }

    pub fn register_metadata(
        env: Env,
        contract_id: Address,
        version: u32,
        schema_hash: BytesN<32>,
        docs_uri: String,
    ) -> Result<(), Error> {
        let admin = get_admin(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        if version == 0 {
            return Err(Error::InvalidVersion);
        }

        if is_registered(&env, &contract_id) {
            return Err(Error::ContractAlreadyRegistered);
        }

        let record = MetadataRecord {
            version,
            schema_hash,
            docs_uri,
            updated_at: env.ledger().timestamp(),
        };

        set_metadata(&env, &contract_id, &record);
        set_metadata_history(&env, &contract_id, version, &record);
        add_to_registry_list(&env, &contract_id);

        MetadataRegistered {
            contract_id,
            version,
        }
        .publish(&env);

        Ok(())
    }

    pub fn update_metadata(
        env: Env,
        contract_id: Address,
        version: u32,
        schema_hash: BytesN<32>,
        docs_uri: String,
    ) -> Result<(), Error> {
        let admin = get_admin(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let mut current: MetadataRecord =
            get_metadata(&env, &contract_id).ok_or(Error::ContractNotFound)?;

        if version <= current.version {
            return Err(Error::InvalidVersion);
        }

        let old_version = current.version;
        current.version = version;
        current.schema_hash = schema_hash;
        current.docs_uri = docs_uri;
        current.updated_at = env.ledger().timestamp();

        set_metadata(&env, &contract_id, &current);
        set_metadata_history(&env, &contract_id, version, &current);

        MetadataUpdated {
            contract_id,
            old_version,
            new_version: version,
        }
        .publish(&env);

        Ok(())
    }

    pub fn metadata_of(env: Env, contract_id: Address) -> Option<MetadataRecord> {
        get_metadata(&env, &contract_id)
    }

    pub fn latest_published(env: Env, contract_id: Address) -> Option<MetadataRecord> {
        get_metadata(&env, &contract_id)
    }

    pub fn history(env: Env, contract_id: Address) -> Vec<MetadataRecord> {
        let mut history_vec = Vec::new(&env);
        let current_opt: Option<MetadataRecord> = get_metadata(&env, &contract_id);

        if let Some(current) = current_opt {
            for v in 1..=current.version {
                if let Some(record) = env
                    .storage()
                    .persistent()
                    .get::<_, MetadataRecord>(&DataKey::History(contract_id.clone(), v))
                {
                    history_vec.push_back(record);
                }
            }
        }

        history_vec
    }

    pub fn history_bounded(env: Env, contract_id: Address, limit: u32) -> Vec<MetadataRecord> {
        let mut results = Vec::new(&env);
        if limit == 0 {
            return results;
        }
        let current_opt: Option<MetadataRecord> = get_metadata(&env, &contract_id);
        let current = match current_opt {
            Some(c) => c,
            None => return results,
        };

        let mut collected: u32 = 0;
        let mut v = current.version;
        let mut buf = Vec::new(&env);
        while v >= 1 && collected < limit {
            if let Some(record) = env
                .storage()
                .persistent()
                .get::<_, MetadataRecord>(&DataKey::History(contract_id.clone(), v))
            {
                buf.push_back(record);
                collected += 1;
            }
            if v == 0 {
                break;
            }
            v -= 1;
        }

        let len = buf.len();
        for i in (0..len).rev() {
            results.push_back(buf.get(i).unwrap());
        }

        results
    }

    pub fn is_initialized(env: Env) -> bool {
        is_initialized(&env)
    }

    pub fn admin(env: Env) -> Option<Address> {
        get_admin(&env)
    }

    pub fn is_registered(env: Env, contract_id: Address) -> bool {
        is_registered(&env, &contract_id)
    }

    pub fn metadata_summary(env: Env, contract_id: Address) -> MetadataSummary {
        match get_metadata(&env, &contract_id) {
            Some(record) => MetadataSummary {
                contract_id: contract_id.clone(),
                registered: true,
                version: record.version,
                schema_hash: record.schema_hash,
                docs_uri: record.docs_uri,
                updated_at: record.updated_at,
                version_count: record.version,
            },
            None => MetadataSummary {
                contract_id: contract_id.clone(),
                registered: false,
                version: 0,
                schema_hash: BytesN::from_array(&env, &[0u8; 32]),
                docs_uri: String::from_str(&env, ""),
                updated_at: 0,
                version_count: 0,
            },
        }
    }

    pub fn list_registered(env: Env, start: u32, limit: u32) -> Vec<Address> {
        let all = get_registered_contracts(&env);
        let mut result = Vec::new(&env);
        let total = all.len();
        if start >= total || limit == 0 {
            return result;
        }
        let end = core::cmp::min(start.checked_add(limit).unwrap_or(total), total);
        for i in start..end {
            result.push_back(all.get(i).unwrap());
        }
        result
    }

    pub fn registry_config(env: Env) -> RegistryConfig {
        RegistryConfig {
            initialized: is_initialized(&env),
            admin: get_admin(&env),
            registered_contracts: get_registered_count(&env),
        }
    }
}

#[cfg(test)]
mod test;
