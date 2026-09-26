/** A single node in a Soroban simulated authorization call tree. */
export interface AuthInvocation {
  contract: string;
  functionName: string;
  args?: unknown[];
  subInvocations?: AuthInvocation[];
}

/** Mirrors the shape of a SorobanAuthorizationEntry from a simulateTransaction result. */
export interface AuthEntry {
  /** Address that signed this authorization, or 'sourceAccount' for the tx source. */
  authorizer: string;
  rootInvocation: AuthInvocation;
}

export interface CrossContractCall {
  depth: number;
  fromContract: string;
  toContract: string;
  functionName: string;
}

export interface PrivilegeEscalationRisk {
  depth: number;
  contract: string;
  functionName: string;
  reason: string;
}

export interface AuthDiagnostics {
  entryCount: number;
  maxDepth: number;
  crossContractCalls: CrossContractCall[];
  nonRootAuthorizations: string[];
  privilegeEscalationRisks: PrivilegeEscalationRisk[];
}
