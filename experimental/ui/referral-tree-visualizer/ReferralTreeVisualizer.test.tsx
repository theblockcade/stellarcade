import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ReferralTreeVisualizer } from './ReferralTreeVisualizer';
import type { ReferralNode } from './types';

const tree: ReferralNode = {
  address: 'GROOTADDRESS0000000000000000000000000000',
  username: 'you',
  isActive: true,
  totalWagers: 5000,
  rewardsEarned: 250,
  children: [
    {
      address: 'GALICE00000000000000000000000000000000000',
      username: 'alice',
      isActive: true,
      totalWagers: 2000,
      rewardsEarned: 100,
      children: [
        {
          address: 'GDIANA0000000000000000000000000000000000',
          username: 'diana',
          isActive: false,
          totalWagers: 300,
          rewardsEarned: 15,
          children: [],
        },
      ],
    },
    {
      address: 'GBOB000000000000000000000000000000000000',
      username: 'bob',
      isActive: false,
      totalWagers: 800,
      rewardsEarned: 40,
      children: [],
    },
  ],
};

describe('ReferralTreeVisualizer', () => {
  it('renders the root and direct (tier-1) invitees, collapsed by default', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    expect(screen.getByText('you')).toBeInTheDocument();
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
    // Tier-2 (diana) is not visible until alice's node is expanded.
    expect(screen.queryByText('diana')).not.toBeInTheDocument();
  });

  // ─── Tree node expansion and collapse ──────────────────────────────────────

  it('expands a tier-1 node to reveal tier-2 invitees', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    const toggle = screen.getByTestId(
      'referral-tree-visualizer-node-GALICE00000000000000000000000000000000000-toggle',
    );
    fireEvent.click(toggle);

    expect(screen.getByText('diana')).toBeInTheDocument();
  });

  it('collapses an expanded node back to hiding its children', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    const toggle = screen.getByTestId(
      'referral-tree-visualizer-node-GALICE00000000000000000000000000000000000-toggle',
    );
    fireEvent.click(toggle);
    expect(screen.getByText('diana')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText('diana')).not.toBeInTheDocument();
  });

  it('does not render a toggle for a leaf node', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    expect(
      screen.queryByTestId(
        'referral-tree-visualizer-node-GBOB000000000000000000000000000000000000-toggle',
      ),
    ).not.toBeInTheDocument();
  });

  it('sets aria-expanded to reflect toggle state', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    const toggle = screen.getByTestId(
      'referral-tree-visualizer-node-GALICE00000000000000000000000000000000000-toggle',
    );
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  // ─── Search filtering for child nodes ──────────────────────────────────────

  it('filters to only nodes matching the search query by username', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    fireEvent.change(screen.getByTestId('referral-tree-visualizer-search'), {
      target: { value: 'bob' },
    });

    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });

  it('force-expands an ancestor whose subtree contains a tier-2 match', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    fireEvent.change(screen.getByTestId('referral-tree-visualizer-search'), {
      target: { value: 'diana' },
    });

    // alice is diana's parent and must be auto-expanded to reveal diana,
    // even though alice's own toggle was never clicked.
    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('diana')).toBeInTheDocument();
    // bob's subtree has no match, so bob is filtered out entirely.
    expect(screen.queryByText('bob')).not.toBeInTheDocument();
  });

  it('matches by address as well as username', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    fireEvent.change(screen.getByTestId('referral-tree-visualizer-search'), {
      target: { value: 'GBOB' },
    });

    expect(screen.getByText('bob')).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    fireEvent.change(screen.getByTestId('referral-tree-visualizer-search'), {
      target: { value: 'ALICE' },
    });

    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  // ─── Empty referral tree presentation ──────────────────────────────────────

  it('shows the invite card when the root has no invitees', () => {
    const emptyTree: ReferralNode = {
      ...tree,
      children: [],
    };
    const onCopyInviteLink = vi.fn();
    render(<ReferralTreeVisualizer treeData={emptyTree} onCopyInviteLink={onCopyInviteLink} />);

    expect(
      screen.getByText('Share your referral link to build your team'),
    ).toBeInTheDocument();
    expect(screen.queryByText('alice')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('referral-tree-visualizer-copy-link'));
    expect(onCopyInviteLink).toHaveBeenCalledTimes(1);
  });

  // ─── Node summary chips and status indicators ──────────────────────────────

  it('shows wager and reward summary chips for each node', () => {
    render(<ReferralTreeVisualizer treeData={tree} onCopyInviteLink={vi.fn()} />);

    expect(
      screen.getByTestId(
        'referral-tree-visualizer-node-GALICE00000000000000000000000000000000000-wagers',
      ),
    ).toHaveTextContent('2,000 wagered');
  });

  it('calls onInspectUser with the node address when the identity is clicked', () => {
    const onInspectUser = vi.fn();
    render(
      <ReferralTreeVisualizer
        treeData={tree}
        onCopyInviteLink={vi.fn()}
        onInspectUser={onInspectUser}
      />,
    );

    fireEvent.click(
      screen.getByTestId(
        'referral-tree-visualizer-node-GBOB000000000000000000000000000000000000-inspect',
      ),
    );
    expect(onInspectUser).toHaveBeenCalledWith('GBOB000000000000000000000000000000000000');
  });
});
