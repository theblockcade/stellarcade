import type {
  AuthDiagnostics,
  AuthEntry,
  AuthInvocation,
  CrossContractCall,
  PrivilegeEscalationRisk,
} from '../types';

/** Parses raw simulation JSON into a typed list of authorization entries. */
export function parseAuthEntries(raw: unknown): AuthEntry[] {
  const entries = Array.isArray(raw) ? raw : (raw as { authEntries?: unknown[] })?.authEntries;
  if (!Array.isArray(entries)) {
    throw new Error('Expected an array of authorization entries, or an object with an authEntries array');
  }

  return entries.map((entry, i) => {
    const e = entry as Partial<AuthEntry>;
    if (!e.rootInvocation || typeof e.rootInvocation !== 'object') {
      throw new Error(`Entry ${i}: missing rootInvocation`);
    }
    if (!e.rootInvocation.contract || !e.rootInvocation.functionName) {
      throw new Error(`Entry ${i}: rootInvocation missing contract/functionName`);
    }
    return {
      authorizer: e.authorizer ?? 'sourceAccount',
      rootInvocation: normalizeInvocation(e.rootInvocation),
    };
  });
}

function normalizeInvocation(inv: AuthInvocation): AuthInvocation {
  return {
    contract: inv.contract,
    functionName: inv.functionName,
    args: inv.args ?? [],
    subInvocations: (inv.subInvocations ?? []).map(normalizeInvocation),
  };
}

/** Depth of the deepest invocation in the tree (root = depth 0). */
export function maxTreeDepth(invocation: AuthInvocation): number {
  if (!invocation.subInvocations || invocation.subInvocations.length === 0) return 0;
  return 1 + Math.max(...invocation.subInvocations.map(maxTreeDepth));
}

/** Walks the tree collecting every parent -> child invocation that crosses a contract boundary. */
export function findCrossContractCalls(
  invocation: AuthInvocation,
  depth = 0,
  parentContract: string | null = null
): CrossContractCall[] {
  const calls: CrossContractCall[] = [];

  if (parentContract && parentContract !== invocation.contract) {
    calls.push({
      depth,
      fromContract: parentContract,
      toContract: invocation.contract,
      functionName: invocation.functionName,
    });
  }

  for (const sub of invocation.subInvocations ?? []) {
    calls.push(...findCrossContractCalls(sub, depth + 1, invocation.contract));
  }

  return calls;
}

/**
 * Flags cross-contract calls that occur two or more hops away from the root
 * invocation — a single signature at the root is authorizing an authorization
 * footprint the signer may not have directly reviewed.
 */
export function findPrivilegeEscalationRisks(root: AuthInvocation): PrivilegeEscalationRisk[] {
  const crossContractCalls = findCrossContractCalls(root);
  return crossContractCalls
    .filter((call) => call.depth >= 2)
    .map((call) => ({
      depth: call.depth,
      contract: call.toContract,
      functionName: call.functionName,
      reason: `Cross-contract call at depth ${call.depth} (${call.fromContract} -> ${call.toContract}) is not directly visible to the authorizer`,
    }));
}

/** Full diagnostic pass over a set of parsed authorization entries. */
export function analyzeAuthEntries(entries: AuthEntry[]): AuthDiagnostics {
  const crossContractCalls: CrossContractCall[] = [];
  const privilegeEscalationRisks: PrivilegeEscalationRisk[] = [];
  const nonRootAuthorizations: string[] = [];
  let maxDepth = 0;

  for (const entry of entries) {
    const depth = maxTreeDepth(entry.rootInvocation);
    maxDepth = Math.max(maxDepth, depth);
    crossContractCalls.push(...findCrossContractCalls(entry.rootInvocation));
    privilegeEscalationRisks.push(...findPrivilegeEscalationRisks(entry.rootInvocation));

    if (entry.authorizer !== 'sourceAccount') {
      nonRootAuthorizations.push(entry.authorizer);
    }
  }

  return {
    entryCount: entries.length,
    maxDepth,
    crossContractCalls,
    nonRootAuthorizations,
    privilegeEscalationRisks,
  };
}

const BRANCH = '├── '; // ├──
const LAST_BRANCH = '└── '; // └──
const PIPE = '│   '; // │
const SPACE = '    ';

function renderInvocation(
  invocation: AuthInvocation,
  prefix: string,
  connector: string,
  childPrefix: string
): string[] {
  const label = `${invocation.contract}.${invocation.functionName}()`;
  const lines = [`${prefix}${connector}${label}`];

  const children = invocation.subInvocations ?? [];
  children.forEach((child, i) => {
    const isLast = i === children.length - 1;
    lines.push(
      ...renderInvocation(
        child,
        childPrefix,
        isLast ? LAST_BRANCH : BRANCH,
        childPrefix + (isLast ? SPACE : PIPE)
      )
    );
  });

  return lines;
}

/** Renders an authorization entry as a terminal tree, e.g. contractA.fn() -> contractB.fn(). */
export function renderAuthTree(entry: AuthEntry): string {
  const header = `Authorizer: ${entry.authorizer}`;
  const tree = renderInvocation(entry.rootInvocation, '', '', '').join('\n');
  return `${header}\n${tree}`;
}

export function formatDiagnostics(diagnostics: AuthDiagnostics): string {
  const lines: string[] = [];
  lines.push(`Entries analyzed: ${diagnostics.entryCount}`);
  lines.push(`Max invocation depth: ${diagnostics.maxDepth}`);
  lines.push(`Cross-contract calls: ${diagnostics.crossContractCalls.length}`);
  for (const call of diagnostics.crossContractCalls) {
    lines.push(`  [depth ${call.depth}] ${call.fromContract} -> ${call.toContract}.${call.functionName}()`);
  }
  lines.push(`Non-root authorizations: ${diagnostics.nonRootAuthorizations.length}`);
  if (diagnostics.privilegeEscalationRisks.length > 0) {
    lines.push(`WARNING: ${diagnostics.privilegeEscalationRisks.length} potential privilege escalation risk(s):`);
    for (const risk of diagnostics.privilegeEscalationRisks) {
      lines.push(`  - ${risk.reason}`);
    }
  } else {
    lines.push('OK: no privilege escalation risks detected');
  }
  return lines.join('\n');
}
