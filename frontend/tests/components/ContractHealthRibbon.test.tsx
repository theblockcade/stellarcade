/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import { ContractHealthRibbon } from '@/components/v1/ContractHealthRibbon';

describe('ContractHealthRibbon', () => {
  // ── Primary success path ──────────────────────────────────────────────────

  describe('healthy state (full variant)', () => {
    it('renders contract id label', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="healthy" />);
      expect(screen.getByTestId('contract-health-ribbon-label')).toHaveTextContent('prize-pool');
    });

    it('renders a Healthy status pill', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="healthy" />);
      expect(screen.getByTestId('contract-health-ribbon-pill')).toHaveTextContent('Healthy');
    });

    it('renders latency badge when latencyMs is provided', () => {
      render(
        <ContractHealthRibbon contractId="prize-pool" status="healthy" latencyMs={42} />,
      );
      expect(screen.getByTestId('contract-health-ribbon-latency')).toHaveTextContent('42ms');
    });

    it('formats latency >= 1000ms as seconds', () => {
      render(
        <ContractHealthRibbon contractId="prize-pool" status="healthy" latencyMs={1500} />,
      );
      expect(screen.getByTestId('contract-health-ribbon-latency')).toHaveTextContent('1.5s');
    });

    it('applies chr--healthy class', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="healthy" />);
      expect(screen.getByTestId('contract-health-ribbon')).toHaveClass('chr--healthy');
    });
  });

  // ── Degraded state ────────────────────────────────────────────────────────

  describe('degraded state', () => {
    it('renders a Degraded status pill', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="degraded" />);
      expect(screen.getByTestId('contract-health-ribbon-pill')).toHaveTextContent('Degraded');
    });

    it('applies chr--degraded class', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="degraded" />);
      expect(screen.getByTestId('contract-health-ribbon')).toHaveClass('chr--degraded');
    });
  });

  // ── Error state ───────────────────────────────────────────────────────────

  describe('error state', () => {
    it('renders an Error status pill', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="error" />);
      expect(screen.getByTestId('contract-health-ribbon-pill')).toHaveTextContent('Error');
    });

    it('renders error message when provided', () => {
      render(
        <ContractHealthRibbon
          contractId="prize-pool"
          status="error"
          errorMessage="RPC timeout"
        />,
      );
      expect(screen.getByTestId('contract-health-ribbon-error-msg')).toHaveTextContent(
        'RPC timeout',
      );
    });

    it('does not render latency badge in error state', () => {
      render(
        <ContractHealthRibbon contractId="prize-pool" status="error" latencyMs={999} />,
      );
      expect(screen.queryByTestId('contract-health-ribbon-latency')).not.toBeInTheDocument();
    });
  });

  // ── Loading state ─────────────────────────────────────────────────────────

  describe('loading state', () => {
    it('renders a Checking status pill', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="loading" />);
      expect(screen.getByTestId('contract-health-ribbon-pill')).toHaveTextContent('Checking');
    });

    it('does not render latency badge while loading', () => {
      render(
        <ContractHealthRibbon contractId="prize-pool" status="loading" latencyMs={10} />,
      );
      expect(screen.queryByTestId('contract-health-ribbon-latency')).not.toBeInTheDocument();
    });
  });

  // ── Unknown / not-configured state ───────────────────────────────────────

  describe('unknown state', () => {
    it('renders an Unknown status pill', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="unknown" />);
      expect(screen.getByTestId('contract-health-ribbon-pill')).toHaveTextContent('Unknown');
    });
  });

  // ── Compact variant ───────────────────────────────────────────────────────

  describe('compact variant', () => {
    it('does not render the label in compact mode', () => {
      render(
        <ContractHealthRibbon contractId="prize-pool" status="healthy" variant="compact" />,
      );
      expect(screen.queryByTestId('contract-health-ribbon-label')).not.toBeInTheDocument();
    });

    it('still renders the status pill in compact mode', () => {
      render(
        <ContractHealthRibbon contractId="prize-pool" status="degraded" variant="compact" />,
      );
      expect(screen.getByTestId('contract-health-ribbon-pill')).toBeInTheDocument();
    });

    it('applies chr--compact class', () => {
      render(
        <ContractHealthRibbon contractId="prize-pool" status="healthy" variant="compact" />,
      );
      expect(screen.getByTestId('contract-health-ribbon')).toHaveClass('chr--compact');
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe('accessibility', () => {
    it('has role="status" on the container', () => {
      render(<ContractHealthRibbon contractId="prize-pool" status="healthy" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('generates a descriptive aria-label', () => {
      render(
        <ContractHealthRibbon contractId="prize-pool" status="healthy" latencyMs={55} />,
      );
      const el = screen.getByTestId('contract-health-ribbon');
      expect(el).toHaveAttribute(
        'aria-label',
        'prize-pool contract health: Healthy, latency 55ms',
      );
    });

    it('accepts a custom ariaLabel override', () => {
      render(
        <ContractHealthRibbon
          contractId="prize-pool"
          status="healthy"
          ariaLabel="Custom label"
        />,
      );
      expect(screen.getByTestId('contract-health-ribbon')).toHaveAttribute(
        'aria-label',
        'Custom label',
      );
    });

    it('error message has role="alert"', () => {
      render(
        <ContractHealthRibbon
          contractId="prize-pool"
          status="error"
          errorMessage="Node unreachable"
        />,
      );
      expect(screen.getByRole('alert')).toHaveTextContent('Node unreachable');
    });
  });

  // ── Custom testId and className ───────────────────────────────────────────

  it('forwards custom testId', () => {
    render(<ContractHealthRibbon contractId="x" status="healthy" testId="my-ribbon" />);
    expect(screen.getByTestId('my-ribbon')).toBeInTheDocument();
  });

  it('forwards custom className', () => {
    render(
      <ContractHealthRibbon contractId="x" status="healthy" className="extra-class" />,
    );
    expect(screen.getByTestId('contract-health-ribbon')).toHaveClass('extra-class');
  });
});
