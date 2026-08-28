import type { FixtureTemplate } from './types';

/** Convert a kebab-case contract name into its PascalCase struct name,
 * matching the `<Name>Contract` / `<Name>ContractClient` convention used
 * across experimental/contracts/*\/src/lib.rs. */
export function toPascalCase(kebabName: string): string {
  return kebabName
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

interface TemplateContext {
  structName: string;
  contractName: string;
}

function header(ctx: TemplateContext): string {
  return `#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env};
`;
}

function setupSinglePlayer(ctx: TemplateContext): string {
  return `
struct Setup {
    env: Env,
    client: ${ctx.structName}ContractClient<'static>,
    admin: Address,
    player: Address,
    token: token::Client<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let player = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token::Client::new(&env, &sac.address());
    token::StellarAssetClient::new(&env, &sac.address()).mint(&player, &1_000_000i128);

    let contract_id = env.register(${ctx.structName}Contract, ());
    let client = ${ctx.structName}ContractClient::new(&env, &contract_id);

    Setup { env, client, admin, player, token }
}

#[test]
fn test_${ctx.contractName}_initializes_with_funded_player() {
    let s = setup();
    assert_eq!(s.token.balance(&s.player), 1_000_000);
}
`;
}

function setupMultiPlayer(ctx: TemplateContext): string {
  return `
struct Setup {
    env: Env,
    client: ${ctx.structName}ContractClient<'static>,
    admin: Address,
    players: [Address; 3],
    token: token::Client<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let players = [
        Address::generate(&env),
        Address::generate(&env),
        Address::generate(&env),
    ];
    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token::Client::new(&env, &sac.address());
    let sac_admin = token::StellarAssetClient::new(&env, &sac.address());
    for player in &players {
        sac_admin.mint(player, &1_000_000i128);
    }

    let contract_id = env.register(${ctx.structName}Contract, ());
    let client = ${ctx.structName}ContractClient::new(&env, &contract_id);

    Setup { env, client, admin, players, token }
}

#[test]
fn test_${ctx.contractName}_initializes_with_all_players_funded() {
    let s = setup();
    for player in &s.players {
        assert_eq!(s.token.balance(player), 1_000_000);
    }
}
`;
}

function setupStaking(ctx: TemplateContext): string {
  return `
struct Setup {
    env: Env,
    client: ${ctx.structName}ContractClient<'static>,
    admin: Address,
    staker: Address,
    oracle: Address,
    token: token::Client<'static>,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let staker = Address::generate(&env);
    // Mock oracle address for price-feed / randomness-source style calls.
    let oracle = Address::generate(&env);

    let sac = env.register_stellar_asset_contract_v2(admin.clone());
    let token = token::Client::new(&env, &sac.address());
    token::StellarAssetClient::new(&env, &sac.address()).mint(&staker, &1_000_000i128);

    let contract_id = env.register(${ctx.structName}Contract, ());
    let client = ${ctx.structName}ContractClient::new(&env, &contract_id);

    Setup { env, client, admin, staker, oracle, token }
}

#[test]
fn test_${ctx.contractName}_initializes_with_staker_funded() {
    let s = setup();
    assert_eq!(s.token.balance(&s.staker), 1_000_000);
}
`;
}

const TEMPLATE_BODIES: Record<FixtureTemplate, (ctx: TemplateContext) => string> = {
  'single-player': setupSinglePlayer,
  'multi-player': setupMultiPlayer,
  staking: setupStaking,
};

/**
 * Generate a `test.rs` fixture body for `contractKebabName` using
 * `template`. The output is intended to be dropped into a contract crate
 * as `src/test.rs` (or appended to an existing one) and adjusted to call
 * the contract's actual `initialize`/entrypoint methods — this scaffolds
 * the Env/token/address boilerplate, not the contract-specific assertions.
 */
export function generateFixture(contractKebabName: string, template: FixtureTemplate): string {
  const structName = toPascalCase(contractKebabName);
  const contractName = contractKebabName.replace(/-/g, '_');
  const ctx: TemplateContext = { structName, contractName };

  const body = TEMPLATE_BODIES[template](ctx);
  return `${header(ctx)}${body}`;
}
