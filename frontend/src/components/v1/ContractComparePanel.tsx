import React from 'react';
import './ContractComparePanel.css';

export interface ContractMetric {
  label: string;
  value: number | string;
  unit?: string;
}

export interface ContractMetricSnapshot {
  contractId: string;
  label: string;
  metrics: ContractMetric[];
}

export interface ContractComparePanelProps {
  left: ContractMetricSnapshot | null;
  right: ContractMetricSnapshot | null;
  testId?: string;
}

type DiffDirection = 'left' | 'right' | 'equal' | 'na';

function diffDirection(a: number | string, b: number | string): DiffDirection {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isFinite(na) || !Number.isFinite(nb)) return 'na';
  if (na > nb) return 'left';
  if (nb > na) return 'right';
  return 'equal';
}

function DiffBadge({ direction, side }: { direction: DiffDirection; side: 'left' | 'right' }) {
  if (direction === 'na' || direction === 'equal') return null;
  const isWinner = direction === side;
  return (
    <span
      className={`compare-panel__badge compare-panel__badge--${isWinner ? 'winner' : 'loser'}`}
      aria-label={isWinner ? 'higher' : 'lower'}
    >
      {isWinner ? '▲' : '▼'}
    </span>
  );
}

export const ContractComparePanel: React.FC<ContractComparePanelProps> = ({
  left,
  right,
  testId = 'contract-compare-panel',
}) => {
  if (!left && !right) {
    return (
      <div className="compare-panel compare-panel--empty" data-testid={`${testId}-empty`}>
        <p>Select two contracts to compare.</p>
      </div>
    );
  }

  const allLabels = Array.from(
    new Set([
      ...(left?.metrics.map((m) => m.label) ?? []),
      ...(right?.metrics.map((m) => m.label) ?? []),
    ])
  );

  return (
    <div className="compare-panel" data-testid={testId}>
      {/* Header row */}
      <div className="compare-panel__header" data-testid={`${testId}-header`}>
        <div className="compare-panel__header-cell compare-panel__header-cell--label" />
        <div className="compare-panel__header-cell" data-testid={`${testId}-left-label`}>
          {left ? left.label : <span className="compare-panel__placeholder">—</span>}
        </div>
        <div className="compare-panel__header-cell" data-testid={`${testId}-right-label`}>
          {right ? right.label : <span className="compare-panel__placeholder">—</span>}
        </div>
      </div>

      {/* Metric rows */}
      {allLabels.map((label) => {
        const leftMetric = left?.metrics.find((m) => m.label === label);
        const rightMetric = right?.metrics.find((m) => m.label === label);
        const dir = leftMetric && rightMetric
          ? diffDirection(leftMetric.value, rightMetric.value)
          : 'na';

        return (
          <div
            key={label}
            className="compare-panel__row"
            data-testid={`${testId}-row-${label.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <div className="compare-panel__cell compare-panel__cell--label">{label}</div>
            <div className="compare-panel__cell">
              {leftMetric ? (
                <>
                  <span data-testid={`${testId}-left-value-${label.replace(/\s+/g, '-').toLowerCase()}`}>
                    {leftMetric.value}{leftMetric.unit ? ` ${leftMetric.unit}` : ''}
                  </span>
                  <DiffBadge direction={dir} side="left" />
                </>
              ) : <span className="compare-panel__placeholder">—</span>}
            </div>
            <div className="compare-panel__cell">
              {rightMetric ? (
                <>
                  <span data-testid={`${testId}-right-value-${label.replace(/\s+/g, '-').toLowerCase()}`}>
                    {rightMetric.value}{rightMetric.unit ? ` ${rightMetric.unit}` : ''}
                  </span>
                  <DiffBadge direction={dir} side="right" />
                </>
              ) : <span className="compare-panel__placeholder">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ContractComparePanel;
