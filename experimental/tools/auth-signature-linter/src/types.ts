export interface FunctionInfo {
  name: string;
  filePath: string;
  /** 1-indexed line the `pub fn` signature starts on. */
  line: number;
  /** Parameter names typed as `Address` (bare or under a wrapping type is not detected — see README scope note). */
  addressParams: string[];
  body: string;
  /** Line number the function body starts on (the line of its opening `{`). */
  bodyStartLine: number;
}

export type ViolationSeverity = 'error';

export interface Violation {
  filePath: string;
  functionName: string;
  line: number;
  severity: ViolationSeverity;
  message: string;
  remediation: string;
}

export interface LintResult {
  filesScanned: number;
  functionsScanned: number;
  violations: Violation[];
}

export interface LinterConfig {
  contractsDir: string;
  failOnWarning: boolean;
}
