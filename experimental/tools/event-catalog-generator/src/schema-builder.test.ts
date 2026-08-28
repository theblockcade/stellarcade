import { describe, it, expect } from 'vitest';
import { buildMarkdownCatalog, buildJsonSchema } from './schema-builder';
import type { EventCatalog } from './types';

function catalog(overrides: Partial<EventCatalog> = {}): EventCatalog {
  return {
    contractsScanned: 1,
    events: [
      {
        topics: ['wager_placed'],
        dataFields: [
          { name: 'player', type: 'Address' },
          { name: 'amount', type: 'i128' },
        ],
        filePath: 'contracts/coinflip/src/lib.rs',
        line: 42,
        rawCall: 'env.events().publish((Symbol::new(&env, "wager_placed"), player), amount);',
      },
    ],
    ...overrides,
  };
}

describe('buildMarkdownCatalog', () => {
  it('renders a valid markdown table with a header row and separator', () => {
    const md = buildMarkdownCatalog(catalog());
    const lines = md.split('\n');
    const headerIdx = lines.findIndex((l) => l.startsWith('| Topics'));

    expect(headerIdx).toBeGreaterThan(-1);
    expect(lines[headerIdx + 1]).toMatch(/^\|---/);
  });

  it('includes topic names, payload fields, and source location per row', () => {
    const md = buildMarkdownCatalog(catalog());
    expect(md).toContain('`wager_placed`');
    expect(md).toContain('`player: Address`');
    expect(md).toContain('`amount: i128`');
    expect(md).toContain('contracts/coinflip/src/lib.rs:42');
  });

  it('shows a placeholder for events with no inferable data fields', () => {
    const md = buildMarkdownCatalog(
      catalog({
        events: [
          {
            topics: ['ping'],
            dataFields: [],
            filePath: 'lib.rs',
            line: 1,
            rawCall: '',
          },
        ],
      })
    );
    expect(md).toContain('_(none)_');
  });

  it('reports zero events distinctly from a populated catalog', () => {
    const md = buildMarkdownCatalog(catalog({ events: [] }));
    expect(md).toContain('No `env.events().publish()` calls found');
    expect(md).not.toContain('| Topics |');
  });

  it('includes the contracts-scanned count in the summary line', () => {
    const md = buildMarkdownCatalog(catalog({ contractsScanned: 5 }));
    expect(md).toContain('Scanned 5 contract file(s)');
  });
});

describe('buildJsonSchema', () => {
  it('produces valid, parseable JSON Schema with the expected top-level shape', () => {
    const schema = buildJsonSchema(catalog());
    const json = JSON.stringify(schema);
    expect(() => JSON.parse(json)).not.toThrow();

    const parsed = JSON.parse(json);
    expect(parsed.$schema).toBe('http://json-schema.org/draft-07/schema#');
    expect(parsed.type).toBe('array');
  });

  it('maps numeric Rust types to the JSON number type', () => {
    const schema = buildJsonSchema(catalog()) as any;
    expect(schema.items.properties.data.properties.amount.type).toBe('number');
  });

  it('maps Address/Symbol/String/Bytes to the JSON string type', () => {
    const schema = buildJsonSchema(catalog()) as any;
    expect(schema.items.properties.data.properties.player.type).toBe('string');
  });

  it('records one definitions.events entry per catalog event, with topics preserved', () => {
    const schema = buildJsonSchema(catalog()) as any;
    expect(schema.definitions.events).toHaveLength(1);
    expect(schema.definitions.events[0].topics).toEqual(['wager_placed']);
    expect(schema.definitions.events[0].source).toBe('contracts/coinflip/src/lib.rs:42');
  });

  it('produces an empty data-properties object and empty definitions for an empty catalog', () => {
    const schema = buildJsonSchema(catalog({ events: [] })) as any;
    expect(schema.items.properties.data.properties).toEqual({});
    expect(schema.definitions.events).toEqual([]);
  });
});
