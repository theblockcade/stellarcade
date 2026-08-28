import type { StorageDurability, StorageEntry, TreeNode } from './types';

const DURABILITY_LABELS: Record<StorageDurability, string> = {
  instance: 'Instance',
  persistent: 'Persistent',
  temporary: 'Temporary',
};

const DURABILITY_ORDER: StorageDurability[] = ['instance', 'persistent', 'temporary'];

/**
 * Group a flat list of decoded storage entries into a three-branch tree —
 * one root child per durability class present, each containing a leaf per
 * entry. Empty durability classes are omitted entirely rather than shown
 * as empty branches, so a contract using only `persistent` storage doesn't
 * clutter the tree with two empty `Instance`/`Temporary` nodes.
 */
export function buildStorageTree(entries: StorageEntry[], contractId: string): TreeNode {
  const totalSize = entries.reduce((sum, e) => sum + e.sizeBytes, 0);

  const children: TreeNode[] = DURABILITY_ORDER.filter((d) =>
    entries.some((e) => e.durability === d)
  ).map((durability) => {
    const bucketEntries = entries.filter((e) => e.durability === durability);
    const bucketSize = bucketEntries.reduce((sum, e) => sum + e.sizeBytes, 0);
    return {
      label: `${DURABILITY_LABELS[durability]} (${bucketEntries.length})`,
      sizeBytes: bucketSize,
      children: bucketEntries.map(entryToLeaf),
    };
  });

  return {
    label: contractId,
    sizeBytes: totalSize,
    children,
  };
}

function entryToLeaf(entry: StorageEntry): TreeNode {
  return {
    label: `${entry.decodedKey}`,
    sizeBytes: entry.sizeBytes,
    children: [],
    entry,
  };
}

/**
 * Render a {@link TreeNode} as a Unicode box-drawing tree (falls back to
 * ASCII connectors when `ascii` is set), truncated to `maxDepth` levels
 * below the root. A node at exactly `maxDepth` whose children are hidden is
 * marked with a `…` continuation marker so truncation is visible rather
 * than silently indistinguishable from a genuine leaf.
 */
export function renderTree(root: TreeNode, maxDepth = Infinity, ascii = false): string {
  const branch = ascii ? '+-- ' : '├── ';
  const lastBranch = ascii ? '`-- ' : '└── ';
  const pipe = ascii ? '|   ' : '│   ';
  const gap = '    ';

  const lines: string[] = [`${root.label} (${formatBytes(root.sizeBytes)})`];

  function walk(node: TreeNode, prefix: string, depth: number) {
    const visibleChildren = depth < maxDepth ? node.children : [];
    const truncated = depth >= maxDepth && node.children.length > 0;

    node.children.forEach((child, i) => {
      if (depth >= maxDepth) return;
      const isLast = i === node.children.length - 1;
      const connector = isLast ? lastBranch : branch;
      lines.push(`${prefix}${connector}${child.label} (${formatBytes(child.sizeBytes)})`);
      walk(child, prefix + (isLast ? gap : pipe), depth + 1);
    });

    if (truncated) {
      lines.push(`${prefix}${lastBranch}… (${node.children.length} more, use --expand-depth to show)`);
    }
    void visibleChildren;
  }

  walk(root, '', 0);
  return lines.join('\n');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}
