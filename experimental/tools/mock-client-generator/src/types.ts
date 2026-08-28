/** Parsed Rust function signature from a contract's lib.rs */
export interface RustFunction {
  name: string;
  args: RustArg[];
  returnType: RustType;
  docComment?: string;
}

/** A single argument in a Rust function signature */
export interface RustArg {
  name: string;
  ty: RustType;
}

/** Simplified Rust type representation */
export interface RustType {
  raw: string;
  kind: RustTypeKind;
}

export type RustTypeKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'address'
  | 'bytes'
  | 'option'
  | 'vec'
  | 'map'
  | 'tuple'
  | 'enum'
  | 'struct'
  | 'unknown';

/** Options for the mock builder */
export interface MockBuilderOptions {
  /** Contract name used as the class name */
  contractName: string;
  /** Functions parsed from the Rust source */
  functions: RustFunction[];
  /** Default latency in ms for mocked async calls (0 = instant) */
  defaultLatencyMs?: number;
  /** If true, generate panic/error simulation methods */
  includeErrorSimulation?: boolean;
}

/** Configuration for a single mock method's return value */
export interface MockMethodConfig {
  methodName: string;
  /** Static return value (overrides dynamic if set) */
  returnValue?: unknown;
  /** Latency in ms to simulate before returning */
  latencyMs?: number;
  /** Error symbol to throw (e.g. "contractError", "panic") */
  throwSymbol?: string;
  /** Number of times to return before throwing/switching */
  succeedCount?: number;
}

/** Full mock client configuration */
export interface MockClientConfig {
  methods: Record<string, MockMethodConfig>;
}

/** CLI options parsed from arguments */
export interface CliOptions {
  contractDir: string;
  out: string;
  contractName?: string;
  latencyMs?: number;
  includeErrorSimulation?: boolean;
}
