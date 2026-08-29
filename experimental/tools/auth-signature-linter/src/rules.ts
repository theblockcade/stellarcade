import type { FunctionInfo, Violation } from './types';

// Any of these calls mutate contract storage, which is why this linter
// treats a function containing one as "state-mutating" and in scope for the
// auth check — a pure read-only accessor (only `.get()`/`.has()`) is not.
const STORAGE_WRITE_PATTERNS = [
  /\.storage\(\)\s*\.\s*(?:instance|persistent|temporary)\(\)\s*\.\s*set\s*\(/,
  /\.storage\(\)\s*\.\s*(?:instance|persistent|temporary)\(\)\s*\.\s*remove\s*\(/,
  /\.storage\(\)\s*\.\s*(?:instance|persistent|temporary)\(\)\s*\.\s*update\s*\(/,
  /\.storage\(\)\s*\.\s*(?:instance|persistent|temporary)\(\)\s*\.\s*extend_ttl\s*\(/,
];

/**
 * Whether `body` writes to contract storage anywhere (regardless of which
 * address, if any, that write is keyed by) — the signal this linter uses to
 * decide a function is "state-mutating" and therefore must authorize its
 * caller.
 */
export function isStateMutating(body: string): boolean {
  return STORAGE_WRITE_PATTERNS.some((re) => re.test(body));
}

/** Whether `body` calls `.require_auth()` (or `.require_auth_for_args()`) on `paramName`. */
export function hasRequireAuthCall(body: string, paramName: string): boolean {
  const escaped = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}\\s*\\.\\s*require_auth(?:_for_args)?\\s*\\(`);
  return re.test(body);
}

/**
 * Apply the auth-signature rule to one scanned function: if it mutates
 * state and declares at least one `Address` parameter, every such
 * parameter must have a matching `require_auth()` call somewhere in the
 * body. Functions with no `Address` parameter at all are out of scope —
 * this linter checks that a *declared* caller identity is authorized, not
 * that mutation is gated some other way (e.g. an admin-only invariant with
 * no per-call Address, which is a separate concern).
 */
export function checkFunction(fn: FunctionInfo): Violation[] {
  if (fn.addressParams.length === 0) return [];
  if (!isStateMutating(fn.body)) return [];

  const violations: Violation[] = [];
  for (const param of fn.addressParams) {
    if (!hasRequireAuthCall(fn.body, param)) {
      violations.push({
        filePath: fn.filePath,
        functionName: fn.name,
        line: fn.line,
        severity: 'error',
        message: `Function '${fn.name}' mutates storage but never calls '${param}.require_auth()'`,
        remediation: `Add '${param}.require_auth();' before the storage mutation, or confirm '${param}' is not meant to represent the authorizing caller.`,
      });
    }
  }
  return violations;
}

export function checkAll(functions: FunctionInfo[]): Violation[] {
  return functions.flatMap(checkFunction);
}
