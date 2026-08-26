export type SorobanType =
  | { kind: 'val' }
  | { kind: 'bool' }
  | { kind: 'void' }
  | { kind: 'error' }
  | { kind: 'u32' }
  | { kind: 'i32' }
  | { kind: 'u64' }
  | { kind: 'i64' }
  | { kind: 'u128' }
  | { kind: 'i128' }
  | { kind: 'u256' }
  | { kind: 'i256' }
  | { kind: 'timepoint' }
  | { kind: 'duration' }
  | { kind: 'bytes' }
  | { kind: 'string' }
  | { kind: 'symbol' }
  | { kind: 'address' }
  | { kind: 'option'; valueType: SorobanType }
  | { kind: 'result'; okType: SorobanType; errorType: SorobanType }
  | { kind: 'vec'; elementType: SorobanType }
  | { kind: 'map'; keyType: SorobanType; valueType: SorobanType }
  | { kind: 'tuple'; elementTypes: SorobanType[] }
  | { kind: 'bytesN'; n: number }
  | { kind: 'udt'; name: string };

export interface SpecFunctionInput {
  name: string;
  doc?: string;
  type: SorobanType;
}

export interface SpecFunction {
  kind: 'function';
  name: string;
  doc?: string;
  inputs: SpecFunctionInput[];
  outputs: SorobanType[];
}

export interface StructField {
  name: string;
  doc?: string;
  type: SorobanType;
}

export interface SpecStruct {
  kind: 'struct';
  name: string;
  doc?: string;
  fields: StructField[];
}

export interface EnumCase {
  name: string;
  value: number;
  doc?: string;
}

export interface SpecEnum {
  kind: 'enum';
  name: string;
  doc?: string;
  cases: EnumCase[];
}

export interface UnionCase {
  name: string;
  doc?: string;
  type?: SorobanType;
}

export interface SpecUnion {
  kind: 'union';
  name: string;
  doc?: string;
  cases: UnionCase[];
}

export type SpecEntry = SpecFunction | SpecStruct | SpecEnum | SpecUnion;

export interface ContractSpecResult {
  envMeta?: { protocolVersion: number };
  specEntries: SpecEntry[];
}

/**
 * Extracts custom sections from WASM byte buffer.
 */
export function extractWasmCustomSection(wasmBuffer: Buffer, sectionName: string): Buffer[] {
  const sections: Buffer[] = [];
  
  // Standard WASM magic & version check
  if (wasmBuffer.length < 8) {
    return sections;
  }
  const magic = wasmBuffer.subarray(0, 4).toString('hex');
  if (magic !== '0061736d') {
    return sections;
  }

  let offset = 8;
  while (offset < wasmBuffer.length) {
    const sectionId = wasmBuffer[offset++];
    
    // Read varuint32 section size
    let sectionSize = 0;
    let shift = 0;
    while (offset < wasmBuffer.length) {
      const byte = wasmBuffer[offset++];
      sectionSize |= (byte & 0x7f) << shift;
      if ((byte & 0x80) === 0) break;
      shift += 7;
    }

    const sectionEnd = offset + sectionSize;

    if (sectionId === 0) { // Custom section
      // Read varuint32 name length
      let nameLen = 0;
      shift = 0;
      let nameOffset = offset;
      while (nameOffset < sectionEnd) {
        const byte = wasmBuffer[nameOffset++];
        nameLen |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7;
      }
      const name = wasmBuffer.subarray(nameOffset, nameOffset + nameLen).toString('utf8');
      if (name === sectionName) {
        const payload = wasmBuffer.subarray(nameOffset + nameLen, sectionEnd);
        sections.push(Buffer.from(payload));
      }
    }

    offset = sectionEnd;
  }

  return sections;
}

class XdrReader {
  private offset = 0;
  constructor(private buffer: Buffer) {}

  get hasMore(): boolean {
    return this.offset < this.buffer.length;
  }

  readU32(): number {
    if (this.offset + 4 > this.buffer.length) return 0;
    const val = this.buffer.readUInt32BE(this.offset);
    this.offset += 4;
    return val;
  }

  readI32(): number {
    if (this.offset + 4 > this.buffer.length) return 0;
    const val = this.buffer.readInt32BE(this.offset);
    this.offset += 4;
    return val;
  }

  readString(): string {
    const len = this.readU32();
    if (len === 0) return '';
    const str = this.buffer.subarray(this.offset, this.offset + len).toString('utf8');
    const padding = (4 - (len % 4)) % 4;
    this.offset += len + padding;
    return str;
  }

