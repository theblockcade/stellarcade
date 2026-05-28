import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PreSubmitReviewMarker, { ReviewMarker } from '../../src/components/PreSubmitReviewMarker';

const mockMarkers: ReviewMarker[] = [
  {
    id: 'security-audit',
    type: 'critical',
    title: 'Security Audit Completed',
    description: 'Verify that a comprehensive security audit has been performed.',
    checked: false,
    required: true,
  },
  {
    id: 'documentation',
    type: 'info',
    title: 'Documentation Complete',
    description: 'All functions are properly documented.',
    checked: false,
    required: false,
  },
  {
    id: 'testing',
    type: 'warning',
    title: 'Testing Coverage',
    description: 'Adequate test coverage is in place.',
    checked: true,
    required: true,
  },
];

describe('PreSubmitReviewMarker', () => {
  const mockOnMarkersChange = vi.fn();
  const mockOnReviewComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with markers', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    expect(screen.getByText('Pre-Submit Review')).toBeInTheDocument();
    expect(screen.getByText('Security Audit Completed')).toBeInTheDocument();
    expect(screen.getByText('Documentation Complete')).toBeInTheDocument();
    expect(screen.getByText('Testing Coverage')).toBeInTheDocument();
  });

  it('shows high impact indicator when isHighImpact is true', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
        isHighImpact={true}
      />
    );

    expect(screen.getByText('Pre-Submit Review (High Impact)')).toBeInTheDocument();
  });

  it('displays correct progress information', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    expect(screen.getByText('1 of 3 completed')).toBeInTheDocument();
    expect(screen.getByText('2 required items')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('toggles marker checked state when clicked', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    const securityCheckbox = screen.getByLabelText('Security Audit Completed');
    fireEvent.click(securityCheckbox);

    expect(mockOnMarkersChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'security-audit',
          checked: true,
        }),
      ])
    );
  });

  it('expands and collapses marker descriptions', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    // Initially, description should not be visible
    expect(screen.queryByText('Verify that a comprehensive security audit has been performed.')).not.toBeInTheDocument();

    // Click expand button
    const expandButtons = screen.getAllByLabelText('Expand');
    fireEvent.click(expandButtons[0]);

    // Description should now be visible
    expect(screen.getByText('Verify that a comprehensive security audit has been performed.')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByLabelText('Collapse');
    fireEvent.click(collapseButton);

    // Description should be hidden again
    expect(screen.queryByText('Verify that a comprehensive security audit has been performed.')).not.toBeInTheDocument();
  });

  it('shows required badges for required markers', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    const requiredBadges = screen.getAllByText('Required');
    expect(requiredBadges).toHaveLength(2); // security-audit and testing are required
  });

  it('calls onReviewComplete with correct status', async () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    // Initially, not all required items are checked (security-audit is unchecked)
    await waitFor(() => {
      expect(mockOnReviewComplete).toHaveBeenCalledWith(false);
    });
  });

  it('shows completion status correctly', () => {
    const allCheckedMarkers = mockMarkers.map(m => ({ ...m, checked: true }));
    
    render(
      <PreSubmitReviewMarker
        markers={allCheckedMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    expect(screen.getByText('All required items completed')).toBeInTheDocument();
  });

  it('shows remaining items count when not all required items are completed', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    expect(screen.getByText('1 required items remaining')).toBeInTheDocument();
  });

  it('renders empty state when no markers provided', () => {
    const { container } = render(
      <PreSubmitReviewMarker
        markers={[]}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('applies correct styling for different marker types', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    // Check for critical marker styling (red)
    const criticalMarker = screen.getByText('Security Audit Completed').closest('.border-red-200');
    expect(criticalMarker).toBeInTheDocument();

    // Check for info marker styling (blue)
    const infoMarker = screen.getByText('Documentation Complete').closest('.border-blue-200');
    expect(infoMarker).toBeInTheDocument();

    // Check for warning marker styling (yellow)
    const warningMarker = screen.getByText('Testing Coverage').closest('.border-yellow-200');
    expect(warningMarker).toBeInTheDocument();
  });

  it('updates progress bar correctly', () => {
    const { rerender } = render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    // Initial state: 1 of 3 checked (33%)
    expect(screen.getByText('33%')).toBeInTheDocument();

    // Update to all checked
    const allCheckedMarkers = mockMarkers.map(m => ({ ...m, checked: true }));
    rerender(
      <PreSubmitReviewMarker
        markers={allCheckedMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
      />
    );

    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays custom contract type in description', () => {
    render(
      <PreSubmitReviewMarker
        markers={mockMarkers}
        onMarkersChange={mockOnMarkersChange}
        onReviewComplete={mockOnReviewComplete}
        contractType="treasury contract"
      />
    );

    expect(screen.getByText('Review these items before submitting your treasury contract form')).toBeInTheDocument();
  });
});