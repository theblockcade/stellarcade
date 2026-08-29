import type { EventCatalog, EventDefinition } from './types';

/**
 * Render a catalog as a unified Markdown document: one table listing every
 * discovered event (topics, payload fields, source location).
 */
export function buildMarkdownCatalog(catalog: EventCatalog): string {
  const lines: string[] = [
    '# Contract Event Catalog',
    '',
    `Scanned ${catalog.contractsScanned} contract file(s), found ${catalog.events.length} event(s).`,
    '',
  ];

  if (catalog.events.length === 0) {
    lines.push('_No `env.events().publish()` calls found._');
    return lines.join('\n');
  }

  lines.push('| Topics | Payload Fields | Source |', '|---|---|---|');

  for (const event of catalog.events) {
    const topicsCell = event.topics.map((t) => `\`${t}\``).join(', ');
    const fieldsCell =
      event.dataFields.length > 0
        ? event.dataFields.map((f) => `\`${f.name}: ${f.type}\``).join(', ')
        : '_(none)_';
    const sourceCell = `${event.filePath}:${event.line}`;

    lines.push(`| ${topicsCell} | ${fieldsCell} | ${sourceCell} |`);
  }

  return lines.join('\n');
}

/**
 * JSON Schema shape for one event, following the conventional
 * `{topics, data: {type: object, properties: {...}}}` layout an indexer
 * service would consume to validate decoded event payloads.
 */
export function buildJsonSchema(catalog: EventCatalog): object {
  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Contract Event Catalog',
    type: 'array',
    items: {
      type: 'object',
      required: ['topics', 'data'],
      properties: {
        topics: {
          type: 'array',
          items: { type: 'string' },
        },
        data: {
          type: 'object',
          properties: Object.fromEntries(
            catalog.events.flatMap((e) => e.dataFields.map((f) => [f.name, { type: rustTypeToJsonType(f.type) }]))
          ),
        },
        source: { type: 'string' },
      },
    },
    definitions: {
      events: catalog.events.map(eventToSchemaEntry),
    },
  };
}

function eventToSchemaEntry(event: EventDefinition) {
  return {
    topics: event.topics,
    data: {
      type: 'object',
      properties: Object.fromEntries(
        event.dataFields.map((f) => [f.name, { type: rustTypeToJsonType(f.type) }])
      ),
    },
    source: `${event.filePath}:${event.line}`,
  };
}

/** Map a Rust/Soroban type name to its closest JSON Schema primitive, defaulting to no constraint for anything unrecognized. */
function rustTypeToJsonType(rustType: string): string {
  const numeric = ['i32', 'u32', 'i64', 'u64', 'i128', 'u128'];
  if (numeric.includes(rustType)) return 'number';
  if (rustType === 'bool') return 'boolean';
  if (rustType === 'Symbol' || rustType === 'String' || rustType === 'Address' || rustType === 'Bytes') {
    return 'string';
  }
  return 'string'; // 'unknown' and anything else: no stronger constraint than "some serialized value"
}
