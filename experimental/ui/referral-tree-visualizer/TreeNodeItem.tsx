'use client';

import React, { useMemo, useState } from 'react';
import type { TreeNodeItemProps } from './types';

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function truncateAddress(address: string): string {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** True if this node or any descendant matches the (already-normalized,
 * lowercased) search query by username or address substring. */
function subtreeMatches(node: TreeNodeItemProps['node'], query: string): boolean {
  if (!query) {
    return true;
  }
  if (
    node.username.toLowerCase().includes(query) ||
    node.address.toLowerCase().includes(query)
  ) {
    return true;
  }
  return node.children.some((child) => subtreeMatches(child, query));
}

export const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  depth,
  searchQuery,
  onInspectUser,
  testId = 'referral-tree-node',
}) => {
  const [expanded, setExpanded] = useState(depth === 0);

  const query = searchQuery.trim().toLowerCase();
  const selfMatches = !query || node.username.toLowerCase().includes(query) || node.address.toLowerCase().includes(query);
  const visibleChildren = useMemo(
    () => node.children.filter((child) => subtreeMatches(child, query)),
    [node.children, query],
  );

  // While a search is active, force-expand any node whose subtree contains
  // a match, so the matching descendant is actually visible rather than
  // hidden behind a collapsed ancestor.
  const isExpanded = query ? visibleChildren.length > 0 || expanded : expanded;

  if (query && !selfMatches && visibleChildren.length === 0) {
    return null;
  }

  const hasChildren = node.children.length > 0;

  return (
    <li className="referral-tree-node" data-testid={`${testId}-${node.address}`}>
      <div
        className={`referral-tree-node__row ${selfMatches && query ? 'referral-tree-node__row--matched' : ''}`}
      >
        {hasChildren ? (
          <button
            type="button"
            className="referral-tree-node__toggle"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            aria-label={isExpanded ? `Collapse ${node.username}` : `Expand ${node.username}`}
            data-testid={`${testId}-${node.address}-toggle`}
          >
            <span
              className={`referral-tree-node__chevron ${
                isExpanded ? 'referral-tree-node__chevron--open' : ''
              }`}
              aria-hidden="true"
            >
              ▶
            </span>
          </button>
        ) : (
          <span className="referral-tree-node__toggle-spacer" aria-hidden="true" />
        )}

        <span
          className={`referral-tree-node__status-dot referral-tree-node__status-dot--${
            node.isActive ? 'active' : 'inactive'
          }`}
          title={node.isActive ? 'Active in the last 30 days' : 'Inactive'}
          aria-hidden="true"
        />

        <button
          type="button"
          className="referral-tree-node__identity"
          onClick={() => onInspectUser?.(node.address)}
          data-testid={`${testId}-${node.address}-inspect`}
        >
          <span className="referral-tree-node__username">{node.username}</span>
          <span className="referral-tree-node__address" title={node.address}>
            {truncateAddress(node.address)}
          </span>
        </button>

        <span className="referral-tree-node__chip" data-testid={`${testId}-${node.address}-wagers`}>
          {formatAmount(node.totalWagers)} wagered
        </span>
        <span className="referral-tree-node__chip referral-tree-node__chip--reward">
          +{formatAmount(node.rewardsEarned)} earned
        </span>
      </div>

      {hasChildren && isExpanded && (
        <ul className="referral-tree-node__children">
          {visibleChildren.map((child) => (
            <TreeNodeItem
              key={child.address}
              node={child}
              depth={depth + 1}
              searchQuery={searchQuery}
              onInspectUser={onInspectUser}
              testId={testId}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

TreeNodeItem.displayName = 'TreeNodeItem';
export default TreeNodeItem;
