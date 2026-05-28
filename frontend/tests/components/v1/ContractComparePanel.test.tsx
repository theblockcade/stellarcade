import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContractComparePanel, ContractMetricSnapshot } from '@/components/v1/ContractComparePanel';

const leftSnapshot: ContractMetricSnapshot = {
  contractId: 'contract-a',
  label: 'Contract A',
  metrics: [
    { label: 'Total Volume', value: 1000, unit: 'USDC' },
    { label: 'Active Users', value: 50 },
    { label: 'Fee Rate', value: 'dynamic' },
  ],
};

const rightSnapshot: ContractMetricSnapshot = {
  contractId: 'contract-b',
  label: 'Contract B',
  metrics: [
    { label: 'Total Volume', value: 800, unit: 'USDC' },
    { label: 'Active Users', value: 75 },
    { label: 'Fee Rate', value: 'fixed' },
  ],
};

describe('ContractComparePanel', () => {
  it('shows empty state when both sides are null', () => {
    render(<ContractComparePanel left={null} right={null} />);
    expect(screen.getByTestId('contract-compare-panel-empty')).toBeTruthy();
    expect(screen.getByText('Select two contracts to compare.')).toBeTruthy();
  });

  it('renders left and right contract labels in the header', () => {
    render(<ContractComparePanel left={leftSnapshot} right={rightSnapshot} />);
    expect(screen.getByTestId('contract-compare-panel-left-label').textContent).toBe('Contract A');
    expect(screen.getByTestId('contract-compare-panel-right-label').textContent).toBe('Contract B');
  });

  it('renders metric rows with correct values', () => {
    render(<ContractComparePanel left={leftSnapshot} right={rightSnapshot} />);
    const leftVolume = screen.getByTestId('contract-compare-panel-left-value-total-volume');
    expect(leftVolume.textContent).toBe('1000 USDC');

    const rightVolume = screen.getByTestId('contract-compare-panel-right-value-total-volume');
    expect(rightVolume.textContent).toBe('800 USDC');
  });

  it('shows winner badge (▲) for the higher numeric value', () => {
    render(<ContractComparePanel left={leftSnapshot} right={rightSnapshot} />);
    // Total Volume: left=1000 > right=800, so left is winner
    const volumeRow = screen.getByTestId('contract-compare-panel-row-total-volume');
    const badges = volumeRow.querySelectorAll('[aria-label="higher"]');
    expect(badges.length).toBe(1);
    expect(badges[0].textContent).toBe('▲');
    // Winner badge should be on the left cell (first badge in row)
    expect(badges[0].closest('.compare-panel__cell')).toBeTruthy();
  });

  it('shows loser badge (▼) for the lower numeric value', () => {
    render(<ContractComparePanel left={leftSnapshot} right={rightSnapshot} />);
    // Total Volume: right=800 < left=1000, so right is loser
    const volumeRow = screen.getByTestId('contract-compare-panel-row-total-volume');
    const loserBadges = volumeRow.querySelectorAll('[aria-label="lower"]');
    expect(loserBadges.length).toBe(1);
    expect(loserBadges[0].textContent).toBe('▼');
  });

  it('shows placeholder when one side is missing a metric', () => {
    const leftWithExtra: ContractMetricSnapshot = {
      ...leftSnapshot,
      metrics: [
        ...leftSnapshot.metrics,
        { label: 'Unique Metric', value: 42 },
      ],
    };
    render(<ContractComparePanel left={leftWithExtra} right={rightSnapshot} />);
    const uniqueRow = screen.getByTestId('contract-compare-panel-row-unique-metric');
    // Right side should show placeholder since it lacks this metric
    const cells = uniqueRow.querySelectorAll('.compare-panel__cell');
    const rightCell = cells[2];
    expect(rightCell.querySelector('.compare-panel__placeholder')).toBeTruthy();
  });

  it('does not render diff badges for non-numeric values', () => {
    render(<ContractComparePanel left={leftSnapshot} right={rightSnapshot} />);
    // Fee Rate has non-numeric string values
    const feeRow = screen.getByTestId('contract-compare-panel-row-fee-rate');
    const badges = feeRow.querySelectorAll('.compare-panel__badge');
    expect(badges.length).toBe(0);
  });
});
