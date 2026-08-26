import {
  ContractSpecResult,
  SorobanType,
  SpecEntry,
  SpecEnum,
  SpecFunction,
  SpecStruct,
  SpecUnion
} from './wasm-parser';

export function sorobanTypeToTs(type: SorobanType): string {
  switch (type.kind) {
    case 'val': return 'unknown';
    case 'bool': return 'boolean';
    case 'void': return 'void';
    case 'error': return 'Error';
    case 'u32':
    case 'i32': return 'number';
    case 'u64':
    case 'i64':
    case 'u128':
    case 'i128':
    case 'u256':
    case 'i256':
    case 'timepoint':
    case 'duration': return 'bigint';
    case 'bytes':
    case 'bytesN': return 'Uint8Array';
    case 'string':
    case 'symbol':
    case 'address': return 'string';
    case 'option': return `${sorobanTypeToTs(type.valueType)} | null`;
    case 'result': return `{ ok: ${sorobanTypeToTs(type.okType)} } | { err: ${sorobanTypeToTs(type.errorType)} }`;
    case 'vec': return `Array<${sorobanTypeToTs(type.elementType)}>`;
    case 'map': return `Map<${sorobanTypeToTs(type.keyType)}, ${sorobanTypeToTs(type.valueType)}>`;
    case 'tuple': return `[${type.elementTypes.map(sorobanTypeToTs).join(', ')}]`;
    case 'udt': return type.name;
    default: return 'unknown';
  }
}

export function generateTypeScriptDefinitions(specResult: ContractSpecResult): string {
  const lines: string[] = [];

  lines.push('/**');
  lines.push(' * Auto-generated Soroban Contract TypeScript Definitions');
  if (specResult.envMeta) {
    lines.push(` * Soroban Protocol Version: ${specResult.envMeta.protocolVersion}`);
  }
  lines.push(' */\n');

  const structs: SpecStruct[] = [];
  const enums: SpecEnum[] = [];
  const unions: SpecUnion[] = [];
  const functions: SpecFunction[] = [];

  for (const entry of specResult.specEntries) {
    if (entry.kind === 'struct') structs.push(entry);
    else if (entry.kind === 'enum') enums.push(entry);
    else if (entry.kind === 'union') unions.push(entry);
    else if (entry.kind === 'function') functions.push(entry);
  }

  // Generate Enums
  for (const item of enums) {
    if (item.doc) {
      lines.push(`/** ${item.doc} */`);
    }
    lines.push(`export enum ${item.name} {`);
    for (const c of item.cases) {
      if (c.doc) lines.push(`  /** ${c.doc} */`);
      lines.push(`  ${c.name} = ${c.value},`);
    }
    lines.push('}\n');
  }

  // Generate Structs
  for (const item of structs) {
    if (item.doc) {
      lines.push(`/** ${item.doc} */`);
    }
    lines.push(`export interface ${item.name} {`);
    for (const f of item.fields) {
      if (f.doc) lines.push(`  /** ${f.doc} */`);
      lines.push(`  ${f.name}: ${sorobanTypeToTs(f.type)};`);
    }
    lines.push('}\n');
  }

  // Generate Unions
  for (const item of unions) {
    if (item.doc) {
      lines.push(`/** ${item.doc} */`);
    }
    const unionParts = item.cases.map((c) => {
      if (c.type) {
        return `{ tag: '${c.name}'; value: ${sorobanTypeToTs(c.type)} }`;
      }
      return `{ tag: '${c.name}' }`;
    });
    lines.push(`export type ${item.name} = ${unionParts.join(' | ') || 'never'};\n`);
  }

  // Generate Contract Client Interface
  lines.push('export interface SorobanContractClient {');
  for (const fn of functions) {
    if (fn.doc) {
      lines.push(`  /** ${fn.doc} */`);
    }
    const params = fn.inputs
      .map((inp) => `${inp.name}: ${sorobanTypeToTs(inp.type)}`)
      .join(', ');
    const returnType = fn.outputs.length > 0
      ? fn.outputs.map(sorobanTypeToTs).join(' | ')
      : 'void';
    lines.push(`  ${fn.name}(${params}): Promise<${returnType}>;`);
  }
  lines.push('}');

  return lines.join('\n');
}
