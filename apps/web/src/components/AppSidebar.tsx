"use client";

import React from "react";
import { User, Shield, Trophy, Gamepad2, Coins, Settings, HelpCircle, Layers, FileText, ChevronRight } from "lucide-react";
import { useWalletStatus } from "../hooks/useWalletStatus";
import "./AppSidebar.css";

export type AppRoute =
  | "lobby"
  | "games"
  | "tournaments"
  | "quests"
  | "leaderboard"
  | "history"
  | "rewards"
  | "verify"
  | "portfolio"
  | "cleanup"
  | "profile"
  | "settings"
  | "about"
  | "terms"
  | "privacy";

interface SidebarItem {
  route: AppRoute;
  label: string;
}

interface SidebarSection {
  id: string;
  title: string;
  items: SidebarItem[];
}

export interface AppSidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const sections: SidebarSection[] = [
  {
    id: "play",
    title: "Play & Compete",
    items: [
      { route: "lobby", label: "Arcade Lobby" },
      { route: "games", label: "Games Arena" },
      { route: "tournaments", label: "Tournaments" },
      { route: "quests", label: "Quests & Badges" },
      { route: "leaderboard", label: "Leaderboard" },
      { route: "history", label: "Match History" },
      { route: "verify", label: "Fairness Verifier" },
    ],
  },
  {
    id: "account",
    title: "Vault & Assets",
    items: [
      { route: "portfolio", label: "Portfolio Vault" },
      { route: "rewards", label: "Claim Rewards" },
      { route: "cleanup", label: "Account Hygiene" },
    ],
  },
  {
    id: "system",
    title: "System & Info",
    items: [
      { route: "settings", label: "Settings" },
      { route: "about", label: "Architecture & About" },
      { route: "terms", label: "Terms of Protocol" },
      { route: "privacy", label: "Privacy Architecture" },
    ],
  },
];

function getMobileNavigationMediaQuery(): MediaQueryList | null {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return null;
  }

  return window.matchMedia("(max-width: 1023px)") ?? null;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ currentRoute, onNavigate }) => {
  const wallet = useWalletStatus();
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);
  const [isMobileViewport, setIsMobileViewport] = React.useState(() => {
    return !!getMobileNavigationMediaQuery()?.matches;
  });

  React.useEffect(() => {
    const mediaQuery = getMobileNavigationMediaQuery();

    if (!mediaQuery) {
      return undefined;
    }

    const syncMobileViewport = () => setIsMobileViewport(mediaQuery.matches);

    syncMobileViewport();
    mediaQuery.addEventListener("change", syncMobileViewport);

    return () => mediaQuery.removeEventListener("change", syncMobileViewport);
  }, []);

  const handleNavigate = (route: AppRoute) => {
    onNavigate(route);
    setIsMobileOpen(false);
  };

  const isClosedMobileNavigation = isMobileViewport && !isMobileOpen;

  const compactAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : "Guest Player";

  return (
    <>
      <button
        type="button"
        className="app-sidebar__mobile-toggle"
        aria-label="Open navigation menu"
        aria-controls="primary-dashboard-navigation"
        aria-expanded={isMobileOpen}
        onClick={() => setIsMobileOpen(true)}
        data-testid="app-sidebar-mobile-toggle"
      >
        Menu
      </button>

      <nav
        id="primary-dashboard-navigation"
        role="navigation"
        className={`app-sidebar ${isCollapsed ? "is-collapsed" : ""} ${isMobileOpen ? "is-mobile-open" : ""}`.trim()}
        aria-label="Primary dashboard"
        aria-hidden={isClosedMobileNavigation ? true : undefined}
        data-testid="app-sidebar"
        inert={isClosedMobileNavigation || undefined}
      >
        <div className="app-sidebar__header">
          <h2 className="app-sidebar__title">StellarCade</h2>
          <div className="app-sidebar__controls">
            <button
              type="button"
              className="app-sidebar__icon-button app-sidebar__desktop-collapse"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              data-testid="app-sidebar-collapse-toggle"
            >
              {isCollapsed ? "→" : "←"}
            </button>
            <button
              type="button"
              className="app-sidebar__icon-button app-sidebar__mobile-close"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation menu"
              data-testid="app-sidebar-mobile-close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PROMINENT TOP PLAYER PROFILE CARD */}
        {!isCollapsed && (
          <div style={{ padding: "0 1rem 1rem 1rem" }}>
            <button
              type="button"
              onClick={() => handleNavigate("profile")}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderRadius: "12px",
                background: currentRoute === "profile" ? "rgba(0, 255, 204, 0.15)" : "rgba(255, 255, 255, 0.04)",
                border: currentRoute === "profile" ? "1px solid var(--sc-accent, #00ffcc)" : "1px solid rgba(255, 255, 255, 0.08)",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
              data-testid="sidebar-profile-card"
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #00ffcc, #3b82f6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#000",
                    fontWeight: 800,
                    fontSize: "14px",
                  }}
                >
                  <User size={18} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "13px", color: "#fff", lineHeight: 1.2 }}>
                    {compactAddress}
                  </strong>
                  <span style={{ fontSize: "11px", color: "var(--sc-accent, #00ffcc)", fontWeight: 600 }}>
                    {wallet.capabilities.isConnected ? "✓ Connected" : "View Profile"}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: "var(--sc-text-dim, #94a3b8)" }} />
            </button>
          </div>
        )}

        <div className="app-sidebar__nav-groups">
          {sections.map((section) => (
            <div key={section.id} className="app-sidebar__section">
              <h3 className="app-sidebar__section-title">{section.title}</h3>
              <ul className="app-sidebar__list">
                {section.items.map((item) => {
                  const isActive = item.route === currentRoute;
                  return (
                    <li key={item.route}>
                      <button
                        type="button"
                        className={`app-sidebar__link ${isActive ? "is-active" : ""}`.trim()}
                        onClick={() => handleNavigate(item.route)}
                        aria-current={isActive ? "page" : undefined}
                        data-testid={`app-sidebar-link-${item.route}`}
                      >
                        {item.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
};

export default AppSidebar;
