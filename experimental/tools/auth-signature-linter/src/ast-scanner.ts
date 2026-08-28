import type { FunctionInfo } from './types';

// Matches a `pub fn name(...)` signature, capturing the name and the full
// parameter list up to its closing paren. Deliberately tolerant of
// multi-line signatures (`s` flag) and generic parameters/lifetimes on the
// function name.
const FN_SIGNATURE_RE = /pub\s+fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<[^>]*>)?\s*\(([^)]*)\)/gs;

/**
 * Scan Rust source for every `pub fn` and extract its name, `Address`-typed
 * parameters, and full body (matched via brace-depth counting rather than a
 * regex, since Rust bodies nest arbitrarily deep and contain braces inside
 * strings/comments that a naive regex would miscount).
 *
 * This is a lightweight lexical scanner, not a real Rust parser — see the
 * README's scope note for what it deliberately does not attempt to handle
 * (macros that generate `pub fn`, `Address` behind a type alias, etc.).
 */
export function scanFunctions(source: string, filePath: string): FunctionInfo[] {
  const functions: FunctionInfo[] = [];
  const lines = source.split('\n');
  // Precompute cumulative character offsets per line for line-number lookup.
  const lineStarts: number[] = [0];
  for (const line of lines) {
    lineStarts.push(lineStarts[lineStarts.length - 1] + line.length + 1);
  }
  const lineForOffset = (offset: number): number => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= offset) lo = mid;
      else hi = mid - 1;
    }
    return lo + 1;
  };

  FN_SIGNATURE_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = FN_SIGNATURE_RE.exec(source)) !== null) {
    const [full, name, paramList] = match;
    const sigStart = match.index;
    const bodyOpenBrace = source.indexOf('{', sigStart + full.length - 1);
    if (bodyOpenBrace === -1) continue; // trait method declaration with no body, or malformed — skip

    // Skip past anything between the signature and `{` that isn't a brace
    // (e.g. a `where` clause or `-> ReturnType`) by starting the depth scan
    // exactly at the found `{`.
    let depth = 0;
    let bodyEnd = -1;
    for (let i = bodyOpenBrace; i < source.length; i++) {
      if (source[i] === '{') depth++;
      else if (source[i] === '}') {
        depth--;
        if (depth === 0) {
          bodyEnd = i;
          break;
        }
      }
    }
    if (bodyEnd === -1) continue; // unbalanced braces — malformed source, skip rather than crash

    const body = source.slice(bodyOpenBrace + 1, bodyEnd);
    const addressParams = extractAddressParams(paramList);

    functions.push({
      name,
      filePath,
      line: lineForOffset(sigStart),
      addressParams,
      body,
      bodyStartLine: lineForOffset(bodyOpenBrace),
    });
  }

  return functions;
}

/** Extract parameter names declared with a bare `Address` type. */
function extractAddressParams(paramList: string): string[] {
  const params = splitParams(paramList);
  const addressParams: string[] = [];

  for (const param of params) {
    const trimmed = param.trim();
    // Matches `name: Address` or `mut name: Address`, ignoring `&Address`
    // references (Soroban host functions take Address by value, so a `&Address`
    // parameter is not the standard "caller identity" shape this linter targets).
    const m = trimmed.match(/^(?:mut\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*Address\s*$/);
    if (m) addressParams.push(m[1]);
  }

  return addressParams;
}

/** Split a parameter list on top-level commas, respecting nested `<>`/`()` so generic types aren't split mid-way. */
function splitParams(paramList: string): string[] {
  const params: string[] = [];
  let depth = 0;
  let current = '';

  for (const ch of paramList) {
    if (ch === '<' || ch === '(') depth++;
    else if (ch === '>' || ch === ')') depth--;

    if (ch === ',' && depth === 0) {
      params.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0) params.push(current);

  return params;
}
