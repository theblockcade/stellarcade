import type { DataField, EventDefinition } from './types';

const PUBLISH_CALL_START_RE = /\.events\(\)\s*\.\s*publish\s*\(/g;

/**
 * Scan Rust source for every `env.events().publish((topics...), data)` call
 * site and extract its topic Symbols and a best-effort guess at the data
 * payload's field names/types.
 *
 * Like the auth-signature-linter, this is a lexical scanner rather than a
 * full parser — it locates the call via its literal `.events().publish(`
 * text, then walks paren depth to find the matching close, so nested
 * parens/tuples inside the call don't truncate the match early.
 */
export function parseEvents(source: string, filePath: string): EventDefinition[] {
  const events: EventDefinition[] = [];
  const lines = source.split('\n');
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

  PUBLISH_CALL_START_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PUBLISH_CALL_START_RE.exec(source)) !== null) {
    const openParenIdx = match.index + match[0].length - 1;
    const closeParenIdx = findMatchingParen(source, openParenIdx);
    if (closeParenIdx === -1) continue; // unbalanced parens — malformed source, skip

    const argsText = source.slice(openParenIdx + 1, closeParenIdx);
    const [topicsArg, dataArg] = splitTopLevelArgs(argsText, 2);
    if (topicsArg === undefined) continue; // no arguments at all — not a valid publish call

    const topics = extractTopics(topicsArg);
    const dataFields = dataArg !== undefined ? extractDataFields(dataArg) : [];

    events.push({
      topics,
      dataFields,
      filePath,
      line: lineForOffset(match.index),
      rawCall: source.slice(match.index, closeParenIdx + 1),
    });
  }

  return events;
}

/** Find the index of the `)` matching the `(` at `openIdx`, respecting nesting. */
function findMatchingParen(source: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < source.length; i++) {
    if (source[i] === '(') depth++;
    else if (source[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Split a top-level comma-separated argument list, respecting nested (), [], {}. */
function splitTopLevelArgs(text: string, maxArgs: number): string[] {
  const args: string[] = [];
  let depth = 0;
  let current = '';

  for (const ch of text) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;

    if (ch === ',' && depth === 0 && args.length < maxArgs - 1) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim().length > 0 || args.length > 0) args.push(current.trim());

  return args;
}

/**
 * Extract topic names from the first `.publish()` argument — typically a
 * tuple like `(Symbol::new(&env, "wager_placed"), player_address)`.
 * `Symbol::new(&env, "...")` and `symbol_short!("...")` topics resolve to
 * their literal string; any other topic expression (e.g. a variable) is
 * kept as its raw source text so the catalog still documents its presence.
 */
function extractTopics(topicsArg: string): string[] {
  const inner = stripOuterParens(topicsArg);
  // A single-element Rust tuple requires a trailing comma (`(x,)`), which
  // would otherwise split into a spurious empty trailing part.
  const parts = splitTopLevelArgs(inner, Infinity).filter((p) => p.length > 0);

  return parts.map((part) => {
    const symbolNew = part.match(/Symbol::new\s*\(\s*&?\w+\s*,\s*"([^"]+)"\s*\)/);
    if (symbolNew) return symbolNew[1];

    const symbolShort = part.match(/symbol_short!\s*\(\s*"([^"]+)"\s*\)/);
    if (symbolShort) return symbolShort[1];

    return part;
  });
}

/**
 * Best-effort field extraction from the `data` argument. Recognizes two
 * common shapes: a tuple of bare identifiers (`(player, amount)` — names
 * only, type `unknown`) and a struct-literal-like `field: value` list
 * (`(SomeStruct { player, amount })` isn't handled structurally, but a
 * plain tuple of typed expressions like `(player as Address, amount: i128)`
 * is not standard Rust either — so this focuses on the one shape that is
 * standard: a positional tuple, reported as unnamed/typed-if-inferable
 * fields).
 */
function extractDataFields(dataArg: string): DataField[] {
  const inner = stripOuterParens(dataArg.trim());
  if (inner.length === 0) return [];

  const parts = splitTopLevelArgs(inner, Infinity).filter((p) => p.length > 0);

  return parts.map((part, i) => {
    // A cast expression like `amount as i128` lets us report a type; a bare
    // identifier like `player` gives us a name but no statically-known type.
    const asCast = part.match(/^(\w+)\s+as\s+([\w:<>]+)$/);
    if (asCast) return { name: asCast[1], type: asCast[2] };

    const bareIdent = part.match(/^&?(\w+)(?:\.clone\(\))?$/);
    if (bareIdent) return { name: bareIdent[1], type: 'unknown' };

    return { name: `field_${i}`, type: 'unknown' };
  });
}

function stripOuterParens(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
