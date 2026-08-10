/**
 * @vitest-environment happy-dom
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, expect, it } from 'vitest';
import AppSidebar from '@/components/v1/AppSidebar';
// App component is tested indirectly via AppSidebar

describe('Accessibility Landmarks (#1003)', () => {
  it('renders sidebar navigation with role="navigation"', () => {
    render(<AppSidebar currentRoute="lobby" onNavigate={() => {}} />);
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    expect(navigation).toHaveAttribute('aria-label', 'Primary dashboard');
  });

  it('sidebar navigation has explicit role attribute', () => {
    render(<AppSidebar currentRoute="games" onNavigate={() => {}} />);
    const nav = screen.getByTestId('app-sidebar');
    expect(nav).toHaveAttribute('role', 'navigation');
  });

  it('sidebar toggle button has aria-controls targeting navigation', () => {
    render(<AppSidebar currentRoute="lobby" onNavigate={() => {}} />);
    const toggle = screen.getByTestId('app-sidebar-mobile-toggle');
    expect(toggle).toHaveAttribute('aria-controls', 'primary-dashboard-navigation');
  });

  it('sidebar collapse toggle has descriptive aria-label', () => {
    render(<AppSidebar currentRoute="lobby" onNavigate={() => {}} />);
    const collapseBtn = screen.getByTestId('app-sidebar-collapse-toggle');
    expect(collapseBtn).toHaveAttribute('aria-label');
  });
});
