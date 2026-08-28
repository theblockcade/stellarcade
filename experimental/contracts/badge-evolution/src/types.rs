//! Shared data types for the badge evolution contract.

use soroban_sdk::{contracttype, Address, Vec};

/// A minted badge: owned by a player, at a given evolution tier.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Badge {
    pub token_id: u64,
    pub owner: Address,
    /// Evolution tier: 1 = base, 2/3/... = evolved.
    pub level: u32,
    /// Which base item type this badge is (arbitrary caller-defined id,
    /// e.g. a hash or short code identifying "Fire Sword" vs "Ice Shield").
    pub item_type: u32,
}

/// An evolution recipe: burn `required_burn_ids` worth of ingredient
/// badges (of `base_item` type) plus pay `token_fee`, to receive a new
/// badge of `result_item` type at the next tier.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EvolutionRecipe {
    pub recipe_id: u64,
    pub base_item: u32,
    /// Number of duplicate base-item badges that must be burned.
    pub required_burn_count: u32,
    pub result_item: u32,
    pub result_level: u32,
    pub token_fee: i128,
}

/// Read-only summary of a recipe, for query accessors.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RecipeSummary {
    pub recipe_id: u64,
    pub base_item: u32,
    pub required_burn_count: u32,
    pub result_item: u32,
    pub result_level: u32,
    pub token_fee: i128,
}

impl From<EvolutionRecipe> for RecipeSummary {
    fn from(recipe: EvolutionRecipe) -> Self {
        RecipeSummary {
            recipe_id: recipe.recipe_id,
            base_item: recipe.base_item,
            required_burn_count: recipe.required_burn_count,
            result_item: recipe.result_item,
            result_level: recipe.result_level,
            token_fee: recipe.token_fee,
        }
    }
}

/// Result of a successful evolution: the newly minted badge's token id and
/// the ingredient token ids that were burned.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EvolutionResult {
    pub new_token_id: u64,
    pub burned_token_ids: Vec<u64>,
}
