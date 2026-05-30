import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MultiStepTransactionExample from '../../src/pages/MultiStepTransactionExample';

describe('MultiStepTransactionExample Integration', () => {
  it('renders initial review step with form fields', () => {
    render(<MultiStepTransactionExample />);
    
    expect(screen.getByText('Review Transaction Details')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter amount')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter recipient address')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter memo')).toBeInTheDocument();
  });

  it('disables continue button when form is incomplete', () => {
    render(<MultiStepTransactionExample />);
    
    const continueBtn = screen.getByTestId('guided-action-footer-primary-btn');
    expect(continueBtn).toBeDisabled();
  });

  it('enables continue button when required fields are filled', () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Enter recipient address');
    
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    
    const continueBtn = screen.getByTestId('guided-action-footer-primary-btn');
    expect(continueBtn).not.toBeDisabled();
  });

  it('navigates to confirm step when continue is clicked', () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Enter recipient address');
    
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    
    expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 3: Confirm Transaction')).toBeInTheDocument();
  });

  it('displays transaction details on confirm step', () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Enter recipient address');
    const memoInput = screen.getByPlaceholderText('Enter memo');
    
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    fireEvent.change(memoInput, { target: { value: 'Test memo' } });
    
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    
    expect(screen.getByText('100 XLM')).toBeInTheDocument();
    expect(screen.getByText('GABC...')).toBeInTheDocument();
    expect(screen.getByText('Test memo')).toBeInTheDocument();
  });

  it('navigates back to review step when back is clicked', () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Enter recipient address');
    
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    
    // Navigate to confirm
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    expect(screen.getByText('Confirm Transaction')).toBeInTheDocument();
    
    // Navigate back
    fireEvent.click(screen.getByTestId('guided-action-footer-secondary-btn'));
    expect(screen.getByText('Review Transaction Details')).toBeInTheDocument();
  });

  it('navigates to submit step when continue is clicked on confirm', () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Enter recipient address');
    
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    
    // Navigate to confirm
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    // Navigate to submit
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    
    expect(screen.getByRole('heading', { name: 'Submit Transaction' })).toBeInTheDocument();
    expect(screen.getByText('Step 3 of 3: Submit')).toBeInTheDocument();
  });

  it('shows loading state during submission', async () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Enter recipient address');
    
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    
    // Navigate to submit
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    
    const submitBtn = screen.getByTestId('guided-action-footer-primary-btn');
    fireEvent.click(submitBtn);
    
    expect(submitBtn).toBeDisabled();
    expect(submitBtn).toHaveTextContent('Submitting...');
  });

  it('resets form when cancel is clicked', () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount') as HTMLInputElement;
    const recipientInput = screen.getByPlaceholderText('Enter recipient address') as HTMLInputElement;
    
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    
    expect(amountInput.value).toBe('100');
    expect(recipientInput.value).toBe('GABC...');
    
    fireEvent.click(screen.getByTestId('guided-action-footer-tertiary-btn'));
    
    expect(amountInput.value).toBe('');
    expect(recipientInput.value).toBe('');
  });

  it('does not show back button on review step', () => {
    render(<MultiStepTransactionExample />);
    
    expect(screen.queryByTestId('guided-action-footer-secondary-btn')).not.toBeInTheDocument();
  });

  it('shows back button on confirm and submit steps', () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Enter recipient address');
    
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    
    // Navigate to confirm
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    expect(screen.getByTestId('guided-action-footer-secondary-btn')).toBeInTheDocument();
    
    // Navigate to submit
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    expect(screen.getByTestId('guided-action-footer-secondary-btn')).toBeInTheDocument();
  });

  it('updates progress indicator correctly through steps', () => {
    render(<MultiStepTransactionExample />);
    
    const amountInput = screen.getByPlaceholderText('Enter amount');
    const recipientInput = screen.getByPlaceholderText('Enter recipient address');
    
    // Step 1
    expect(screen.getByText('Step 1 of 3: Review Details')).toBeInTheDocument();
    
    // Step 2
    fireEvent.change(amountInput, { target: { value: '100' } });
    fireEvent.change(recipientInput, { target: { value: 'GABC...' } });
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    expect(screen.getByText('Step 2 of 3: Confirm Transaction')).toBeInTheDocument();
    
    // Step 3
    fireEvent.click(screen.getByTestId('guided-action-footer-primary-btn'));
    expect(screen.getByText('Step 3 of 3: Submit')).toBeInTheDocument();
  });
});
