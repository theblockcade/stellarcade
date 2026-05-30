import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RelatedRecordActionRow } from '../../src/components/v1/RelatedRecordActionRow';

describe('RelatedRecordActionRow', () => {
  it('renders loading state correctly', () => {
    const { container } = render(<RelatedRecordActionRow id="1" title="Test" isLoading />);
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
});
