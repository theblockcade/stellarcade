import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AccessibleDropdown, type DropdownOption } from '../../../src/components/v1/AccessibleDropdown';

describe('AccessibleDropdown', () => {
  const mockOptions: DropdownOption[] = [
    { value: 'all', label: 'All Items', count: 125 },
    { value: 'contracts', label: 'Contracts', count: 32 },
    { value: 'wallets', label: 'Wallets', disabled: true },
    { value: 'transactions', label: 'Transactions', count: 88 },
  ];

  const defaultProps = {
    options: mockOptions,
    selectedValue: 'all',
    onChange: vi.fn(),
    placeholder: 'Filter by type',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders trigger button and placeholder when selectedValue is undefined', () => {
    render(<AccessibleDropdown {...defaultProps} selectedValue={undefined} />);
    expect(screen.getByText('Filter by type')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('renders selected option value on load', () => {
    render(<AccessibleDropdown {...defaultProps} />);
    expect(screen.getByText('All Items')).toBeInTheDocument();
  });

  it('toggles listbox on trigger click', () => {
    render(<AccessibleDropdown {...defaultProps} />);
    const trigger = screen.getByTestId('accessible-dropdown-trigger');

    // Closed initially
    expect(screen.queryByRole('listbox')).toBeNull();

    // Click to open
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    // Click to close
    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('selects option on click', () => {
    render(<AccessibleDropdown {...defaultProps} />);
    const trigger = screen.getByTestId('accessible-dropdown-trigger');
    
    fireEvent.click(trigger);
    const contractsOpt = screen.getByTestId('accessible-dropdown-option-contracts');
    fireEvent.click(contractsOpt);

    expect(defaultProps.onChange).toHaveBeenCalledWith('contracts');
    expect(screen.queryByRole('listbox')).toBeNull(); // closes after selection
  });

  it('does not select disabled options', () => {
    render(<AccessibleDropdown {...defaultProps} />);
    const trigger = screen.getByTestId('accessible-dropdown-trigger');
    
    fireEvent.click(trigger);
    const disabledOpt = screen.getByTestId('accessible-dropdown-option-wallets');
    fireEvent.click(disabledOpt);

    expect(defaultProps.onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument(); // remains open
  });

  it('handles Escape key to close dropdown', () => {
    render(<AccessibleDropdown {...defaultProps} />);
    const trigger = screen.getByTestId('accessible-dropdown-trigger');

    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('supports navigation using ArrowDown, ArrowUp, and Enter key', () => {
    render(<AccessibleDropdown {...defaultProps} selectedValue="all" />);
    const trigger = screen.getByTestId('accessible-dropdown-trigger');

    // Press ArrowDown to open
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    
    // Press ArrowDown again to move to idx 1 (contracts)
    fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
    
    const contractsOpt = screen.getByTestId('accessible-dropdown-option-contracts');
    expect(contractsOpt).toHaveClass('accessible-dropdown__option--highlighted');

    // Press Enter to select highlighted
    fireEvent.keyDown(trigger, { key: 'Enter', code: 'Enter' });
    expect(defaultProps.onChange).toHaveBeenCalledWith('contracts');
  });
});
