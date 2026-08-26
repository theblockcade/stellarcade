export interface ErrorSymbol {
  symbol: string;
  source: string;
  lineNumber: number;
  type: 'symbol' | 'enum_variant' | 'contract_error';
}

export interface SdkMapping {
  symbol: string;
  message: string;
  source: string;
  lineNumber: number;
}

export interface Discrepancy {
  symbol: string;
  status: 'missing_in_sdk' | 'missing_in_contract' | 'message_mismatch';
  contractSource?: string;
  sdkSource?: string;
  contractMessage?: string;
  sdkMessage?: string;
}

export interface ValidationResult {
  contractSymbols: ErrorSymbol[];
  sdkMappings: SdkMapping[];
  discrepancies: Discrepancy[];
  totalContractSymbols: number;
  totalSdkMappings: number;
  allMapped: boolean;
}

export interface ValidatorConfig {
  contractsDir: string;
  sdkDir: string;
  exportMarkdown?: string;
}
