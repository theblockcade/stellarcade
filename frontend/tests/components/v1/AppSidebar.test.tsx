/**
 * @vitest-environment happy-dom
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AppSidebar from '@/components/v1/AppSidebar';

describe('AppSidebar', () => {
  it('renders grouped navigation and marks the active route', () => {
    render(<AppSidebar activeRoute="pagination-demo" />);

    expect(screen.getByText('Main')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();

    const activeLink = screen.getByRole('link', { name: 'Pagination Demo' });
    expect(activeLink).toHaveClass('active');
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    const inactiveLink = screen.getByRole('link', { name: 'Lobby' });
    expect(inactiveLink).not.toHaveClass('active');
  });

  it('toggles collapsed state on desktop', () => {
    const { container } = render(<AppSidebar activeRoute="lobby" />);
    const sidebar = container.querySelector('.app-sidebar');

    expect(sidebar).not.toHaveClass('is-collapsed');

    fireEvent.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(sidebar).toHaveClass('is-collapsed');

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(sidebar).not.toHaveClass('is-collapsed');
  });

  it('toggles and closes mobile sidebar overlay', () => {
    const { container } = render(<AppSidebar activeRoute="lobby" />);

    const sidebar = container.querySelector('.app-sidebar');
    expect(sidebar).not.toHaveClass('is-mobile-open');

    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
    expect(sidebar).toHaveClass('is-mobile-open');
    expect(screen.getByRole('button', { name: 'Close sidebar overlay' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close sidebar overlay' }));
    expect(sidebar).not.toHaveClass('is-mobile-open');
  });
});
