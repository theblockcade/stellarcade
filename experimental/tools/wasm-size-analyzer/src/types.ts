export interface WasmSection {
  id: number;
  name: string;
  size: number;
  startOffset: number;
}

export interface WasmAnalysisResult {
  filePath: string;
  totalSize: number;
  sections: WasmSection[];
  customSections: WasmSection[];
  dataSegmentSize: number;
  isOverSizeLimit: boolean;
  warnings: string[];
  recommendations: string[];
}

export interface AnalyzerConfig {
  wasmPath: string;
  jsonOutput: boolean;
  warnThresholdKb: number;
}
