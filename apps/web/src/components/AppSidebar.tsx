"use client";

import React from "react";
import {
  User,
  ShieldCheck,
  Trophy,
  Gamepad2,
  Coins,
  Settings,
  Layers,
  FileText,
  Lock,
  Dices,
  Flame,
  Award,
  History,
  Wallet,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { useWalletStatus } from "../hooks/useWalletStatus";
import { useI18n } from "../i18n/provider";
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

interface SidebarItemConfig {
  route: AppRoute;
  labelKey: string;
  defaultLabel: string;
  icon: React.ReactNode;
}

interface SidebarSectionConfig {
  id: string;
  titleKey: string;
  defaultTitle: string;
  items: SidebarItemConfig[];
}

export interface AppSidebarProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

const SECTION_CONFIGS: SidebarSectionConfig[] = [
  {
    id: "play",
    titleKey: "section.play",
    defaultTitle: "Play",
    items: [
      { route: "lobby", labelKey: "nav.lobby", defaultLabel: "Arcade Lobby", icon: <Gamepad2 size={16} /> },
      { route: "games", labelKey: "nav.games", defaultLabel: "Games Arena", icon: <Dices size={16} /> },
      { route: "tournaments", labelKey: "nav.tournaments", defaultLabel: "Tournaments", icon: <Trophy size={16} /> },
      { route: "quests", labelKey: "nav.quests", defaultLabel: "Quests & Badges", icon: <Award size={16} /> },
      { route: "leaderboard", labelKey: "nav.leaderboard", defaultLabel: "Leaderboard", icon: <Flame size={16} /> },
      { route: "history", labelKey: "nav.history", defaultLabel: "Match History", icon: <History size={16} /> },
      { route: "verify", labelKey: "nav.verify", defaultLabel: "Fairness Verifier", icon: <ShieldCheck size={16} /> },
    ],
  },
  {
    id: "account",
    titleKey: "section.vault",
    defaultTitle: "Account",
    items: [
      { route: "portfolio", labelKey: "nav.portfolio", defaultLabel: "Portfolio", icon: <Wallet size={16} /> },
      { route: "rewards", labelKey: "nav.rewards", defaultLabel: "Claim Rewards", icon: <Coins size={16} /> },
      { route: "cleanup", labelKey: "nav.cleanup", defaultLabel: "Cleanup", icon: <Sparkles size={16} /> },
    ],
  },
  {
    id: "system",
    titleKey: "section.system",
    defaultTitle: "More",
    items: [
      { route: "settings", labelKey: "nav.settings", defaultLabel: "Settings", icon: <Settings size={16} /> },
      { route: "about", labelKey: "nav.about", defaultLabel: "About", icon: <Layers size={16} /> },
      { route: "terms", labelKey: "nav.terms", defaultLabel: "Terms", icon: <FileText size={16} /> },
      { route: "privacy", labelKey: "nav.privacy", defaultLabel: "Privacy", icon: <Lock size={16} /> },
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
  const { t } = useI18n();
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
    : t("common.guest_player", "Guest Player");

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
                    {wallet.capabilities.isConnected
                      ? t("common.connected", "Connected")
                      : t("common.view_profile", "View Profile")}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} style={{ color: "var(--sc-text-dim, #94a3b8)" }} />
            </button>
          </div>
        )}

        <div className="app-sidebar__nav-groups">
          {SECTION_CONFIGS.map((section) => (
            <div key={section.id} className="app-sidebar__section">
              <h3 className="app-sidebar__section-title">
                {t(section.titleKey, section.defaultTitle)}
              </h3>
              <ul className="app-sidebar__list">
                {section.items.map((item) => {
                  const isActive = item.route === currentRoute;
                  const label = t(item.labelKey, item.defaultLabel);
                  return (
                    <li key={item.route}>
                      <button
                        type="button"
                        className={`app-sidebar__link ${isActive ? "is-active" : ""}`.trim()}
                        onClick={() => handleNavigate(item.route)}
                        aria-current={isActive ? "page" : undefined}
                        data-testid={`app-sidebar-link-${item.route}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                        }}
                      >
                        <span
                          style={{
                            color: isActive ? "var(--sc-accent, #00ffcc)" : "var(--sc-text-dim, #94a3b8)",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          {item.icon}
                        </span>
                        <span>{label}</span>
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
