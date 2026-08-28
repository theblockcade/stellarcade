import { describe, it, expect } from 'vitest';
import { buildStorageTree, renderTree } from './tree-builder';
import type { StorageEntry } from './types';

function entry(overrides: Partial<StorageEntry> = {}): StorageEntry {
  return {
    durability: 'persistent',
    decodedKey: 'Symbol(Balance)',
    keyType: 'Symbol',
    sizeBytes: 64,
    ...overrides,
  };
}

describe('buildStorageTree', () => {
  it('groups entries under one branch per durability class present', () => {
    const entries: StorageEntry[] = [
      entry({ durability: 'instance', decodedKey: 'Symbol(Admin)', sizeBytes: 40 }),
      entry({ durability: 'persistent', decodedKey: 'Map{owner: Address(GABC)}', sizeBytes: 80 }),
      entry({ durability: 'persistent', decodedKey: 'Symbol(Total)', sizeBytes: 32 }),
    ];

    const tree = buildStorageTree(entries, 'CABC123');

    expect(tree.label).toBe('CABC123');
    expect(tree.sizeBytes).toBe(152);
    expect(tree.children.map((c) => c.label)).toEqual(['Instance (1)', 'Persistent (2)']);
    expect(tree.children[1].sizeBytes).toBe(112);
    expect(tree.children[1].children).toHaveLength(2);
  });

  it('omits durability branches with no entries', () => {
    const entries: StorageEntry[] = [entry({ durability: 'temporary' })];
    const tree = buildStorageTree(entries, 'CABC123');

    expect(tree.children).toHaveLength(1);
    expect(tree.children[0].label).toBe('Temporary (1)');
  });

  it('produces a root with zero children for an empty entry list', () => {
    const tree = buildStorageTree([], 'CABC123');
    expect(tree.children).toHaveLength(0);
    expect(tree.sizeBytes).toBe(0);
  });

  it('preserves durability ordering: instance, persistent, temporary', () => {
    const entries: StorageEntry[] = [
      entry({ durability: 'temporary' }),
      entry({ durability: 'instance' }),
      entry({ durability: 'persistent' }),
    ];
    const tree = buildStorageTree(entries, 'CABC123');
    expect(tree.children.map((c) => c.label.split(' ')[0])).toEqual([
      'Instance',
      'Persistent',
      'Temporary',
    ]);
  });

  it('attaches the source entry back-reference to each leaf', () => {
    const e = entry({ decodedKey: 'Symbol(Config)' });
    const tree = buildStorageTree([e], 'CABC123');
    const leaf = tree.children[0].children[0];
    expect(leaf.entry).toBe(e);
    expect(leaf.label).toBe('Symbol(Config)');
  });
});

describe('renderTree', () => {
  it('renders a Unicode tree with byte sizes at every level', () => {
    const entries: StorageEntry[] = [entry({ durability: 'instance', decodedKey: 'Symbol(Admin)', sizeBytes: 40 })];
    const tree = buildStorageTree(entries, 'CABC123');
    const output = renderTree(tree);

    expect(output).toContain('CABC123 (40 B)');
    expect(output).toContain('└── Instance (1) (40 B)');
    expect(output).toContain('Symbol(Admin) (40 B)');
  });

  it('formats sizes over 1024 bytes in KB', () => {
    const entries: StorageEntry[] = [entry({ sizeBytes: 2048 })];
    const tree = buildStorageTree(entries, 'CABC123');
    expect(renderTree(tree)).toContain('(2.00 KB)');
  });

  it('uses ASCII connectors when ascii mode is requested', () => {
    const entries: StorageEntry[] = [entry(), entry({ decodedKey: 'Symbol(Other)' })];
    const tree = buildStorageTree(entries, 'CABC123');
    const output = renderTree(tree, Infinity, true);
    // Two siblings under one bucket: the first uses the non-last connector,
    // the second (and the bucket itself, as the tree's only branch) the
    // last-branch connector — so both ASCII forms should appear, and no
    // Unicode box-drawing character should leak in.
    expect(output).toContain('+--');
    expect(output).toContain('`--');
    expect(output).not.toContain('└──');
    expect(output).not.toContain('├──');
  });

  it('truncates below maxDepth and marks the truncation point', () => {
    const entries: StorageEntry[] = [entry(), entry({ decodedKey: 'Symbol(Other)' })];
    const tree = buildStorageTree(entries, 'CABC123');
    // depth 0 = root, depth 1 = durability bucket; cap at 1 so leaves are hidden.
    const output = renderTree(tree, 1);

    expect(output).toContain('Persistent (2)');
    expect(output).not.toContain('Symbol(Balance)');
    expect(output).toContain('more, use --expand-depth to show');
  });

  it('renders a lone root line for an empty tree', () => {
    const tree = buildStorageTree([], 'CABC123');
    expect(renderTree(tree)).toBe('CABC123 (0 B)');
  });
});
