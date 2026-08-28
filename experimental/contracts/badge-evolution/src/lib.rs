//! Stellarcade Badge Evolution Contract (experimental)
//!
//! Prototype item crafting/fusion contract: players burn duplicate base-item
//! badges (and/or pay an arcade-token fee) to evolve a badge into a
//! higher-tier variant per an admin-registered recipe.
//!
//! Badges here are a minimal internal token model (owner + level + item
//! type keyed by a u64 token id) rather than a full NFT/SEP standard —
//! sufficient to prototype the evolution mechanic without pulling in a
//! separate NFT contract dependency.

#![no_std]
#![allow(unexpected_cfgs)]

mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contracterror, contractimpl, token, Address, Env, Vec};

pub use types::{Badge, EvolutionRecipe, EvolutionResult, RecipeSummary};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    RecipeAlreadyExists = 3,
    RecipeNotFound = 4,
    InvalidRecipe = 5,
    BadgeNotFound = 6,
    NotBadgeOwner = 7,
    WrongIngredientCount = 8,
    WrongItemType = 9,
    DuplicateIngredient = 10,
    MathOverflow = 11,
}

#[contract]
pub struct BadgeEvolution;

#[contractimpl]
impl BadgeEvolution {
    /// One-time setup: admin (who registers recipes and mints starter
    /// badges) and the arcade token used for evolution fees.
    pub fn initialize(env: Env, admin: Address, token: Address) -> Result<(), Error> {
        if storage::read_admin(&env).is_some() {
            return Err(Error::AlreadyInitialized);
        }
        storage::write_admin(&env, &admin);
        storage::write_token(&env, &token);
        Ok(())
    }

    /// Admin-only: mint a base badge of `item_type` at level 1 to `owner`.
    /// Not part of the issue's required interface, but needed to get any
    /// badges into circulation for players to evolve.
    pub fn mint_badge(env: Env, owner: Address, item_type: u32) -> Result<u64, Error> {
        let admin = storage::read_admin(&env).ok_or(Error::NotInitialized)?;
        admin.require_auth();

        let token_id = storage::next_token_id(&env);
        storage::write_badge(
            &env,
            token_id,
            &Badge {
                token_id,
                owner,
                level: 1,
                item_type,
            },
        );
        Ok(token_id)
    }

    /// Admin-only: register an evolution recipe.
    pub fn register_recipe(
        env: Env,
        admin: Address,
        recipe_id: u64,
        base_item: u32,
        required_burn_count: u32,
        result_item: u32,
        result_level: u32,
        token_fee: i128,
    ) -> Result<(), Error> {
        let stored_admin = storage::read_admin(&env).ok_or(Error::NotInitialized)?;
        if stored_admin != admin {
            return Err(Error::NotInitialized);
        }
        admin.require_auth();

        if storage::read_recipe(&env, recipe_id).is_some() {
            return Err(Error::RecipeAlreadyExists);
        }
        if required_burn_count == 0 || result_level < 2 || token_fee < 0 {
            return Err(Error::InvalidRecipe);
        }

        storage::write_recipe(
            &env,
            recipe_id,
            &EvolutionRecipe {
                recipe_id,
                base_item,
                required_burn_count,
                result_item,
                result_level,
                token_fee,
            },
        );
        Ok(())
    }

    /// Evolve a badge: burn `input_token_ids` (all owned by `player`, all
    /// matching the recipe's `base_item` type, count matching
    /// `required_burn_count` exactly) and pay `token_fee`, minting a new
    /// badge of `result_item`/`result_level` to `player`.
    ///
    /// Returns the newly minted badge's token id.
    pub fn evolve_badge(
        env: Env,
        player: Address,
        recipe_id: u64,
        input_token_ids: Vec<u64>,
    ) -> Result<u64, Error> {
        player.require_auth();

        let recipe = storage::read_recipe(&env, recipe_id).ok_or(Error::RecipeNotFound)?;

        if input_token_ids.len() != recipe.required_burn_count {
            return Err(Error::WrongIngredientCount);
        }

        // Verify ownership, item type, and no duplicate token ids among the
        // ingredients before burning anything, so a failed evolution never
        // partially consumes the player's badges.
        let mut seen: Vec<u64> = Vec::new(&env);
        for token_id in input_token_ids.iter() {
            if seen.contains(&token_id) {
                return Err(Error::DuplicateIngredient);
            }
            seen.push_back(token_id);

            let badge = storage::read_badge(&env, token_id).ok_or(Error::BadgeNotFound)?;
            if badge.owner != player {
                return Err(Error::NotBadgeOwner);
            }
            if badge.item_type != recipe.base_item {
                return Err(Error::WrongItemType);
            }
        }

        if recipe.token_fee > 0 {
            token::Client::new(&env, &storage::read_token(&env)).transfer(
                &player,
                &env.current_contract_address(),
                &recipe.token_fee,
            );
        }

        for token_id in input_token_ids.iter() {
            storage::remove_badge(&env, token_id);
        }

        let new_token_id = storage::next_token_id(&env);
        storage::write_badge(
            &env,
            new_token_id,
            &Badge {
                token_id: new_token_id,
                owner: player,
                level: recipe.result_level,
                item_type: recipe.result_item,
            },
        );

        Ok(new_token_id)
    }

    /// Query accessor: a recipe's public parameters.
    pub fn get_recipe(env: Env, recipe_id: u64) -> Result<RecipeSummary, Error> {
        storage::read_recipe(&env, recipe_id)
            .map(RecipeSummary::from)
            .ok_or(Error::RecipeNotFound)
    }

    /// Query accessor: a badge's current evolution tier.
    pub fn get_badge_level(env: Env, token_id: u64) -> Result<u32, Error> {
        storage::read_badge(&env, token_id)
            .map(|b| b.level)
            .ok_or(Error::BadgeNotFound)
    }

    /// Query accessor: full badge record (owner/level/item type).
    pub fn get_badge(env: Env, token_id: u64) -> Result<Badge, Error> {
        storage::read_badge(&env, token_id).ok_or(Error::BadgeNotFound)
    }
}
