import type { RustFunction, RustArg, RustType, RustTypeKind } from './types.js';

/** Classify a raw Rust type string into a RustType object. */
export function classifyRustType(raw: string): RustType {
  const trimmed = raw.trim();
  let kind: RustTypeKind;

  if (trimmed === 'String' || trimmed === '&str' || trimmed === '&' + "'static str") {
    kind = 'string';
  } else if (trimmed === 'bool') {
    kind = 'boolean';
  } else if (trimmed === 'Address') {
    kind = 'address';
  } else if (trimmed === 'Bytes' || trimmed === 'BytesN<32>' || trimmed.startsWith('BytesN')) {
    kind = 'bytes';
  } else if (trimmed.startsWith('Option')) {
    kind = 'option';
  } else if (trimmed.startsWith('Vec')) {
    kind = 'vec';
  } else if (trimmed.startsWith('Map') || trimmed.startsWith('HashMap')) {
    kind = 'map';
  } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    kind = 'tuple';
  } else if (/^[A-Z][a-zA-Z0-9]*$/.test(trimmed)) {
    kind = 'struct';
  } else if (/^u\d+$/.test(trimmed) || /^i\d+$/.test(trimmed) || trimmed === 'u128' || trimmed === 'i128') {
    kind = 'number';
  } else if (/^[a-z][a-z_]*$/.test(trimmed)) {
    kind = 'number';
  } else {
    kind = 'unknown';
  }

  return { raw: trimmed, kind };
}

/** Build a RustType from a raw string. */
function makeType(raw: string): RustType {
  return classifyRustType(raw);
}

/**
 * Parse Rust function signatures from a lib.rs source string.
 *
 * Handles:
 * - `pub fn name(arg: Type) -> ReturnType`
 * - `pub fn name(arg: Type, arg2: Type2) -> ReturnType`
 * - `pub fn name(arg: Type)  (no return type -> unit)`
 * - Doc comments (`/// ...`) immediately before the function
 * - Generic type parameters are stripped (e.g. `Map<Address, i128>` → `Map`)
 * - `env: &Env` first parameters are skipped
 */
export function parseRustFunctions(source: string): RustFunction[] {
  const lines = source.split('\n');
  const functions: RustFunction[] = [];
  let pendingDoc: string | undefined;

  const fnRegex = /^\s*pub\s+fn\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^\{]+))?\s*\{/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Accumulate doc comments
    const docMatch = line.match(/^\s*\/\/\/\s*(.*)/);
    if (docMatch) {
      pendingDoc = pendingDoc ? `${pendingDoc}\n${docMatch[1]}` : docMatch[1];
      continue;
    }

    const fnMatch = line.match(fnRegex);
    if (!fnMatch) {
      // Non-doc, non-fn line resets pending doc
      if (!line.trim().startsWith('#[') && !line.trim().startsWith('//')) {
        pendingDoc = undefined;
      }
      continue;
    }

    const name = fnMatch[1];
    const argsRaw = fnMatch[2].trim();
    const returnTypeRaw = fnMatch[3]?.trim();

    // Parse arguments, skipping `env: &Env`
    const args: RustArg[] = [];
    if (argsRaw) {
      const argParts = splitArgs(argsRaw);
      for (const part of argParts) {
        const colonIdx = part.indexOf(':');
        if (colonIdx === -1) continue;

        const argName = part.slice(0, colonIdx).trim();
        const argType = part.slice(colonIdx + 1).trim();

        if (argName === 'env' && argType.includes('Env')) continue;

        args.push({ name: argName, ty: makeType(argType) });
      }
    }

    const returnType = returnTypeRaw ? makeType(returnTypeRaw) : makeType('()');

    functions.push({
      name,
      args,
      returnType,
      docComment: pendingDoc,
    });

    pendingDoc = undefined;
  }

  return functions;
}

/**
 * Split a Rust argument list string by commas, respecting nested generics
 * like `Map<Address, i128>`.
 */
function splitArgs(argsRaw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const ch of argsRaw) {
    if (ch === '<' || ch === '(') depth++;
    if (ch === '>' || ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);

  return parts;
}

/**
 * Generate a default mock return value based on a RustType.
 */
export function defaultReturnValue(ty: RustType): unknown {
  switch (ty.kind) {
    case 'string':
      return 'mock-value';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'address':
      return 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
    case 'bytes':
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
    case 'option':
      return null;
    case 'vec':
      return [];
    case 'map':
      return {};
    case 'tuple':
      return [];
    default:
      return null;
  }
}
