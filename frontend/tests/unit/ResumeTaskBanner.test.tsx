import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeTaskBanner } from '../../src/components/v1/ResumeTaskBanner';
import { FormErrorSummary } from '../../src/components/v1/FormErrorSummary';

describe('ResumeTaskBanner', () => {
  it('renders correctly and responds to events', () => {
    const onResume = vi.fn();
    const onDismiss = vi.fn();
    render(
      <ResumeTaskBanner taskName="Complete Profile" onResume={onResume} onDismiss={onDismiss} />
    );
    expect(screen.getByText(/Complete Profile/i)).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('resume-task-banner-resume-btn'));
    expect(onResume).toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('resume-task-banner-dismiss-btn'));
    expect(onDismiss).toHaveBeenCalled();
  });
});

describe('FormErrorSummary', () => {
  it('renders errors correctly', () => {
    render(<FormErrorSummary errors={[{ field: 'username', message: 'Username is required' }]} />);
    expect(screen.getByText('Username is required')).toBeInTheDocument();
  });

  it('calls onFocusJump when an error is clicked', () => {
    const onFocusJump = vi.fn();
    render(
      <FormErrorSummary
        errors={[{ field: 'username', message: 'Username is required' }]}
        onFocusJump={onFocusJump}
      />
    );
    
    fireEvent.click(screen.getByText('username'));
    expect(onFocusJump).toHaveBeenCalledWith('username');
  });
});