  readTypeDef(): SorobanType {
    const kind = this.readU32();
    switch (kind) {
      case 0: return { kind: 'val' };
      case 1: return { kind: 'bool' };
      case 2: return { kind: 'void' };
      case 3: return { kind: 'error' };
      case 4: return { kind: 'u32' };
      case 5: return { kind: 'i32' };
      case 6: return { kind: 'u64' };
      case 7: return { kind: 'i64' };
      case 8: return { kind: 'timepoint' };
      case 9: return { kind: 'duration' };
      case 10: return { kind: 'u128' };
      case 11: return { kind: 'i128' };
      case 12: return { kind: 'u256' };
      case 13: return { kind: 'i256' };
      case 14: return { kind: 'bytes' };
      case 15: return { kind: 'string' };
      case 16: return { kind: 'symbol' };
      case 17: return { kind: 'address' };
      case 1000: { // Option
        const valueType = this.readTypeDef();
        return { kind: 'option', valueType };
      }
      case 1001: { // Result
        const okType = this.readTypeDef();
        const errorType = this.readTypeDef();
        return { kind: 'result', okType, errorType };
      }
      case 1002: { // Vec
        const elementType = this.readTypeDef();
        return { kind: 'vec', elementType };
      }
      case 1003: { // Map
        const keyType = this.readTypeDef();
        const valueType = this.readTypeDef();
        return { kind: 'map', keyType, valueType };
      }
      case 1004: { // Tuple
        const count = this.readU32();
        const elementTypes: SorobanType[] = [];
        for (let i = 0; i < count; i++) {
          elementTypes.push(this.readTypeDef());
        }
        return { kind: 'tuple', elementTypes };
      }
      case 1005: { // BytesN
        const n = this.readU32();
        return { kind: 'bytesN', n };
      }
      case 2000: { // UDT
        const name = this.readString();
        return { kind: 'udt', name };
      }
      default:
        return { kind: 'val' };
    }
  }

  readSpecEntry(): SpecEntry | null {
    if (!this.hasMore) return null;
    const kind = this.readU32();
    switch (kind) {
      case 0: { // FunctionV0
        const doc = this.readString();
        const name = this.readString();
        const inputCount = this.readU32();
        const inputs: SpecFunctionInput[] = [];
        for (let i = 0; i < inputCount; i++) {
          const inputDoc = this.readString();
          const inputName = this.readString();
          const type = this.readTypeDef();
          inputs.push({ name: inputName, doc: inputDoc || undefined, type });
        }
        const outputCount = this.readU32();
        const outputs: SorobanType[] = [];
        for (let i = 0; i < outputCount; i++) {
          outputs.push(this.readTypeDef());
        }
        return {
          kind: 'function',
          name,
          doc: doc || undefined,
          inputs,
          outputs
        };
      }
      case 1: { // StructV0
        const doc = this.readString();
        const lib = this.readString();
        const name = this.readString();
        const fieldCount = this.readU32();
        const fields: StructField[] = [];
        for (let i = 0; i < fieldCount; i++) {
          const fieldDoc = this.readString();
          const fieldName = this.readString();
          const type = this.readTypeDef();
          fields.push({ name: fieldName, doc: fieldDoc || undefined, type });
        }
        return {
          kind: 'struct',
          name,
          doc: doc || undefined,
          fields
        };
      }
      case 2: { // UnionV0
        const doc = this.readString();
        const lib = this.readString();
        const name = this.readString();
        const caseCount = this.readU32();
        const cases: UnionCase[] = [];
        for (let i = 0; i < caseCount; i++) {
          const caseDoc = this.readString();
          const caseName = this.readString();
          const hasType = this.readU32();
          const type = hasType ? this.readTypeDef() : undefined;
          cases.push({ name: caseName, doc: caseDoc || undefined, type });
        }
        return {
          kind: 'union',
          name,
          doc: doc || undefined,
          cases
        };
      }
      case 3: { // EnumV0
        const doc = this.readString();
        const lib = this.readString();
        const name = this.readString();
        const caseCount = this.readU32();
        const cases: EnumCase[] = [];
        for (let i = 0; i < caseCount; i++) {
          const caseDoc = this.readString();
          const caseName = this.readString();
          const value = this.readU32();
          cases.push({ name: caseName, value, doc: caseDoc || undefined });
        }
        return {
          kind: 'enum',
          name,
          doc: doc || undefined,
          cases
        };
      }
      default:
        return null;
    }
  }
}

export function parseWasmContractSpec(wasmBuffer: Buffer): ContractSpecResult {
  const specSections = extractWasmCustomSection(wasmBuffer, 'contractspecv0');
  const envSections = extractWasmCustomSection(wasmBuffer, 'contractenvmetav0');

  if (specSections.length === 0) {
    throw new Error('WASM binary does not contain a "contractspecv0" custom section.');
  }

  let protocolVersion: number | undefined;
  if (envSections.length > 0) {
    const reader = new XdrReader(envSections[0]);
    protocolVersion = reader.readU32();
  }

  const specEntries: SpecEntry[] = [];
  for (const sectionPayload of specSections) {
    const reader = new XdrReader(sectionPayload);
    while (reader.hasMore) {
      const entry = reader.readSpecEntry();
      if (entry) {
        specEntries.push(entry);
      }
    }
  }

  return {
    envMeta: protocolVersion !== undefined ? { protocolVersion } : undefined,
    specEntries
  };
}
