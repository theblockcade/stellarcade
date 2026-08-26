import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { WasmAnalyzer } from './analyzer';
import type { AnalyzerConfig } from './types';

vi.mock('fs');

function createWasmBuffer(sections: Array<{ id: number; content: Buffer }>): Buffer {
  const magic = Buffer.from([0x00, 0x61, 0x73, 0x6d]);
  const version = Buffer.from([0x01, 0x00, 0x00, 0x00]);
  const parts: Buffer[] = [magic, version];

  for (const section of sections) {
    const idByte = Buffer.from([section.id]);
    const sizeBytes = encodeLEB128(section.content.length);
    parts.push(idByte);
    parts.push(sizeBytes);
    parts.push(section.content);
  }

  return Buffer.concat(parts);
}

function encodeLEB128(value: number): Buffer {
  const bytes: number[] = [];

  do {
    let byte = value & 0x7f;
    value >>= 7;
    if (value !== 0) {
      byte |= 0x80;
    }
    bytes.push(byte);
  } while (value !== 0);

  return Buffer.from(bytes);
}

function createCustomSection(name: string, content?: Buffer): { id: number; content: Buffer } {
  const nameBytes = Buffer.from(name, 'utf-8');
  const nameLenBytes = encodeLEB128(nameBytes.length);
  const sectionContent = content || Buffer.alloc(0);
  const fullContent = Buffer.concat([nameLenBytes, nameBytes, sectionContent]);

  return { id: 0, content: fullContent };
}

describe('WasmAnalyzer', () => {
  const mockFilePath = '/test/file.wasm';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyze', () => {
    it('should analyze a valid WASM file', () => {
      const sections = [
        { id: 1, content: Buffer.alloc(10) },
        { id: 10, content: Buffer.alloc(100) },
      ];
      const wasmBuffer = createWasmBuffer(sections);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(wasmBuffer);

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const result = analyzer.analyze();

      expect(result.filePath).toBe(mockFilePath);
      expect(result.totalSize).toBe(wasmBuffer.length);
      expect(result.sections.length).toBe(2);
      expect(result.isOverSizeLimit).toBe(false);
    });

    it('should throw for missing file', () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(() => analyzer.analyze()).toThrow('File not found');
    });

    it('should throw for invalid magic bytes', () => {
      const invalidBuffer = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(invalidBuffer);

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(() => analyzer.analyze()).toThrow('bad magic bytes');
    });

    it('should throw for empty buffer', () => {
      const emptyBuffer = Buffer.alloc(0);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(emptyBuffer);

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(() => analyzer.analyze()).toThrow('file is too small');
    });

    it('should throw for truncated buffer', () => {
      const truncatedBuffer = Buffer.from([0x00, 0x61, 0x73]);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(truncatedBuffer);

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(() => analyzer.analyze()).toThrow('file is too small');
    });
  });

  describe('parseSections', () => {
    it('should parse type and code sections', () => {
      const sections = [
        { id: 1, content: Buffer.alloc(10) },
        { id: 10, content: Buffer.alloc(50) },
      ];
      const wasmBuffer = createWasmBuffer(sections);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(wasmBuffer);

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const result = analyzer.parseSections(wasmBuffer);

      expect(result.length).toBe(2);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe('Type');
      expect(result[0].size).toBe(10);
      expect(result[1].id).toBe(10);
      expect(result[1].name).toBe('Code');
      expect(result[1].size).toBe(50);
    });

    it('should parse custom sections with name', () => {
      const customSection = createCustomSection('name', Buffer.alloc(20));
      const wasmBuffer = createWasmBuffer([customSection]);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(wasmBuffer);

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const result = analyzer.parseSections(wasmBuffer);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(0);
      expect(result[0].name).toBe('name');
      expect(result[0].size).toBe(25);
    });

    it('should handle unknown section IDs', () => {
      const sections = [{ id: 99, content: Buffer.alloc(5) }];
      const wasmBuffer = createWasmBuffer(sections);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      (fs.readFileSync as unknown as ReturnType<typeof vi.fn>).mockReturnValue(wasmBuffer);

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const result = analyzer.parseSections(wasmBuffer);

      expect(result.length).toBe(1);
      expect(result[0].id).toBe(99);
      expect(result[0].name).toBe('Unknown(99)');
    });
  });

  describe('getDataSegmentSize', () => {
    it('should return size of data section', () => {
      const sections = [
        { id: 11, name: 'Data', size: 500, startOffset: 100 },
      ];

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(analyzer.getDataSegmentSize(sections)).toBe(500);
    });

    it('should return 0 when no data section exists', () => {
      const sections = [
        { id: 1, name: 'Type', size: 10, startOffset: 8 },
      ];

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(analyzer.getDataSegmentSize(sections)).toBe(0);
    });
  });

  describe('checkOversized', () => {
    it('should return true when size exceeds 64KB', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(analyzer.checkOversized(70000)).toBe(true);
    });

    it('should return false when size is under 64KB', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(analyzer.checkOversized(50000)).toBe(false);
    });

    it('should return false when size equals exactly 64KB', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      expect(analyzer.checkOversized(65536)).toBe(false);
    });
  });

  describe('generateWarnings', () => {
    it('should warn about oversized binary', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const warnings = analyzer.generateWarnings([], 70000, 0);

      expect(warnings.some((w) => w.includes('exceeds recommended size'))).toBe(true);
    });

    it('should warn about large data segments', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const warnings = analyzer.generateWarnings([], 1000, 200);

      expect(warnings.some((w) => w.includes('Large data segment'))).toBe(true);
    });

    it('should warn about large custom sections', () => {
      const sections = [
        { id: 0, name: 'debug_info', size: 500, startOffset: 0 },
      ];

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const warnings = analyzer.generateWarnings(sections, 1000, 0);

      expect(warnings.some((w) => w.includes('Large custom section'))).toBe(true);
    });

    it('should not warn for small files', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const warnings = analyzer.generateWarnings([], 1000, 50);

      expect(warnings.length).toBe(0);
    });
  });

  describe('generateRecommendations', () => {
    it('should recommend opt-level for oversized binaries', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const recommendations = analyzer.generateRecommendations(70000, []);

      expect(recommendations.some((r) => r.includes('opt-level'))).toBe(true);
      expect(recommendations.some((r) => r.includes('LTO'))).toBe(true);
    });

    it('should recommend stripping debug symbols for custom sections', () => {
      const sections = [
        { id: 0, name: 'debug', size: 10, startOffset: 0 },
      ];

      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const recommendations = analyzer.generateRecommendations(1000, sections);

      expect(recommendations.some((r) => r.includes('wasm-strip'))).toBe(true);
    });

    it('should recommend wasm-opt for moderately large files', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const recommendations = analyzer.generateRecommendations(40000, []);

      expect(recommendations.some((r) => r.includes('wasm-opt'))).toBe(true);
    });

    it('should not recommend for small files', () => {
      const analyzer = new WasmAnalyzer({
        wasmPath: mockFilePath,
        jsonOutput: false,
        warnThresholdKb: 64,
      });

      const recommendations = analyzer.generateRecommendations(1000, []);

      expect(recommendations.length).toBe(0);
    });
  });
});
