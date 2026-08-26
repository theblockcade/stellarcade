import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransactionStepperModal, getStellarExpertUrl } from './TransactionStepperModal';
import { TxStep } from './types';

describe('TransactionStepperModal', () => {
  const sampleSteps: TxStep[] = [
    { id: 'step-1', label: 'Approve Token', description: 'Authorizing token allowance', status: 'complete', txHash: '0x123abc' },
    { id: 'step-2', label: 'Deposit', description: 'Depositing funds to pool', status: 'active' },
  ];

  it('renders correctly when open and advances step status', () => {
    render(
      <TransactionStepperModal
        isOpen={true}
        steps={sampleSteps}
        currentStepIndex={1}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId('stepper-modal')).toBeDefined();
    expect(screen.getByText('Step 2 of 2: Depositing funds to pool')).toBeDefined();
    expect(screen.getByTestId('spinner')).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <TransactionStepperModal
        isOpen={false}
        steps={sampleSteps}
        currentStepIndex={0}
        onRetry={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders error panel and triggers retry callback on failure', () => {
    const failedSteps: TxStep[] = [
      { id: 'step-1', label: 'Approve Token', description: 'Authorizing token allowance', status: 'complete' },
      { id: 'step-2', label: 'Deposit', description: 'Depositing funds', status: 'failed', errorMessage: 'Signature rejected' },
    ];
    const onRetryMock = vi.fn();

    render(
      <TransactionStepperModal
        isOpen={true}
        steps={failedSteps}
        currentStepIndex={1}
        onRetry={onRetryMock}
        onCancel={vi.fn()}
      />
    );

    expect(screen.getByTestId('error-panel')).toBeDefined();
    expect(screen.getByText('Signature rejected')).toBeDefined();

    const retryBtn = screen.getByTestId('retry-button');
    fireEvent.click(retryBtn);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('triggers cancel callback on cancel button click', () => {
    const onCancelMock = vi.fn();

    render(
      <TransactionStepperModal
        isOpen={true}
        steps={sampleSteps}
        currentStepIndex={0}
        onRetry={vi.fn()}
        onCancel={onCancelMock}
      />
    );

    const cancelBtn = screen.getByTestId('cancel-button');
    fireEvent.click(cancelBtn);
    expect(onCancelMock).toHaveBeenCalledTimes(1);
  });

  it('generates Stellar Expert URLs correctly', () => {
    expect(getStellarExpertUrl('0x123', 'public')).toBe('https://stellar.expert/explorer/public/tx/0x123');
    expect(getStellarExpertUrl('0x456', 'testnet')).toBe('https://stellar.expert/explorer/testnet/tx/0x456');
  });
});
