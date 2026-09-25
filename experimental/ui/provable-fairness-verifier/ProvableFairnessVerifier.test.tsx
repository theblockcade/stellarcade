import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import {
  ProvableFairnessVerifier,
  sha256Hex,
  computeOutcome,
  verifySeed,
} from './ProvableFairnessVerifier';

afterEach(cleanup);

describe('ProvableFairnessVerifier', () => {
  const revealedSeed = 'server-secret-seed-42';
  const commitment = sha256Hex(revealedSeed);

  it('computes status as Verified when revealed seed matches the commitment', () => {
    render(
      <ProvableFairnessVerifier
        initialServerSeedHash={commitment}
        initialRevealedSeed={revealedSeed}
      />,
    );

    const pill = screen.getByTestId('provable-fairness-verifier-status');
    expect(pill).toHaveTextContent('Verified');
    expect(pill).toHaveClass(
      'provable-fairness-verifier__status-pill--verified',
    );
  });

  it('invokes onVerify with a verified summary', async () => {
    const onVerify = vi.fn();
    render(
      <ProvableFairnessVerifier
        initialServerSeedHash={commitment}
        initialRevealedSeed={revealedSeed}
        onVerify={onVerify}
      />,
    );

    await waitFor(() => expect(onVerify).toHaveBeenCalled());
    const last = onVerify.mock.calls[onVerify.mock.calls.length - 1][0];
    expect(last.status).toBe('verified');
    expect(last.computedHash).toBe(commitment);
  });

  it('computes status as Mismatch when revealed seed does not match the commitment', () => {
    render(
      <ProvableFairnessVerifier
        initialServerSeedHash={commitment}
        initialRevealedSeed="tampered-seed"
      />,
    );

    const pill = screen.getByTestId('provable-fairness-verifier-status');
    expect(pill).toHaveTextContent('Mismatch');
    expect(pill).toHaveClass(
      'provable-fairness-verifier__status-pill--mismatch',
    );
  });

  it('updates verification output dynamically when input fields change', () => {
    render(<ProvableFairnessVerifier initialServerSeedHash={commitment} />);

    const pill = screen.getByTestId('provable-fairness-verifier-status');
    expect(pill).toHaveTextContent('Pending');

    fireEvent.change(screen.getByLabelText('Revealed Server Seed'), {
      target: { value: revealedSeed },
    });

    expect(pill).toHaveTextContent('Verified');

    fireEvent.change(screen.getByLabelText('Revealed Server Seed'), {
      target: { value: 'wrong-seed' },
    });
    expect(pill).toHaveTextContent('Mismatch');
  });

  it('renders Pending status when no commitment or seed is provided', () => {
    render(<ProvableFairnessVerifier />);

    const pill = screen.getByTestId('provable-fairness-verifier-status');
    expect(pill).toHaveTextContent('Pending');
    expect(pill).toHaveClass(
      'provable-fairness-verifier__status-pill--pending',
    );
  });

  it('computes a dice roll outcome from revealed seed, client seed and nonce', () => {
    render(
      <ProvableFairnessVerifier
        initialRevealedSeed={revealedSeed}
        initialClientSeed="player-seed-7"
        initialNonce={3}
      />,
    );

    const expected = computeOutcome(revealedSeed, 'player-seed-7', 3);
    expect(expected).not.toBeNull();

    const outcome = screen.getByTestId('provable-fairness-verifier-outcome');
    expect(outcome).toHaveTextContent(String(expected!.roll));
    expect(outcome).toHaveTextContent(expected!.coin);
  });

  it('copies a verification summary to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      configurable: true,
      writable: true,
    });

    render(
      <ProvableFairnessVerifier
        initialServerSeedHash={commitment}
        initialRevealedSeed={revealedSeed}
      />,
    );

    fireEvent.click(screen.getByTestId('provable-fairness-verifier-copy'));

    await waitFor(() =>
      expect(screen.getByTestId('provable-fairness-verifier-copy')).toHaveTextContent(
        'Copied!',
      ),
    );
    expect(writeText).toHaveBeenCalledTimes(1);
    const proof = writeText.mock.calls[0][0] as string;
    expect(proof).toContain(commitment);
    expect(proof).toContain(revealedSeed);
    expect(proof).toContain('Status: Verified');
  });

  it('uses visible labels and an aria-live status region', () => {
    render(<ProvableFairnessVerifier />);

    expect(screen.getByLabelText('Server Seed Hash (Commitment)')).toBeInTheDocument();
    expect(screen.getByLabelText('Revealed Server Seed')).toBeInTheDocument();
    expect(screen.getByLabelText('Client Seed')).toBeInTheDocument();
    expect(screen.getByLabelText('Nonce')).toBeInTheDocument();

    const statusRegion = screen
      .getByTestId('provable-fairness-verifier-status')
      .closest('[role="status"]') as HTMLElement;
    expect(statusRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('verifySeed marks empty inputs as pending', () => {
    expect(verifySeed('', '')).toBe('pending');
    expect(verifySeed(commitment, '')).toBe('pending');
    expect(verifySeed('', revealedSeed)).toBe('pending');
  });
});