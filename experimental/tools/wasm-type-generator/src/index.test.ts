import { describe, it, expect } from 'vitest';
import {
  parseWasmContractSpec,
  extractWasmCustomSection,
  ContractSpecResult
} from './wasm-parser';
import {
  generateTypeScriptDefinitions,
  sorobanTypeToTs
} from './ts-emitter';

function createMockWasmBuffer(specEntriesPayload?: Buffer): Buffer {
  const magicAndVersion = Buffer.from([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]);
  if (!specEntriesPayload) {
    return magicAndVersion;
  }

  // Custom section header for "contractspecv0"
  const name = 'contractspecv0';
  const nameBuffer = Buffer.from(name, 'utf8');
  const sectionContent = Buffer.concat([
    Buffer.from([nameBuffer.length]),
    nameBuffer,
    specEntriesPayload
  ]);

  const sectionSize = sectionContent.length;
  const header = Buffer.from([0x00, sectionSize]); // sectionId=0
  return Buffer.concat([magicAndVersion, header, sectionContent]);
}

function encodeXdrString(str: string): Buffer {
  const buf = Buffer.from(str, 'utf8');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(buf.length, 0);
  const padding = (4 - (buf.length % 4)) % 4;
  const padBuf = Buffer.alloc(padding);
  return Buffer.concat([lenBuf, buf, padBuf]);
}

describe('wasm-type-generator', () => {
  it('sorobanTypeToTs maps primitives correctly', () => {
    expect(sorobanTypeToTs({ kind: 'bool' })).toBe('boolean');
    expect(sorobanTypeToTs({ kind: 'u32' })).toBe('number');
    expect(sorobanTypeToTs({ kind: 'u64' })).toBe('bigint');
    expect(sorobanTypeToTs({ kind: 'string' })).toBe('string');
    expect(sorobanTypeToTs({ kind: 'address' })).toBe('string');
    expect(sorobanTypeToTs({ kind: 'bytes' })).toBe('Uint8Array');
    expect(sorobanTypeToTs({ kind: 'option', valueType: { kind: 'u32' } })).toBe('number | null');
    expect(sorobanTypeToTs({ kind: 'vec', elementType: { kind: 'string' } })).toBe('Array<string>');
  });

  it('throws error when contractspecv0 section is missing', () => {
    const emptyWasm = createMockWasmBuffer();
    expect(() => parseWasmContractSpec(emptyWasm)).toThrow(
      'WASM binary does not contain a "contractspecv0" custom section.'
    );
  });

  it('generates TypeScript definitions from mock spec result', () => {
    const mockSpec: ContractSpecResult = {
      envMeta: { protocolVersion: 20 },
      specEntries: [
        {
          kind: 'enum',
          name: 'GameStatus',
          doc: 'Status of game',
          cases: [
            { name: 'Pending', value: 0 },
            { name: 'Completed', value: 1 }
          ]
        },
        {
          kind: 'struct',
          name: 'PlayerStats',
          doc: 'Player score info',
          fields: [
            { name: 'score', type: { kind: 'u64' } },
            { name: 'player', type: { kind: 'address' } }
          ]
        },
        {
          kind: 'function',
          name: 'play_game',
          doc: 'Initiates game play',
          inputs: [
            { name: 'amount', type: { kind: 'u64' } },
            { name: 'choice', type: { kind: 'u32' } }
          ],
          outputs: [{ kind: 'bool' }]
        }
      ]
    };

    const tsOutput = generateTypeScriptDefinitions(mockSpec);

    expect(tsOutput).toContain('export enum GameStatus {');
    expect(tsOutput).toContain('Pending = 0,');
    expect(tsOutput).toContain('export interface PlayerStats {');
    expect(tsOutput).toContain('score: bigint;');
    expect(tsOutput).toContain('player: string;');
    expect(tsOutput).toContain('export interface SorobanContractClient {');
    expect(tsOutput).toContain('play_game(amount: bigint, choice: number): Promise<boolean>;');
  });

  it('extracts custom sections from WASM binary', () => {
    const mockPayload = Buffer.from([0x00, 0x00, 0x00, 0x01]);
    const wasmBuf = createMockWasmBuffer(mockPayload);
    const customSecs = extractWasmCustomSection(wasmBuf, 'contractspecv0');
    expect(customSecs.length).toBe(1);
    expect(customSecs[0]).toEqual(mockPayload);
  });
});
