import React, { useState } from 'react';
import './AppSidebar.css';

export type SidebarRouteKey = 'lobby' | 'pagination-demo' | 'games' | 'profile';

interface SidebarItem {
  key: SidebarRouteKey;
  label: string;
  href: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    title: 'Main',
    items: [
      { key: 'lobby', label: 'Lobby', href: '/' },
      {
        key: 'pagination-demo',
        label: 'Pagination Demo',
        href: '/?demo=pagination',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      { key: 'games', label: 'Games', href: '/games' },
      { key: 'profile', label: 'Profile', href: '/profile' },
    ],
  },
];

interface AppSidebarProps {
  activeRoute: SidebarRouteKey;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ activeRoute }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleCollapseToggle = () => {
    setIsCollapsed((prev) => !prev);
  };

  const handleMobileToggle = () => {
    setIsMobileOpen((prev) => !prev);
  };

  const closeMobileSidebar = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="sidebar-mobile-toggle"
        onClick={handleMobileToggle}
        aria-expanded={isMobileOpen}
        aria-controls="app-sidebar"
      >
        {isMobileOpen ? 'Close menu' : 'Open menu'}
      </button>

      <aside
        id="app-sidebar"
        className={[
          'app-sidebar',
          isCollapsed ? 'is-collapsed' : '',
          isMobileOpen ? 'is-mobile-open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="sidebar-header">
          <h2 className="sidebar-title">Navigation</h2>
          <button
            type="button"
            className="sidebar-collapse-toggle"
            onClick={handleCollapseToggle}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? 'Expand' : 'Collapse'}
          </button>
        </div>

        <nav aria-label="Sidebar navigation">
          {SIDEBAR_SECTIONS.map((section) => (
            <div className="sidebar-section" key={section.title}>
              <p className="sidebar-section-title">{section.title}</p>
              <ul className="sidebar-links">
                {section.items.map((item) => (
                  <li key={item.key}>
                    <a
                      href={item.href}
                      onClick={closeMobileSidebar}
                      className={item.key === activeRoute ? 'active' : ''}
                      aria-current={item.key === activeRoute ? 'page' : undefined}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {isMobileOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close sidebar overlay"
          onClick={closeMobileSidebar}
        />
      ) : null}
    </>
  );
};

export default AppSidebar;
