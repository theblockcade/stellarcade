#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod svg_builder;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, Address, Env, String};

pub use types::{AchievementTier, Avatar, AvatarTraitsSummary};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotAdmin = 3,
    AvatarNotFound = 4,
    NotOwner = 5,
    NotGameAuthority = 6,
    MathOverflow = 7,
}

#[contract]
pub struct AvatarReputationNft;

#[contractimpl]
impl AvatarReputationNft {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        storage::write_admin(&env, &admin);
        Ok(())
    }

    pub fn mint_avatar(env: Env, player: Address) -> Result<u64, Error> {
        player.require_auth();

        let token_id = storage::next_token_id(&env);
        let tier = storage::tier_for_level(1);

        storage::write_avatar(
            &env,
            &Avatar {
                token_id,
                owner: player,
                level: 1,
                wins: 0,
                tier,
            },
        );
        Ok(token_id)
    }

    pub fn update_avatar_stats(
        env: Env,
        game_authority: Address,
        token_id: u64,
        level: u32,
        wins: u32,
    ) -> Result<(), Error> {
        game_authority.require_auth();

        let admin = storage::read_admin(&env).ok_or(Error::NotInitialized)?;
        if game_authority != admin {
            return Err(Error::NotGameAuthority);
        }

        let mut avatar = storage::read_avatar(&env, token_id).ok_or(Error::AvatarNotFound)?;
        avatar.level = level;
        avatar.wins = wins;
        avatar.tier = storage::tier_for_level(level);
        storage::write_avatar(&env, &avatar);
        Ok(())
    }

    pub fn token_uri(env: Env, token_id: u64) -> Result<String, Error> {
        let avatar = storage::read_avatar(&env, token_id).ok_or(Error::AvatarNotFound)?;
        Ok(svg_builder::generate_token_uri(&env, &avatar))
    }

    pub fn get_avatar_traits(env: Env, token_id: u64) -> Result<AvatarTraitsSummary, Error> {
        let avatar = storage::read_avatar(&env, token_id).ok_or(Error::AvatarNotFound)?;
        Ok(AvatarTraitsSummary {
            token_id: avatar.token_id,
            level: avatar.level,
            wins: avatar.wins,
            tier: avatar.tier,
        })
    }
}
