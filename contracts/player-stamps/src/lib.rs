#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, Address, Env};

pub use types::{
    ClaimWindowAccessor, PlayerStampProgress, StampCampaign, StampClaimState,
    StampProgressSummary,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Campaign(u32),
    Progress(Address, u32),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAuthorized = 3,
    CampaignNotFound = 4,
    CampaignPaused = 5,
    AlreadyClaimed = 6,
    NotReadyToClaim = 7,
    StampGoalNotReached = 8,
}

#[contract]
pub struct PlayerStamps;

#[contractimpl]
impl PlayerStamps {
    pub fn init(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn upsert_campaign(
        env: Env,
        admin: Address,
        campaign_id: u32,
        required_stamps: u32,
        claimable_after: u64,
        paused: bool,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        storage::set_campaign(
            &env,
            campaign_id,
            &StampCampaign {
                required_stamps,
                claimable_after,
                paused,
            },
        );
        Ok(())
    }

    pub fn add_stamps(
        env: Env,
        admin: Address,
        player: Address,
        campaign_id: u32,
        amount: u32,
    ) -> Result<(), Error> {
        require_admin(&env, &admin)?;
        let campaign = storage::get_campaign(&env, campaign_id).ok_or(Error::CampaignNotFound)?;
        if campaign.paused {
            return Err(Error::CampaignPaused);
        }

        let mut progress = storage::get_progress(&env, &player, campaign_id).unwrap_or(
            PlayerStampProgress {
                earned_stamps: 0,
                claimed: false,
            },
        );
        progress.earned_stamps = progress.earned_stamps.saturating_add(amount);
        storage::set_progress(&env, &player, campaign_id, &progress);
        Ok(())
    }

    pub fn claim(
        env: Env,
        player: Address,
        campaign_id: u32,
    ) -> Result<PlayerStampProgress, Error> {
        player.require_auth();
        let campaign = storage::get_campaign(&env, campaign_id).ok_or(Error::CampaignNotFound)?;
        if campaign.paused {
            return Err(Error::CampaignPaused);
        }
        if env.ledger().timestamp() < campaign.claimable_after {
            return Err(Error::NotReadyToClaim);
        }

        let mut progress = storage::get_progress(&env, &player, campaign_id).unwrap_or(
            PlayerStampProgress {
                earned_stamps: 0,
                claimed: false,
            },
        );
        if progress.claimed {
            return Err(Error::AlreadyClaimed);
        }
        if progress.earned_stamps < campaign.required_stamps {
            return Err(Error::StampGoalNotReached);
        }
        progress.claimed = true;
        storage::set_progress(&env, &player, campaign_id, &progress);
        Ok(progress)
    }

    pub fn stamp_progress_summary(
        env: Env,
        player: Address,
        campaign_id: u32,
    ) -> StampProgressSummary {
        let configured = env.storage().instance().has(&DataKey::Admin);
        let Some(campaign) = storage::get_campaign(&env, campaign_id) else {
            return StampProgressSummary {
                player,
                campaign_id,
                configured,
                exists: false,
                required_stamps: 0,
                earned_stamps: 0,
                remaining_stamps: 0,
                completed: false,
                claimed: false,
                paused: false,
            };
        };

        let progress = storage::get_progress(&env, &player, campaign_id).unwrap_or(
            PlayerStampProgress {
                earned_stamps: 0,
                claimed: false,
            },
        );
        let remaining_stamps = campaign.required_stamps.saturating_sub(progress.earned_stamps);
        StampProgressSummary {
            player,
            campaign_id,
            configured,
            exists: true,
            required_stamps: campaign.required_stamps,
            earned_stamps: progress.earned_stamps,
            remaining_stamps,
            completed: progress.earned_stamps >= campaign.required_stamps,
            claimed: progress.claimed,
            paused: campaign.paused,
        }
    }

    pub fn claim_window_accessor(
        env: Env,
        player: Address,
        campaign_id: u32,
    ) -> ClaimWindowAccessor {
        let now = env.ledger().timestamp();
        let configured = env.storage().instance().has(&DataKey::Admin);
        let Some(campaign) = storage::get_campaign(&env, campaign_id) else {
            return ClaimWindowAccessor {
                player,
                campaign_id,
                configured,
                exists: false,
                state: if configured {
                    StampClaimState::Unknown
                } else {
                    StampClaimState::NotConfigured
                },
                claimable_after: 0,
                now,
                seconds_until_claimable: 0,
            };
        };

        let progress = storage::get_progress(&env, &player, campaign_id).unwrap_or(
            PlayerStampProgress {
                earned_stamps: 0,
                claimed: false,
            },
        );
        let completed = progress.earned_stamps >= campaign.required_stamps;
        let state = if progress.claimed {
            StampClaimState::Claimed
        } else if campaign.paused {
            StampClaimState::Paused
        } else if completed && now >= campaign.claimable_after {
            StampClaimState::Claimable
        } else {
            StampClaimState::InProgress
        };

        ClaimWindowAccessor {
            player,
            campaign_id,
            configured,
            exists: true,
            state,
            claimable_after: campaign.claimable_after,
            now,
            seconds_until_claimable: if completed && now < campaign.claimable_after {
                campaign.claimable_after - now
            } else {
                0
            },
        }
    }
}

fn require_admin(env: &Env, caller: &Address) -> Result<(), Error> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)?;
    caller.require_auth();
    if &admin != caller {
        return Err(Error::NotAuthorized);
    }
    Ok(())
}

#[cfg(test)]
mod test;
