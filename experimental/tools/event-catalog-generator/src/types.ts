/** One `env.events().publish(topics, data)` call site found in a contract. */
export interface EventDefinition {
  /** The event's topic names, in order — usually a leading fixed Symbol plus data-derived topics. */
  topics: string[];
  /** Best-effort inferred payload field names/types from the `data` tuple expression, empty if it couldn't be inferred. */
  dataFields: DataField[];
  filePath: string;
  line: number;
  /** The raw source text of the `.publish(...)` call, for traceability in generated docs. */
  rawCall: string;
}

export interface DataField {
  name: string;
  /** Rust type as written at the call site, e.g. `i128`, `Address`, `Symbol`. Unresolved to `unknown` when not statically inferable from the call site alone. */
  type: string;
}

export interface EventCatalog {
  contractsScanned: number;
  events: EventDefinition[];
}

export type OutputFormat = 'markdown' | 'json';

export interface GeneratorConfig {
  contractsDir: string;
  format: OutputFormat;
  outPath?: string;
}
