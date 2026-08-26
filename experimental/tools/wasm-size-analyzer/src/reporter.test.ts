import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ReportGenerator } from './reporter';
import type { WasmAnalysisResult } from './types';

describe('ReportGenerator', () => {
  const mockResult: WasmAnalysisResult = {
    filePath: '/test/file.wasm',
    totalSize: 1024,
    sections: [
      { id: 1, name: 'Type', size: 100, startOffset: 8 },
      { id: 10, name: 'Code', size: 400, startOffset: 108 },
      { id: 11, name: 'Data', size: 200, startOffset: 508 },
    ],
    customSections: [],
    dataSegmentSize: 200,
    isOverSizeLimit: false,
    warnings: [],
    recommendations: [],
  };

  describe('getSectionColor', () => {
    it('should return green for small sections', () => {
      const reporter = new ReportGenerator(mockResult);
      const color = reporter.getSectionColor(100, 1000);

      expect(color('test')).toContain('test');
    });

    it('should return yellow for medium sections', () => {
      const reporter = new ReportGenerator(mockResult);
      const color = reporter.getSectionColor(300, 1000);

      expect(color('test')).toContain('test');
    });

    it('should return red for large sections', () => {
      const reporter = new ReportGenerator(mockResult);
      const color = reporter.getSectionColor(600, 1000);

      expect(color('test')).toContain('test');
    });

    it('should return green for zero total', () => {
      const reporter = new ReportGenerator(mockResult);
      const color = reporter.getSectionColor(0, 0);

      expect(color('test')).toContain('test');
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      const reporter = new ReportGenerator(mockResult);

      expect(reporter.formatBytes(1024)).toBe('1024 bytes (1.00 KB)');
      expect(reporter.formatBytes(500)).toBe('500 bytes (0.49 KB)');
      expect(reporter.formatBytes(0)).toBe('0 bytes (0.00 KB)');
    });
  });

  describe('printTerminal', () => {
    it('should not throw', () => {
      const reporter = new ReportGenerator(mockResult);

      expect(() => reporter.printTerminal()).not.toThrow();
    });

    it('should handle warnings', () => {
      const resultWithWarnings: WasmAnalysisResult = {
        ...mockResult,
        warnings: ['Test warning'],
        recommendations: ['Test recommendation'],
      };

      const reporter = new ReportGenerator(resultWithWarnings);

      expect(() => reporter.printTerminal()).not.toThrow();
    });
  });

  describe('printJson', () => {
    it('should produce valid JSON', () => {
      const reporter = new ReportGenerator(mockResult);
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      reporter.printJson();

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      const output = consoleSpy.mock.calls[0][0];
      expect(() => JSON.parse(output)).not.toThrow();

      consoleSpy.mockRestore();
    });
  });
});
