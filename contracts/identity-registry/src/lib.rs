#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

pub use types::{IdentityRecord, ProfileCompleteness, VerificationState, VerificationSummary};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Identity(Address),
}

#[contract]
pub struct IdentityRegistry;

#[contractimpl]
impl IdentityRegistry {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    pub fn register_identity(
        env: Env,
        identity: Address,
        display_name: Option<String>,
        country_code: Option<String>,
        bio: Option<String>,
        avatar_uri: Option<String>,
    ) {
        identity.require_auth();

        let record = IdentityRecord {
            identity: identity.clone(),
            display_name,
            country_code,
            bio,
            avatar_uri,
            verification: VerificationState {
                email_verified: false,
                phone_verified: false,
                government_id_verified: false,
                wallet_linked: true,
            },
        };

        storage::set_identity(&env, &identity, &record);
    }

    pub fn set_verification_state(
        env: Env,
        identity: Address,
        email_verified: bool,
        phone_verified: bool,
        government_id_verified: bool,
        wallet_linked: bool,
    ) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .expect("Not initialized");
        admin.require_auth();

        let mut record = storage::get_identity(&env, &identity).expect("Identity not found");
        record.verification = VerificationState {
            email_verified,
            phone_verified,
            government_id_verified,
            wallet_linked,
        };

        storage::set_identity(&env, &identity, &record);
    }

    pub fn profile_completeness(env: Env, identity: Address) -> ProfileCompleteness {
        let maybe_record = storage::get_identity(&env, &identity);

        if let Some(record) = maybe_record {
            let has_display_name = record.display_name.is_some();
            let has_country_code = record.country_code.is_some();
            let has_bio = record.bio.is_some();
            let has_avatar_uri = record.avatar_uri.is_some();
            let completed_fields = (has_display_name as u32)
                + (has_country_code as u32)
                + (has_bio as u32)
                + (has_avatar_uri as u32);

            ProfileCompleteness {
                identity,
                exists: true,
                score_bps: completed_fields * 2_500,
                completed_fields,
                total_fields: 4,
                has_display_name,
                has_country_code,
                has_bio,
                has_avatar_uri,
            }
        } else {
            ProfileCompleteness {
                identity,
                exists: false,
                score_bps: 0,
                completed_fields: 0,
                total_fields: 4,
                has_display_name: false,
                has_country_code: false,
                has_bio: false,
                has_avatar_uri: false,
            }
        }
    }

    pub fn verification_summary(env: Env, identity: Address) -> VerificationSummary {
        let mut pending_requirements = Vec::<String>::new(&env);

        if let Some(record) = storage::get_identity(&env, &identity) {
            let verification = record.verification;
            let completed_dimensions = (verification.email_verified as u32)
                + (verification.phone_verified as u32)
                + (verification.government_id_verified as u32)
                + (verification.wallet_linked as u32);

            if !verification.email_verified {
                pending_requirements.push_back(String::from_str(&env, "email"));
            }
            if !verification.phone_verified {
                pending_requirements.push_back(String::from_str(&env, "phone"));
            }
            if !verification.government_id_verified {
                pending_requirements.push_back(String::from_str(&env, "government_id"));
            }
            if !verification.wallet_linked {
                pending_requirements.push_back(String::from_str(&env, "wallet_link"));
            }

            VerificationSummary {
                identity,
                exists: true,
                completed_dimensions,
                total_dimensions: 4,
                email_verified: verification.email_verified,
                phone_verified: verification.phone_verified,
                government_id_verified: verification.government_id_verified,
                wallet_linked: verification.wallet_linked,
                is_fully_verified: completed_dimensions == 4,
                pending_requirements,
            }
        } else {
            pending_requirements.push_back(String::from_str(&env, "email"));
            pending_requirements.push_back(String::from_str(&env, "phone"));
            pending_requirements.push_back(String::from_str(&env, "government_id"));
            pending_requirements.push_back(String::from_str(&env, "wallet_link"));

            VerificationSummary {
                identity,
                exists: false,
                completed_dimensions: 0,
                total_dimensions: 4,
                email_verified: false,
                phone_verified: false,
                government_id_verified: false,
                wallet_linked: false,
                is_fully_verified: false,
                pending_requirements,
            }
        }
    }
}

#[cfg(test)]
mod test;
