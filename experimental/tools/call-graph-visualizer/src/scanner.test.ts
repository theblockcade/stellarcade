import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { buildCallGraph, discoverContracts, findCallSites, scanWorkspace } from './scanner';
import type { CallSite, ContractInfo } from './types';

/**
 * Builds a temporary mock contracts workspace on disk mirroring the
 * shape of this repo's contracts/*\/src/lib.rs layout, so the scanner
 * (which reads real files) can be exercised against controlled fixture
 * sources without depending on the actual contracts/ tree's current
 * contents.
 */
async function writeMockWorkspace(root: string, contracts: Record<string, string>): Promise<void> {
  for (const [dirName, libRsSource] of Object.entries(contracts)) {
    const srcDir = path.join(root, dirName, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    await fs.writeFile(path.join(srcDir, 'lib.rs'), libRsSource, 'utf-8');
  }
}

const COIN_FLIP_SOURCE = `
#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env};
use stellarcade_random_generator::RandomGeneratorClient;

#[contract]
pub struct CoinFlip;

#[contractimpl]
impl CoinFlip {
    pub fn place_bet(env: Env, rng_addr: Address) {
        RandomGeneratorClient::new(&env, &rng_addr).request_random(&env.current_contract_address(), &1u64, &2u64);
    }
}
`;

const RANDOM_GENERATOR_SOURCE = `
#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct RandomGenerator;

#[contractimpl]
impl RandomGenerator {
    pub fn request_random(env: Env, requester: soroban_sdk::Address, id: u64, max: u64) {}
}
`;

const ISOLATED_SOURCE = `
#![no_std]
use soroban_sdk::{contract, contractimpl, Env};

#[contract]
pub struct StandaloneVault;

#[contractimpl]
impl StandaloneVault {
    pub fn deposit(env: Env, amount: i128) {}
}
`;

describe('discoverContracts', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'call-graph-fixture-'));
    await writeMockWorkspace(tmpDir, {
      'coin-flip': COIN_FLIP_SOURCE,
      'random-generator': RANDOM_GENERATOR_SOURCE,
      'standalone-vault': ISOLATED_SOURCE,
    });
    // A non-contract directory (no src/lib.rs) should be skipped.
    await fs.mkdir(path.join(tmpDir, 'README-only'), { recursive: true });
    await fs.writeFile(path.join(tmpDir, 'README-only', 'README.md'), 'not a crate', 'utf-8');
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('discovers every directory containing src/lib.rs', async () => {
    const contracts = await discoverContracts(tmpDir);
    expect(contracts.map((c) => c.dirName)).toEqual(['coin-flip', 'random-generator', 'standalone-vault']);
  });

  it('extracts the #[contract] struct name for each contract', async () => {
    const contracts = await discoverContracts(tmpDir);
    const coinFlip = contracts.find((c) => c.dirName === 'coin-flip');
    expect(coinFlip?.structName).toBe('CoinFlip');
  });

  it('skips directories without a src/lib.rs', async () => {
    const contracts = await discoverContracts(tmpDir);
    expect(contracts.find((c) => c.dirName === 'README-only')).toBeUndefined();
  });

  it('returns an empty array for a nonexistent directory instead of throwing', async () => {
    const contracts = await discoverContracts(path.join(tmpDir, 'does-not-exist'));
    expect(contracts).toEqual([]);
  });
});

describe('findCallSites', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'call-graph-fixture-'));
    await writeMockWorkspace(tmpDir, { 'coin-flip': COIN_FLIP_SOURCE });
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('finds a Client::new call site with its line number', async () => {
    const contract: ContractInfo = { dirName: 'coin-flip', structName: 'CoinFlip', path: path.join(tmpDir, 'coin-flip') };
    const callSites = await findCallSites(contract);

    expect(callSites).toHaveLength(1);
    expect(callSites[0].clientName).toBe('RandomGeneratorClient');
    expect(callSites[0].file).toBe(path.join('src', 'lib.rs'));
    expect(callSites[0].line).toBe(12);
  });

  it('ignores a Client::new call site inside a line comment', async () => {
    const source = `
      // RandomGeneratorClient::new(&env, &addr) is commented out
      pub fn noop() {}
    `;
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'call-graph-comment-'));
    await writeMockWorkspace(dir, { 'commented': source });
    const contract: ContractInfo = { dirName: 'commented', structName: null, path: path.join(dir, 'commented') };

    expect(await findCallSites(contract)).toEqual([]);
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('finds multiple call sites across multiple lines', async () => {
    const source = `
      use a::AClient;
      use b::BClient;
      pub fn f(env: Env, x: Address, y: Address) {
          AClient::new(&env, &x).ping();
          BClient::new(&env, &y).ping();
      }
    `;
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'call-graph-multi-'));
    await writeMockWorkspace(dir, { multi: source });
    const contract: ContractInfo = { dirName: 'multi', structName: null, path: path.join(dir, 'multi') };

    const callSites = await findCallSites(contract);
    expect(callSites.map((c) => c.clientName)).toEqual(['AClient', 'BClient']);
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('returns an empty array when the contract has no lib.rs', async () => {
    const contract: ContractInfo = { dirName: 'missing', structName: null, path: path.join(tmpDir, 'missing') };
    expect(await findCallSites(contract)).toEqual([]);
  });
});

