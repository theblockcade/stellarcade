import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardCardContainer } from '../../src/components/v1/DashboardCardContainer';
import '../../src/components/v1/DashboardCardContainer.css';

describe('DashboardCardContainer', () => {
  describe('rendering', () => {
    it('renders with label and children', () => {
      render(
        <DashboardCardContainer label="Test Card" testId="test-card">
          <div>Card content</div>
        </DashboardCardContainer>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute('aria-label', 'Test Card');
      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('applies aria-describedby when description is provided', () => {
      render(
        <DashboardCardContainer
          label="Test Card"
          description="This is a test card"
          testId="test-card"
        >
          Content
        </DashboardCardContainer>
      );

      const card = screen.getByTestId('test-card');
      const descId = card.getAttribute('aria-describedby');
      expect(descId).toBeDefined();

      const descElement = screen.getByText('This is a test card');
      expect(descElement).toHaveAttribute('id', descId);
    });
  });

  describe('variants', () => {
    it('applies the correct variant class', () => {
      const { rerender } = render(
        <DashboardCardContainer label="Test" variant="default" testId="test-card">
          Content
        </DashboardCardContainer>
      );

      let card = screen.getByTestId('test-card');
      expect(card).toHaveClass('dashboard-card--default');

      rerender(
        <DashboardCardContainer label="Test" variant="primary" testId="test-card">
          Content
        </DashboardCardContainer>
      );

      card = screen.getByTestId('test-card');
      expect(card).toHaveClass('dashboard-card--primary');

      rerender(
        <DashboardCardContainer label="Test" variant="elevated" testId="test-card">
          Content
        </DashboardCardContainer>
      );

      card = screen.getByTestId('test-card');
      expect(card).toHaveClass('dashboard-card--elevated');
    });
  });

  describe('loading state', () => {
    it('displays loading overlay when loading is true', () => {
      render(
        <DashboardCardContainer label="Test" loading={true} testId="test-card">
          Content
        </DashboardCardContainer>
      );

      const loadingOverlay = screen.getByTestId('test-card-loading');
      expect(loadingOverlay).toBeInTheDocument();
      expect(screen.getByTestId('test-card')).toHaveAttribute('aria-busy', 'true');
    });

    it('updates label when loadingLabel is provided', () => {
      const { rerender } = render(
        <DashboardCardContainer
          label="Test Card"
          loading={false}
          testId="test-card"
        >
          Content
        </DashboardCardContainer>
      );

      let card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('aria-label', 'Test Card');

      rerender(
        <DashboardCardContainer
          label="Test Card"
          loading={true}
          loadingLabel="Loading..."
          testId="test-card"
        >
          Content
        </DashboardCardContainer>
      );

      card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('aria-label', 'Loading...');
    });
  });

  describe('empty state', () => {
    it('displays empty overlay when isEmpty is true', () => {
      render(
        <DashboardCardContainer label="Test" isEmpty={true} testId="test-card">
          Content
        </DashboardCardContainer>
      );

      const emptyOverlay = screen.getByTestId('test-card-empty');
      expect(emptyOverlay).toBeInTheDocument();
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('applies empty class to container', () => {
      render(
        <DashboardCardContainer label="Test" isEmpty={true} testId="test-card">
          Content
        </DashboardCardContainer>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('dashboard-card--empty');
    });
  });

  describe('accessibility', () => {
    it('has role region', () => {
      render(
        <DashboardCardContainer label="Test" testId="test-card">
          Content
        </DashboardCardContainer>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('role', 'region');
    });

    it('properly hides description with sr-only class', () => {
      render(
        <DashboardCardContainer
          label="Test"
          description="Hidden description"
          testId="test-card"
        >
          Content
        </DashboardCardContainer>
      );

      const description = screen.getByText('Hidden description');
      expect(description).toHaveClass('sr-only');
    });
  });

  describe('custom properties', () => {
    it('accepts custom className', () => {
      render(
        <DashboardCardContainer
          label="Test"
          className="custom-class"
          testId="test-card"
        >
          Content
        </DashboardCardContainer>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveClass('custom-class');
    });

    it('accepts custom descriptionId', () => {
      render(
        <DashboardCardContainer
          label="Test"
          description="Test description"
          descriptionId="custom-desc-id"
          testId="test-card"
        >
          Content
        </DashboardCardContainer>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('aria-describedby', 'custom-desc-id');

      const description = screen.getByText('Test description');
      expect(description).toHaveAttribute('id', 'custom-desc-id');
    });
  });
});
