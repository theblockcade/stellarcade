import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FilterPillStrip, type FilterPillOption } from '../../../src/components/v1/FilterPillStrip';

describe('FilterPillStrip', () => {
  const mockOptions: FilterPillOption[] = [
    { id: 'opt-1', label: 'Stellar Wallet', count: 12 },
    { id: 'opt-2', label: 'Active Contracts', count: 5 },
    { id: 'opt-3', label: 'Soroban Only' },
    { id: 'opt-4', label: 'Disabled Filter', disabled: true },
  ];

  const defaultProps = {
    options: mockOptions,
    selectedIds: ['opt-1'],
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all options and active selection states', () => {
    render(<FilterPillStrip {...defaultProps} />);

    expect(screen.getByText('Stellar Wallet')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // Count for opt-1
    expect(screen.getByText('Active Contracts')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument(); // Count for opt-2
    expect(screen.getByText('Soroban Only')).toBeInTheDocument();

    const opt1Pill = screen.getByTestId('filter-pill-strip-pill-opt-1');
    expect(opt1Pill).toHaveClass('filter-pill-strip__pill--selected');
    expect(opt1Pill).toHaveAttribute('aria-pressed', 'true');

    const opt2Pill = screen.getByTestId('filter-pill-strip-pill-opt-2');
    expect(opt2Pill).not.toHaveClass('filter-pill-strip__pill--selected');
    expect(opt2Pill).toHaveAttribute('aria-pressed', 'false');
  });

  it('supports multi-select: toggling selections in selectedIds array', () => {
    const { rerender } = render(<FilterPillStrip {...defaultProps} selectedIds={['opt-1']} />);
    const opt2Pill = screen.getByTestId('filter-pill-strip-pill-opt-2');

    // Select second option
    fireEvent.click(opt2Pill);
    expect(defaultProps.onChange).toHaveBeenCalledWith(['opt-1', 'opt-2']);

    // Deselect first option
    rerender(<FilterPillStrip {...defaultProps} selectedIds={['opt-1']} />);
    const opt1Pill = screen.getByTestId('filter-pill-strip-pill-opt-1');
    fireEvent.click(opt1Pill);
    expect(defaultProps.onChange).toHaveBeenCalledWith([]);
  });

  it('supports single-select mode', () => {
    render(<FilterPillStrip {...defaultProps} allowMultiple={false} selectedIds={['opt-1']} />);
    const opt2Pill = screen.getByTestId('filter-pill-strip-pill-opt-2');

    fireEvent.click(opt2Pill);
    expect(defaultProps.onChange).toHaveBeenCalledWith(['opt-2']);
  });

  it('disables options marked disabled', () => {
    render(<FilterPillStrip {...defaultProps} />);
    const disabledPill = screen.getByTestId('filter-pill-strip-pill-opt-4');

    expect(disabledPill).toBeDisabled();
    fireEvent.click(disabledPill);
    expect(defaultProps.onChange).not.toHaveBeenCalled();
  });

  it('renders and triggers Clear All button when selectedIds has items', () => {
    const { rerender } = render(<FilterPillStrip {...defaultProps} selectedIds={[]} />);
    
    // Clear btn should not exist when selectedIds is empty
    expect(screen.queryByTestId('filter-pill-strip-clear-btn')).toBeNull();

    // Rerender with items
    rerender(<FilterPillStrip {...defaultProps} selectedIds={['opt-1']} />);
    const clearBtn = screen.getByTestId('filter-pill-strip-clear-btn');
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(defaultProps.onChange).toHaveBeenCalledWith([]);
  });
});