describe('buildCallGraph', () => {
  const contracts: ContractInfo[] = [
    { dirName: 'coin-flip', structName: 'CoinFlip', path: '/x/coin-flip' },
    { dirName: 'random-generator', structName: 'RandomGenerator', path: '/x/random-generator' },
    { dirName: 'standalone-vault', structName: 'StandaloneVault', path: '/x/standalone-vault' },
  ];

  it('resolves a Client reference to the contract declaring the matching #[contract] struct', () => {
    const callSite: CallSite = { clientName: 'RandomGeneratorClient', file: 'src/lib.rs', line: 10 };
    const edges = buildCallGraph(contracts, new Map([['coin-flip', [callSite]]]));

    expect(edges).toHaveLength(1);
    expect(edges[0]).toMatchObject({ caller: 'coin-flip', callee: 'random-generator' });
    expect(edges[0].callSites).toEqual([callSite]);
  });

  it('skips a Client reference that does not resolve to any discovered contract', () => {
    const callSite: CallSite = { clientName: 'SomeExternalClient', file: 'src/lib.rs', line: 5 };
    const edges = buildCallGraph(contracts, new Map([['coin-flip', [callSite]]]));
    expect(edges).toEqual([]);
  });

  it('skips a contract referencing its own client type (not a cross-contract call)', () => {
    const callSite: CallSite = { clientName: 'CoinFlipClient', file: 'src/lib.rs', line: 5 };
    const edges = buildCallGraph(contracts, new Map([['coin-flip', [callSite]]]));
    expect(edges).toEqual([]);
  });

  it('produces no edges for a contract with no call sites', () => {
    const edges = buildCallGraph(contracts, new Map());
    expect(edges).toEqual([]);
  });

  it('groups multiple call sites between the same caller/callee into one edge', () => {
    const callSites: CallSite[] = [
      { clientName: 'RandomGeneratorClient', file: 'src/lib.rs', line: 10 },
      { clientName: 'RandomGeneratorClient', file: 'src/lib.rs', line: 25 },
    ];
    const edges = buildCallGraph(contracts, new Map([['coin-flip', callSites]]));

    expect(edges).toHaveLength(1);
    expect(edges[0].callSites).toHaveLength(2);
  });

  it('sorts edges by caller then callee', () => {
    const edges = buildCallGraph(contracts, new Map([
      ['standalone-vault', [{ clientName: 'CoinFlipClient', file: 'src/lib.rs', line: 1 }]],
      ['coin-flip', [{ clientName: 'RandomGeneratorClient', file: 'src/lib.rs', line: 1 }]],
    ]));

    expect(edges.map((e) => e.caller)).toEqual(['coin-flip', 'standalone-vault']);
  });
});

describe('scanWorkspace (end-to-end)', () => {
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'call-graph-e2e-'));
    await writeMockWorkspace(tmpDir, {
      'coin-flip': COIN_FLIP_SOURCE,
      'random-generator': RANDOM_GENERATOR_SOURCE,
      'standalone-vault': ISOLATED_SOURCE,
    });
  });

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('discovers contracts and builds edges in one pass', async () => {
    const { contracts, edges } = await scanWorkspace(tmpDir);

    expect(contracts).toHaveLength(3);
    expect(edges).toEqual([
      {
        caller: 'coin-flip',
        callee: 'random-generator',
        callSites: [{ clientName: 'RandomGeneratorClient', file: path.join('src', 'lib.rs'), line: 12 }],
      },
    ]);
  });
});
