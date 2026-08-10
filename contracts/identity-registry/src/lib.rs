#![no_std]

mod storage;
mod types;

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec};

pub use types::{
    IdentityRecord, IdentityRenewalState, ProfileCompleteness, RenewalWindowAccessor,
    StatusVerificationSnapshot, VerificationState, VerificationSummary,
};

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

    /// Point-in-time snapshot of an identity's verification status.
    ///
    /// Returns zeroed fields with `exists: false` when the identity is unknown.
    pub fn status_verification_snapshot(
        env: Env,
        identity: Address,
    ) -> StatusVerificationSnapshot {
        let configured = env.storage().instance().has(&DataKey::Admin);

        match storage::get_identity(&env, &identity) {
            Some(record) => {
                let v = record.verification;
                let completed_dimensions = (v.email_verified as u32)
                    + (v.phone_verified as u32)
                    + (v.government_id_verified as u32)
                    + (v.wallet_linked as u32);
                let score_bps = completed_dimensions * 2_500;
                StatusVerificationSnapshot {
                    identity,
                    configured,
                    exists: true,
                    email_verified: v.email_verified,
                    phone_verified: v.phone_verified,
                    government_id_verified: v.government_id_verified,
                    wallet_linked: v.wallet_linked,
                    completed_dimensions,
                    total_dimensions: 4,
                    is_fully_verified: completed_dimensions == 4,
                    score_bps,
                }
            }
            None => StatusVerificationSnapshot {
                identity,
                configured,
                exists: false,
                email_verified: false,
                phone_verified: false,
                government_id_verified: false,
                wallet_linked: false,
                completed_dimensions: 0,
                total_dimensions: 4,
                is_fully_verified: false,
                score_bps: 0,
            },
        }
    }

    /// Renewal-window details for a single identity.
    ///
    /// The caller supplies `expires_at_ledger` and `renewal_window_ledgers`.
    /// Neither value is stored by the contract — the caller controls the
    /// expiry policy.
    pub fn renewal_window_accessor(
        env: Env,
        identity: Address,
        expires_at_ledger: u32,
        renewal_window_ledgers: u32,
    ) -> RenewalWindowAccessor {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let current_ledger = env.ledger().sequence();

        let Some(record) = storage::get_identity(&env, &identity) else {
            return RenewalWindowAccessor {
                identity,
                configured,
                exists: false,
                state: if configured {
                    IdentityRenewalState::Unknown
                } else {
                    IdentityRenewalState::NotConfigured
                },
                expires_at_ledger,
                renewal_window_ledgers,
                renewal_window_start: expires_at_ledger
                    .saturating_sub(renewal_window_ledgers),
                in_renewal_window: false,
                is_expired: false,
                ledgers_until_expiry: 0,
                current_ledger,
            };
        };

        let v = record.verification;
        let is_fully_verified = v.email_verified
            && v.phone_verified
            && v.government_id_verified
            && v.wallet_linked;

        let is_expired = current_ledger > expires_at_ledger;
        let renewal_window_start =
            expires_at_ledger.saturating_sub(renewal_window_ledgers);
        let in_renewal_window =
            !is_expired && current_ledger >= renewal_window_start;

        let state = if is_expired {
            IdentityRenewalState::Expired
        } else if in_renewal_window {
            IdentityRenewalState::RenewalDue
        } else if is_fully_verified {
            IdentityRenewalState::Active
        } else {
            IdentityRenewalState::Unverified
        };

        let ledgers_until_expiry = if is_expired {
            0
        } else {
            expires_at_ledger - current_ledger
        };

        RenewalWindowAccessor {
            identity,
            configured,
            exists: true,
            state,
            expires_at_ledger,
            renewal_window_ledgers,
            renewal_window_start,
            in_renewal_window,
            is_expired,
            ledgers_until_expiry,
            current_ledger,
        }
    }
}

#[cfg(test)]
mod test;
