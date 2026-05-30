import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RelatedRecordActionRow } from '../../src/components/v1/RelatedRecordActionRow';

describe('RelatedRecordActionRow', () => {
  it('renders loading state correctly', () => {
    render(<RelatedRecordActionRow id="1" title="Test" isLoading />);
    expect(screen.getByTestId('related-record-action-row-loading')).toBeInTheDocument();
  });

  it('renders title and subtitle', () => {
    render(<RelatedRecordActionRow id="1" title="Contract A" subtitle="Active" />);
    expect(screen.getByText('Contract A')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders icon when provided', () => {
    render(
      <RelatedRecordActionRow 
        id="1" 
        title="Test" 
        icon={<span data-testid="test-icon">icon</span>} 
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('fires onClick when the row main area is clicked and renders as button', () => {
    const handleClick = vi.fn();
    render(<RelatedRecordActionRow id="1" title="Clickable" onClick={handleClick} />);
    
    // The main clickable area is inside the outer div, so we find it by its CSS class
    const wrapper = screen.getByTestId('related-record-action-row');
    const mainBtn = wrapper.querySelector('.related-record-action-row__main');
    
    fireEvent.click(mainBtn!);
    expect(handleClick).toHaveBeenCalledTimes(1);
    expect(mainBtn!.tagName.toLowerCase()).toBe('button');
  });

  it('renders main area as div when no onClick is provided', () => {
    render(<RelatedRecordActionRow id="1" title="Static" />);
    const wrapper = screen.getByTestId('related-record-action-row');
    const mainDiv = wrapper.querySelector('.related-record-action-row__main');
    expect(mainDiv!.tagName.toLowerCase()).toBe('div');
  });

  it('renders actions and handles their clicks without triggering row click', () => {
    const handleRowClick = vi.fn();
    const handleActionClick = vi.fn();
    
    render(
      <RelatedRecordActionRow 
        id="1" 
        title="Row" 
        onClick={handleRowClick}
        actions={[
          { label: 'View', onClick: handleActionClick, testId: 'action-view' }
        ]} 
      />
    );
    
    const actionBtn = screen.getByTestId('action-view');
    expect(actionBtn).toBeInTheDocument();
    
    // Clicking the action should not bubble up to the row's onClick
    fireEvent.click(actionBtn);
    expect(handleActionClick).toHaveBeenCalledTimes(1);
    expect(handleRowClick).not.toHaveBeenCalled();
  });

  it('renders disabled actions', () => {
    render(
      <RelatedRecordActionRow 
        id="1" 
        title="Row" 
        actions={[
          { label: 'View', onClick: () => {}, testId: 'action-view', disabled: true }
        ]} 
      />
    );
    
    const actionBtn = screen.getByTestId('action-view');
    expect(actionBtn).toBeDisabled();
  });

  describe('Edge cases and fallback behavior', () => {
    it('renders empty state with custom message', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          isEmpty 
          emptyMessage="No related contracts found"
        />
      );
      
      expect(screen.getByTestId('related-record-action-row-empty')).toBeInTheDocument();
      expect(screen.getByText('No related contracts found')).toBeInTheDocument();
    });

    it('renders empty state with default message', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          isEmpty 
        />
      );
      
      expect(screen.getByTestId('related-record-action-row-empty')).toBeInTheDocument();
      expect(screen.getByText('No records found')).toBeInTheDocument();
    });

    it('renders disabled row with disabled reason', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          disabled 
          disabledReason="Contract is locked"
        />
      );
      
      const wrapper = screen.getByTestId('related-record-action-row');
      expect(wrapper).toHaveClass('related-record-action-row--disabled');
      expect(screen.getByText('Contract is locked')).toBeInTheDocument();
    });

    it('disables row click when disabled', () => {
      const handleClick = vi.fn();
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          onClick={handleClick}
          disabled
        />
      );
      
      const wrapper = screen.getByTestId('related-record-action-row');
      const mainDiv = wrapper.querySelector('.related-record-action-row__main');
      
      fireEvent.click(mainDiv!);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('disables all actions when row is disabled', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          actions={[
            { label: 'View', onClick: () => {}, testId: 'action-view' },
            { label: 'Edit', onClick: () => {}, testId: 'action-edit' }
          ]}
          disabled
        />
      );
      
      expect(screen.getByTestId('action-view')).toBeDisabled();
      expect(screen.getByTestId('action-edit')).toBeDisabled();
    });

    it('shows loading spinner on action button', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          actions={[
            { label: 'View', onClick: () => {}, testId: 'action-view', isLoading: true }
          ]}
        />
      );
      
      const actionBtn = screen.getByTestId('action-view');
      expect(actionBtn).toBeDisabled();
      expect(actionBtn).toHaveAttribute('aria-busy', 'true');
      expect(actionBtn.querySelector('.related-record-action-row__spinner')).toBeInTheDocument();
    });

    it('renders action with disabled reason', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          actions={[
            { 
              label: 'View', 
              onClick: () => {}, 
              testId: 'action-view', 
              disabled: true,
              disabledReason: 'Insufficient permissions'
            }
          ]}
        />
      );
      
      expect(screen.getByText('Insufficient permissions')).toBeInTheDocument();
    });

    it('does not render actions when array is empty', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          actions={[]}
        />
      );
      
      const wrapper = screen.getByTestId('related-record-action-row');
      expect(wrapper.querySelector('.related-record-action-row__actions')).not.toBeInTheDocument();
    });

    it('does not render actions when not provided', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
        />
      );
      
      const wrapper = screen.getByTestId('related-record-action-row');
      expect(wrapper.querySelector('.related-record-action-row__actions')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA role for empty state', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          isEmpty 
        />
      );
      
      const emptyState = screen.getByTestId('related-record-action-row-empty');
      expect(emptyState).toHaveAttribute('role', 'status');
      expect(emptyState).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-disabled attribute when row is disabled', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          onClick={() => {}}
          disabled
        />
      );
      
      const wrapper = screen.getByTestId('related-record-action-row');
      const mainBtn = wrapper.querySelector('.related-record-action-row__main');
      expect(mainBtn).toHaveAttribute('aria-disabled', 'true');
    });

    it('has aria-describedby for disabled reason', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          onClick={() => {}}
          disabled
          disabledReason="Contract locked"
        />
      );
      
      const wrapper = screen.getByTestId('related-record-action-row');
      const mainBtn = wrapper.querySelector('.related-record-action-row__main');
      expect(mainBtn).toHaveAttribute('aria-describedby', 'related-record-action-row-disabled-reason');
    });

    it('has aria-busy on loading action button', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          actions={[
            { label: 'View', onClick: () => {}, testId: 'action-view', isLoading: true }
          ]}
        />
      );
      
      expect(screen.getByTestId('action-view')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-label on action buttons', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          actions={[
            { label: 'View', onClick: () => {}, testId: 'action-view' }
          ]}
        />
      );
      
      expect(screen.getByTestId('action-view')).toHaveAttribute('aria-label', 'View');
    });

    it('has title attribute on action buttons', () => {
      render(
        <RelatedRecordActionRow 
          id="1" 
          title="Test" 
          actions={[
            { label: 'View', onClick: () => {}, testId: 'action-view' }
          ]}
        />
      );
      
      expect(screen.getByTestId('action-view')).toHaveAttribute('title', 'View');
    });
  });
});
