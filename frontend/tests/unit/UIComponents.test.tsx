import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompareChip } from '../../src/components/v1/CompareChip';
import { Callout } from '../../src/components/v1/Callout';

describe('CompareChip', () => {
  it('renders correctly', () => {
    render(<CompareChip id="test-1" label="Test Chip" onSelect={() => {}} />);
    expect(screen.getByText('Test Chip')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<CompareChip id="test-1" label="Test Chip" onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('compare-chip'));
    expect(onSelect).toHaveBeenCalledWith('test-1', true);
  });

  it('does not call onSelect when disabled', () => {
    const onSelect = vi.fn();
    render(<CompareChip id="test-1" label="Test Chip" onSelect={onSelect} isDisabled />);
    fireEvent.click(screen.getByTestId('compare-chip'));
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('Callout', () => {
  it('renders info variant by default', () => {
    render(<Callout title="Info Title">Callout Content</Callout>);
    expect(screen.getByText('Info Title')).toBeInTheDocument();
    expect(screen.getByText('Callout Content')).toBeInTheDocument();
    const callout = screen.getByTestId('callout');
    expect(callout.getAttribute('role')).toBe('status');
    expect(callout.classList.contains('callout--info')).toBe(true);
  });

  it('renders error variant with correct role', () => {
    render(<Callout variant="error">Error Message</Callout>);
    const callout = screen.getByTestId('callout');
    expect(callout.getAttribute('role')).toBe('alert');
    expect(callout.classList.contains('callout--error')).toBe(true);
  });
});
