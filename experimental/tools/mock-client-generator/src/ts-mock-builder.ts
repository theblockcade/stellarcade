import type {
  MockBuilderOptions,
  MockClientConfig,
  MockMethodConfig,
  RustFunction,
  RustType,
} from './types.js';
import { defaultReturnValue } from './contract-parser.js';

/** Map Rust types to TypeScript type annotations. */
export function rustTypeToTs(ty: RustType): string {
  switch (ty.kind) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'address':
      return 'string';
    case 'bytes':
      return 'string';
    case 'option':
      return `(${rustTypeFromRaw(ty.raw.slice(7, -1))} | null)`;
    case 'vec':
      return 'unknown[]';
    case 'map':
      return 'Record<string, unknown>';
    case 'tuple':
      return 'unknown[]';
    default:
      return 'unknown';
  }
}

function rustTypeFromRaw(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed === 'String' || trimmed === '&str') return 'string';
  if (trimmed === 'bool') return 'boolean';
  if (trimmed === 'Address') return 'string';
  if (/^u\d+$/.test(trimmed) || /^i\d+$/.test(trimmed) || trimmed === 'u128' || trimmed === 'i128') {
    return 'number';
  }
  return 'unknown';
}

/** Build the TypeScript mock client source code. */
export function buildMockClientSource(options: MockBuilderOptions): string {
  const {
    contractName,
    functions,
    defaultLatencyMs = 0,
    includeErrorSimulation = false,
  } = options;

  const className = `Mock${contractName}Client`;

  const lines: string[] = [];

  lines.push(`/** Auto-generated mock client for ${contractName} */`);
  lines.push(`// regenerable: run mock-client-generator to rebuild`);
  lines.push('');

  // Imports
  lines.push(`import type { MockClientConfig, MockMethodConfig } from './types.js';`);
  lines.push('');

  // MockMethodState tracks per-method call counts and configured behavior
  lines.push(`interface MockMethodState {`);
  lines.push(`  config: MockMethodConfig;`);
  lines.push(`  callCount: number;`);
  lines.push(`}`);
  lines.push('');

  // Generate the class
  lines.push(`export class ${className} {`);
  lines.push(`  private _config: MockClientConfig;`);
  lines.push(`  private _states: Record<string, MockMethodState> = {};`);
  lines.push(`  private _defaultLatencyMs: number;`);
  lines.push('');

  // Constructor
  lines.push(`  constructor(config: MockClientConfig = { methods: {} }, defaultLatencyMs: number = ${defaultLatencyMs}) {`);
  lines.push(`    this._config = config;`);
  lines.push(`    this._defaultLatencyMs = defaultLatencyMs;`);
  lines.push(`    for (const [method, cfg] of Object.entries(config.methods)) {`);
  lines.push(`      this._states[method] = { config: cfg, callCount: 0 };`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  // _simulateLatency helper
  lines.push(`  private async _simulateLatency(ms?: number): Promise<void> {`);
  lines.push(`    const delay = ms ?? this._defaultLatencyMs;`);
  lines.push(`    if (delay > 0) {`);
  lines.push(`      await new Promise((resolve) => setTimeout(resolve, delay));`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  // _getReturnValue helper
  lines.push(`  private _getReturnValue(method: string, defaultValue: unknown): unknown {`);
  lines.push(`    const state = this._states[method];`);
  lines.push(`    if (!state) return defaultValue;`);
  lines.push(`    state.callCount++;`);
  lines.push(`    const { config } = state;`);
  lines.push('');

  lines.push(`    // If succeedCount is set and we've exceeded it, throw`);
  lines.push(`    if (config.succeedCount !== undefined && state.callCount > config.succeedCount) {`);
  lines.push(`      if (config.throwSymbol) {`);
  lines.push(`        throw new Error(\`Simulated \${config.throwSymbol} on call \${state.callCount}\`);`);
  lines.push(`      }`);
  lines.push(`    }`);
  lines.push('');

  lines.push(`    return config.returnValue ?? defaultValue;`);
  lines.push(`  }`);
  lines.push('');

  // Generate each method
  for (const fn of functions) {
    const argsStr = fn.args.map((a) => `${a.name}: ${rustTypeToTs(a.ty)}`).join(', ');
    const retTs = rustTypeToTs(fn.returnType);
    const defaultVal = JSON.stringify(defaultReturnValue(fn.returnType));
    const methodConfig = `this._config.methods['${fn.name}']`;

    if (fn.docComment) {
      lines.push(`  /** ${fn.docComment.replace(/\n/g, '\n   * ')} */`);
    }

    lines.push(`  async ${fn.name}(${argsStr}): Promise<${retTs}> {`);
    lines.push(`    const methodCfg = ${methodConfig};`);
    lines.push(`    await this._simulateLatency(methodCfg?.latencyMs);`);

    if (includeErrorSimulation) {
      lines.push(`    if (methodCfg?.throwSymbol) {`);
      lines.push(`      throw new Error(\`Simulated contract error: \${methodCfg.throwSymbol}\`);`);
      lines.push(`    }`);
    }

    lines.push(`    return this._getReturnValue('${fn.name}', ${defaultVal}) as ${retTs};`);
    lines.push(`  }`);
    lines.push('');
  }

  // Dynamic setter methods
  lines.push(`  /** Override the return value for a method at runtime. */`);
  lines.push(`  mockReturnValue(method: string, value: unknown): void {`);
  lines.push(`    if (!this._config.methods[method]) {`);
  lines.push(`      this._config.methods[method] = { methodName: method };`);
  lines.push(`      this._states[method] = { config: this._config.methods[method], callCount: 0 };`);
  lines.push(`    }`);
  lines.push(`    this._config.methods[method].returnValue = value;`);
  lines.push(`  }`);
  lines.push('');

  lines.push(`  /** Configure a method to throw a specific error symbol. */`);
  lines.push(`  mockThrow(method: string, symbol: string): void {`);
  lines.push(`    if (!this._config.methods[method]) {`);
  lines.push(`      this._config.methods[method] = { methodName: method };`);
  lines.push(`      this._states[method] = { config: this._config.methods[method], callCount: 0 };`);
  lines.push(`    }`);
  lines.push(`    this._config.methods[method].throwSymbol = symbol;`);
  lines.push(`  }`);
  lines.push('');

  lines.push(`  /** Configure a method to succeed N times then throw. */`);
  lines.push(`  mockSucceedThenThrow(method: string, succeedCount: number, throwSymbol: string): void {`);
  lines.push(`    if (!this._config.methods[method]) {`);
  lines.push(`      this._config.methods[method] = { methodName: method };`);
  lines.push(`      this._states[method] = { config: this._config.methods[method], callCount: 0 };`);
  lines.push(`    }`);
  lines.push(`    this._config.methods[method].succeedCount = succeedCount;`);
  lines.push(`    this._config.methods[method].throwSymbol = throwSymbol;`);
  lines.push(`  }`);
  lines.push('');

  // Reset method
  lines.push(`  /** Reset all call counters. */`);
  lines.push(`  reset(): void {`);
  lines.push(`    for (const state of Object.values(this._states)) {`);
  lines.push(`      state.callCount = 0;`);
  lines.push(`    }`);
  lines.push(`  }`);
  lines.push('');

  // getCallCount
  lines.push(`  /** Get the number of times a method was called. */`);
  lines.push(`  getCallCount(method: string): number {`);
  lines.push(`    return this._states[method]?.callCount ?? 0;`);
  lines.push(`  }`);

  lines.push(`}`);
  lines.push('');
  lines.push(`export default ${className};`);
  lines.push('');

  return lines.join('\n');
}

/** Build a default config from parsed functions. */
export function buildDefaultConfig(
  functions: RustFunction[],
  defaultLatencyMs: number = 0,
): MockClientConfig {
  const methods: Record<string, MockMethodConfig> = {};
  for (const fn of functions) {
    methods[fn.name] = {
      methodName: fn.name,
      returnValue: defaultReturnValue(fn.returnType),
      latencyMs: defaultLatencyMs,
    };
  }
  return { methods };
}
