'use client';

import React, { useState } from 'react';
import { TreeNodeItem } from './TreeNodeItem';
import type { ReferralTreeVisualizerProps } from './types';
import './ReferralTreeVisualizer.css';

export const ReferralTreeVisualizer: React.FC<ReferralTreeVisualizerProps> = ({
  treeData,
  onCopyInviteLink,
  onInspectUser,
  className = '',
  testId = 'referral-tree-visualizer',
}) => {
  const [search, setSearch] = useState('');
  const isEmpty = treeData.children.length === 0;

  return (
    <div className={`referral-tree-visualizer ${className}`} data-testid={testId}>
      <div className="referral-tree-visualizer__toolbar">
        <input
          type="search"
          className="referral-tree-visualizer__search"
          placeholder="Search by handle or address…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search referral tree"
          data-testid={`${testId}-search`}
        />
      </div>

      {isEmpty ? (
        <div className="referral-tree-visualizer__empty" data-testid={`${testId}-empty`}>
          <p className="referral-tree-visualizer__empty-title">
            Share your referral link to build your team
          </p>
          <button
            type="button"
            className="referral-tree-visualizer__copy-btn"
            onClick={onCopyInviteLink}
            data-testid={`${testId}-copy-link`}
          >
            Copy Invite Link
          </button>
        </div>
      ) : (
        <div className="referral-tree-visualizer__scroll-area">
          <ul className="referral-tree-visualizer__root" role="tree">
            <TreeNodeItem
              node={treeData}
              depth={0}
              searchQuery={search}
              onInspectUser={onInspectUser}
              testId={`${testId}-node`}
            />
          </ul>
        </div>
      )}
    </div>
  );
};

ReferralTreeVisualizer.displayName = 'ReferralTreeVisualizer';
export default ReferralTreeVisualizer;
