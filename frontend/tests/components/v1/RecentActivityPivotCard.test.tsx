import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RecentActivityPivotCard } from '../../../src/components/v1/RecentActivityPivotCard';

const auditItems = [
  { id: 'a1', label: 'Contract deployed', summary: 'v1.2.3 deployed to testnet' },
];
const walletItems = [
  { id: 'w1', label: 'Transfer', summary: '100 XLM sent', timestampLabel: '2m ago', tone: 'success' as const },
];

describe('RecentActivityPivotCard', () => {
  it('renders audit items when activeView is audit', () => {
    render(
      <RecentActivityPivotCard
        activeView="audit"
        onViewChange={() => {}}
        auditItems={auditItems}
        walletItems={walletItems}
      />
    );
    expect(screen.getByText('Contract deployed')).toBeTruthy();
    expect(screen.queryByText('Transfer')).toBeNull();
  });

  it('switches to wallet items on tab click', () => {
    const onChange = vi.fn();
    render(
      <RecentActivityPivotCard
        activeView="audit"
        onViewChange={onChange}
        auditItems={auditItems}
        walletItems={walletItems}
      />
    );
    fireEvent.click(screen.getByTestId('recent-activity-pivot-card-tab-wallet'));
    expect(onChange).toHaveBeenCalledWith('wallet');
  });

  it('shows empty message when list is empty', () => {
    render(
      <RecentActivityPivotCard
        activeView="wallet"
        onViewChange={() => {}}
        auditItems={[]}
        walletItems={[]}
        emptyMessage="Nothing here yet."
      />
    );
    expect(screen.getByText('Nothing here yet.')).toBeTruthy();
  });

  it('active tab has aria-selected=true', () => {
    render(
      <RecentActivityPivotCard
        activeView="audit"
        onViewChange={() => {}}
        auditItems={[]}
        walletItems={[]}
      />
    );
    expect(screen.getByTestId('recent-activity-pivot-card-tab-audit').getAttribute('aria-selected')).toBe('true');
    expect(screen.getByTestId('recent-activity-pivot-card-tab-wallet').getAttribute('aria-selected')).toBe('false');
  });
});
