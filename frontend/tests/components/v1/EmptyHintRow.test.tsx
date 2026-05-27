import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyHintRow } from '../../../src/components/v1/EmptyHintRow';

describe('EmptyHintRow', () => {
  it('renders default message inside a table', () => {
    render(
      <table><tbody><EmptyHintRow colSpan={3} /></tbody></table>
    );
    expect(screen.getByTestId('empty-hint-row')).toBeTruthy();
    expect(screen.getByText('No data available.')).toBeTruthy();
  });

  it('renders custom message and icon', () => {
    render(
      <table><tbody>
        <EmptyHintRow colSpan={4} message="No transactions yet." icon="💸" />
      </tbody></table>
    );
    expect(screen.getByText('No transactions yet.')).toBeTruthy();
    expect(screen.getByText('💸')).toBeTruthy();
  });

  it('applies aria-live to the cell for screen readers', () => {
    render(
      <table><tbody><EmptyHintRow /></tbody></table>
    );
    const cell = screen.getByRole('cell');
    expect(cell.getAttribute('aria-live')).toBe('polite');
  });

  it('spans the given colSpan', () => {
    render(
      <table><tbody><EmptyHintRow colSpan={6} /></tbody></table>
    );
    const cell = screen.getByRole('cell');
    expect(cell.getAttribute('colspan')).toBe('6');
  });
});
