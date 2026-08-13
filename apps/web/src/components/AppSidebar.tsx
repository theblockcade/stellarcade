"use client";

import React from "react";
import {
  User,
  Gamepad2,
  Settings,
  Dices,
  Flame,
  Award,
  ChevronRight,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  History,
  ShieldCheck,
} from "lucide-react";
import { useWalletStatus } from "../hooks/useWalletStatus";
import { useI18n } from "../i18n/provider";
import { profileStore } from "./ProfileSettings";
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
      { route: "history", labelKey: "nav.history", defaultLabel: "Match History", icon: <History size={16} /> },
      { route: "verify", labelKey: "nav.verify", defaultLabel: "Fairness Verifier", icon: <ShieldCheck size={16} /> },
      { route: "leaderboard", labelKey: "nav.leaderboard", defaultLabel: "Leaderboard", icon: <Flame size={16} /> },
      { route: "quests", labelKey: "nav.quests", defaultLabel: "Quests & Badges", icon: <Award size={16} /> },
    ],
  },
  {
    id: "account",
    titleKey: "section.account",
    defaultTitle: "Account",
    items: [
      { route: "profile", labelKey: "nav.profile", defaultLabel: "Profile", icon: <User size={16} /> },
      { route: "settings", labelKey: "nav.settings", defaultLabel: "Settings", icon: <Settings size={16} /> },
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

  const [profile, setProfile] = React.useState(() => profileStore.selectProfile());

  React.useEffect(() => {
    return profileStore.subscribe(() => {
      setProfile(profileStore.selectProfile());
    });
  }, []);

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

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isClosedMobileNavigation = isMobileViewport && !isMobileOpen;

  const profileDisplayName = mounted && profile?.username
    ? profile.username
    : mounted && wallet.address
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
          <div className="app-sidebar__brand">
            <div className="app-sidebar__logo-badge">
              <Sparkles size={16} />
            </div>
            <h2 className="app-sidebar__title">StellarCade</h2>
          </div>
          <div className="app-sidebar__controls">
            <button
              type="button"
              className="app-sidebar__icon-button app-sidebar__desktop-collapse"
              onClick={() => setIsCollapsed((prev) => !prev)}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              data-testid="app-sidebar-collapse-toggle"
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>
            <button
              type="button"
              className="app-sidebar__icon-button app-sidebar__mobile-close"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation menu"
              data-testid="app-sidebar-mobile-close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* PROMINENT TOP PLAYER PROFILE CARD */}
        {!isCollapsed && (
          <div className="app-sidebar__profile-container">
            <button
              type="button"
              onClick={() => handleNavigate("profile")}
              className={`app-sidebar__profile-card ${currentRoute === "profile" ? "is-active" : ""}`}
              data-testid="sidebar-profile-card"
            >
              <div className="app-sidebar__profile-identity">
                <div className="app-sidebar__profile-avatar">
                  <User size={18} />
                </div>
                <div className="app-sidebar__profile-meta">
                  <strong className="app-sidebar__profile-name">
                    {profileDisplayName}
                  </strong>
                  <span className="app-sidebar__profile-status">
                    {mounted && wallet.capabilities.isConnected && (
                      <span className="app-sidebar__profile-dot" />
                    )}
                    {mounted && wallet.capabilities.isConnected
                      ? t("common.connected", "Connected")
                      : t("common.view_profile", "View Profile")}
                  </span>
                </div>
              </div>
              <ChevronRight size={14} className="app-sidebar__profile-arrow" />
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
                        title={label}
                        data-testid={`app-sidebar-link-${item.route}`}
                      >
                        <span className="app-sidebar__icon">
                          {item.icon}
                        </span>
                        <span className="app-sidebar__label">{label}</span>
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
