/** The three Soroban storage durability classes a contract's ledger entries fall into. */
export type StorageDurability = 'instance' | 'persistent' | 'temporary';

/** A single decoded storage key/value pair, ready to be placed in the tree. */
export interface StorageEntry {
  durability: StorageDurability;
  /** Human-readable decoded key, e.g. `Symbol(Admin)` or `Map{recipient: Address(GABC...)}`. */
  decodedKey: string;
  /** The decoded SCVal type name of the key itself (Symbol, Vec, Map, Address, U64, ...). */
  keyType: string;
  /** Size, in bytes, of the raw XDR-encoded ledger entry (key + value). */
  sizeBytes: number;
  liveUntilLedgerSeq?: number;
}

/** One node in the rendered tree — either a durability bucket or a leaf entry under it. */
export interface TreeNode {
  label: string;
  sizeBytes: number;
  children: TreeNode[];
  /** Present on leaf nodes only, back-reference to the source entry. */
  entry?: StorageEntry;
}

export interface ExplorerConfig {
  contractId: string;
  rpcUrl: string;
  expandDepth: number;
  jsonOutput: boolean;
}
