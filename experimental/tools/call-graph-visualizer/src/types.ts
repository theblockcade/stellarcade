/** A single Soroban contract discovered under the scanned `contracts/*` directory. */
export interface ContractInfo {
  /** Directory name under `contracts/`, e.g. `coin-flip`. */
  dirName: string;
  /** The `#[contract]` struct name declared in the contract's source, e.g. `CoinFlip`. */
  structName: string | null;
  /** Absolute or repo-relative path to the contract's crate root (the directory containing `src/`). */
  path: string;
}

/** A single detected `XyzClient::new(&env, &address)` cross-contract call site. */
export interface CallSite {
  /** The `Client` type name referenced, e.g. `RandomGeneratorClient`. */
  clientName: string;
  /** Source file the call site was found in, relative to the contract's crate root. */
  file: string;
  /** 1-indexed line number of the call site. */
  line: number;
}

/** A directed edge in the call graph: `caller` invokes `callee`. */
export interface CallGraphEdge {
  caller: string;
  callee: string;
  /** Call sites (file + line) backing this edge; a caller/callee pair may have more than one. */
  callSites: CallSite[];
}

export interface ContractCallCounts {
  contract: string;
  inward: number;
  outward: number;
}

export interface CallGraphReport {
  contracts: ContractInfo[];
  edges: CallGraphEdge[];
  /** Contracts with zero inward and zero outward edges. */
  isolatedContracts: string[];
  callCounts: ContractCallCounts[];
}

export type OutputFormat = 'mermaid' | 'dot';
