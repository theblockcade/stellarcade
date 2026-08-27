import { promises as fs } from 'fs';
import path from 'path';
import type { CallGraphEdge, CallSite, ContractInfo } from './types';

/**
 * Matches a Soroban `#[contract]` struct declaration, e.g.:
 *   #[contract]
 *   pub struct CoinFlip;
 * Tolerates other attributes appearing between `#[contract]` and the
 * struct (e.g. `#[derive(...)]` is not used on contract struct markers
 * in this codebase, but re-exports/blank lines are), and both `struct
 * Name;` and `struct Name {}` forms.
 */
const CONTRACT_STRUCT_RE = /#\[contract\]\s*(?:#\[[^\]]*\]\s*)*pub\s+struct\s+(\w+)\s*[;{]/;

/**
 * Matches a cross-contract client construction call, e.g.:
 *   RandomGeneratorClient::new(&env, &rng_addr)
 * Captures the `Client` type name. Requires the type name to end in
 * `Client` so generic `SomeType::new(...)` calls unrelated to
 * cross-contract invocation are not misdetected.
 */
const CLIENT_NEW_RE = /(\w+Client)::new\s*\(/g;

/**
 * Finds every immediate subdirectory of `contractsDir` that contains a
 * `src/lib.rs`, treating each as one Soroban contract crate. Returns an
 * empty list (rather than throwing) if `contractsDir` doesn't exist, so
 * callers can point this at an empty/scratch workspace without erroring.
 */
export async function discoverContracts(contractsDir: string): Promise<ContractInfo[]> {
  let entries;
  try {
    entries = await fs.readdir(contractsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const contracts: ContractInfo[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const contractPath = path.join(contractsDir, entry.name);
    const libPath = path.join(contractPath, 'src', 'lib.rs');

    let source: string;
    try {
      source = await fs.readFile(libPath, 'utf-8');
    } catch {
      continue; // not a contract crate (no src/lib.rs)
    }

    const structMatch = source.match(CONTRACT_STRUCT_RE);
    contracts.push({
      dirName: entry.name,
      structName: structMatch ? structMatch[1] : null,
      path: contractPath,
    });
  }

  return contracts.sort((a, b) => a.dirName.localeCompare(b.dirName));
}

/**
 * Scans a single contract's `src/lib.rs` (relative to `contract.path`)
 * for `XyzClient::new(...)` call sites. Only `lib.rs` is scanned since
 * that mirrors where every contract in this codebase declares its
 * cross-contract client calls (see `src/lib.rs` across `contracts/*`);
 * additional source files can be added here if that convention changes.
 */
export async function findCallSites(contract: ContractInfo): Promise<CallSite[]> {
  const relativeFile = path.join('src', 'lib.rs');
  const libPath = path.join(contract.path, relativeFile);

  let source: string;
  try {
    source = await fs.readFile(libPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = source.split('\n');
  const callSites: CallSite[] = [];

  lines.forEach((lineText, index) => {
    // Skip line comments; a commented-out call site is not a real edge.
    const codePart = stripLineComment(lineText);
    const matches = codePart.matchAll(CLIENT_NEW_RE);
    for (const match of matches) {
      callSites.push({ clientName: match[1], file: relativeFile, line: index + 1 });
    }
  });

  return callSites;
}

/** Strips a trailing `//` line comment, ignoring `//` inside string literals is out of scope here. */
function stripLineComment(line: string): string {
  const idx = line.indexOf('//');
  return idx === -1 ? line : line.slice(0, idx);
}

/**
 * Builds the directed call graph across every discovered contract:
 * scans each contract's call sites, resolves each `XyzClient` reference
 * back to the contract whose `#[contract]` struct is `Xyz`, and skips
 * (rather than errors on) client references that don't resolve to any
 * discovered contract — e.g. a client type from an external crate not
 * present in this scan, or a contract calling its own generated client
 * type in a test helper.
 */
export function buildCallGraph(contracts: ContractInfo[], callSitesByContract: Map<string, CallSite[]>): CallGraphEdge[] {
  const structNameToDir = new Map<string, string>();
  for (const contract of contracts) {
    if (contract.structName) {
      structNameToDir.set(`${contract.structName}Client`, contract.dirName);
    }
  }

  // caller -> callee -> accumulated call sites
  const edgeMap = new Map<string, Map<string, CallSite[]>>();

  for (const contract of contracts) {
    const callSites = callSitesByContract.get(contract.dirName) ?? [];
    for (const callSite of callSites) {
      const calleeDir = structNameToDir.get(callSite.clientName);
      // Unresolvable client (external crate) or a contract referencing
      // its own client type (not a cross-contract call) is skipped.
      if (!calleeDir || calleeDir === contract.dirName) continue;

      if (!edgeMap.has(contract.dirName)) {
        edgeMap.set(contract.dirName, new Map());
      }
      const calleeMap = edgeMap.get(contract.dirName)!;
      if (!calleeMap.has(calleeDir)) {
        calleeMap.set(calleeDir, []);
      }
      calleeMap.get(calleeDir)!.push(callSite);
    }
  }

  const edges: CallGraphEdge[] = [];
  for (const [caller, calleeMap] of edgeMap) {
    for (const [callee, callSites] of calleeMap) {
      edges.push({ caller, callee, callSites });
    }
  }

  return edges.sort((a, b) => a.caller.localeCompare(b.caller) || a.callee.localeCompare(b.callee));
}

/**
 * Scans an entire contracts workspace end-to-end: discovers contracts,
 * finds call sites for each, and builds the resolved call graph edges.
 */
export async function scanWorkspace(contractsDir: string): Promise<{
  contracts: ContractInfo[];
  edges: CallGraphEdge[];
}> {
  const contracts = await discoverContracts(contractsDir);
  const callSitesByContract = new Map<string, CallSite[]>();

  for (const contract of contracts) {
    callSitesByContract.set(contract.dirName, await findCallSites(contract));
  }

  const edges = buildCallGraph(contracts, callSitesByContract);
  return { contracts, edges };
}
