"use client";

import React, { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { I18nProvider, useI18n } from "../i18n/provider";
import HeaderWalletControl from "./HeaderWalletControl";
import Breadcrumbs from "./BreadCrumbs";
import { AppSidebar, type AppRoute } from "./AppSidebar";
import NotificationCenter from "./NotificationCenter";
import { ModalStackProvider } from "./modal-stack";
import { FeatureFlagsProvider } from "../services/feature-flags";
import { Search } from "lucide-react";
import CommandPalette, { commandStore, type Command } from "./CommandPalette";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import "./AppShell.css";

/**
 * Next.js port of frontend/src/App.tsx's shell. The original used
 * react-router's useLocation/useNavigate to map the URL to an AppRoute and
 * back; here that's next/navigation's usePathname/useRouter instead.
 *
 * Route mapping differs from the original in one way: the lobby lives at
 * `/app` here, not `/` (which is now the new marketing landing page — see
 * MIGRATION.md). "games" has no dedicated route yet, so it also resolves
 * to `/app`, matching GameLobby's own behavior of serving both concerns
 * from one component.
 */

const MAIN_CONTENT_ID = "main-content";

function getAppRoute(pathname: string): AppRoute {
  if (pathname === "/about" || pathname.startsWith("/about/")) {
    return "about";
  }
  if (pathname === "/terms" || pathname.startsWith("/terms/")) {
    return "terms";
  }
  if (pathname === "/privacy" || pathname.startsWith("/privacy/")) {
    return "privacy";
  }
  if (pathname === "/verify" || pathname.startsWith("/verify/")) {
    return "verify";
  }
  if (pathname === "/cleanup" || pathname.startsWith("/cleanup/")) {
    return "cleanup";
  }
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return "profile";
  }
  if (pathname === "/settings" || pathname.startsWith("/settings/")) {
    return "settings";
  }
  if (pathname === "/portfolio" || pathname.startsWith("/portfolio/")) {
    return "portfolio";
  }
  if (pathname === "/rewards" || pathname.startsWith("/rewards/")) {
    return "rewards";
  }
  if (pathname === "/tournaments" || pathname.startsWith("/tournaments/")) {
    return "tournaments";
  }
  if (pathname === "/quests" || pathname.startsWith("/quests/")) {
    return "quests";
  }
  if (pathname === "/leaderboard" || pathname.startsWith("/leaderboard/")) {
    return "leaderboard";
  }
  if (pathname === "/history" || pathname.startsWith("/history/")) {
    return "history";
  }
  if (pathname === "/games" || pathname.startsWith("/games/")) {
    return "games";
  }
  return "lobby";
}

function routeToPath(route: AppRoute): string {
  switch (route) {
    case "about":
      return "/about";
    case "terms":
      return "/terms";
    case "privacy":
      return "/privacy";
    case "verify":
      return "/verify";
    case "cleanup":
      return "/cleanup";
    case "profile":
      return "/profile";
    case "settings":
      return "/settings";
    case "portfolio":
      return "/portfolio";
    case "rewards":
      return "/rewards";
    case "tournaments":
      return "/tournaments";
    case "quests":
      return "/quests";
    case "leaderboard":
      return "/leaderboard";
    case "history":
      return "/history";
    case "games":
      return "/games";
    case "lobby":
    default:
      return "/app";
  }
}

const AppShellContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const route = useMemo(() => getAppRoute(pathname), [pathname]);

  const handleNavigate = useCallback(
    (nextRoute: AppRoute) => {
      router.push(routeToPath(nextRoute));
    },
    [router],
  );

  const commands: Command[] = [
    {
      id: "go-lobby",
      label: "Go to Lobby",
      description: "Open the game lobby",
      action: () => handleNavigate("lobby"),
    },
    {
      id: "go-games",
      label: "Go to Games",
      description: "Open the games section",
      action: () => handleNavigate("games"),
    },
    {
      id: "go-tournaments",
      label: "Go to Tournaments",
      description: "View competitive on-chain brackets and prize pools",
      action: () => handleNavigate("tournaments"),
    },
    {
      id: "go-quests",
      label: "Go to Quests & Badges",
      description: "Track XP milestones and Soulbound Badges",
      action: () => handleNavigate("quests"),
    },
    {
      id: "go-leaderboard",
      label: "Go to Leaderboard",
      description: "View top-ranked players and weekly winners",
      action: () => handleNavigate("leaderboard"),
    },
    {
      id: "go-history",
      label: "Go to Match History",
      description: "Review past games and audit proofs",
      action: () => handleNavigate("history"),
    },
    {
      id: "go-rewards",
      label: "Go to Claim Rewards",
      description: "Claim tournament and jackpot prize payouts",
      action: () => handleNavigate("rewards"),
    },
    {
      id: "go-settings",
      label: "Go to Settings",
      description: "System preferences, audio, and auto-verify",
      action: () => handleNavigate("settings"),
    },
    {
      id: "go-terms",
      label: "Go to Terms",
      description: "Terms and conditions of smart contract interaction",
      action: () => handleNavigate("terms"),
    },
    {
      id: "go-privacy",
      label: "Go to Privacy",
      description: "Zero-custody data and privacy policy",
      action: () => handleNavigate("privacy"),
    },
    {
      id: "go-verify",
      label: "Go to Fairness Verifier",
      description: "Cryptographically verify game round proofs",
      action: () => handleNavigate("verify"),
    },
    {
      id: "go-cleanup",
      label: "Go to Cleanup",
      description: "Reclaim locked XLM reserves from inactive subentries",
      action: () => handleNavigate("cleanup"),
    },
    {
      id: "go-about",
      label: "Go to About StellarCade",
      description: "View project mission and 4-repo architecture",
      action: () => handleNavigate("about"),
    },
    {
      id: "go-profile",
      label: "Go to Profile Settings",
      description: "Open the profile settings page",
      action: () => handleNavigate("profile"),
    },
    {
      id: "go-portfolio",
      label: "Go to Portfolio",
      description: "Open wallet, rewards, and collectibles",
      action: () => handleNavigate("portfolio"),
    },
  ];

  return (
    <div className="app-container">
      <CommandPalette commands={commands} />
      <NotificationCenter />

      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="skip-link"
        onClick={(event) => {
          const mainContent = document.getElementById(MAIN_CONTENT_ID);
          if (!mainContent) return;

          event.preventDefault();
          mainContent.focus();
          mainContent.scrollIntoView?.({ block: "start" });
        }}
      >
        Skip to main content
      </a>

      <AppSidebar currentRoute={route} onNavigate={handleNavigate} />

      <div className="app-main-layout">
        <header className="app-header" role="banner">
          <div className="app-header__left">
            <Breadcrumbs />
            <button
              type="button"
              onClick={() => commandStore.dispatch({ type: "COMMAND_PALETTE_OPEN" })}
              className="app-header__search-btn"
              aria-label="Open command palette (⌘K)"
            >
              <Search size={14} style={{ color: "var(--sc-accent, #00ffcc)" }} />
              <span className="app-header__search-placeholder">Quick search...</span>
              <kbd className="app-header__search-kbd">⌘K</kbd>
            </button>
          </div>
          <div className="app-header__actions">
            <HeaderWalletControl />
          </div>
        </header>

        <main className="app-content" id={MAIN_CONTENT_ID} tabIndex={-1}>
          <RouteErrorBoundary>{children}</RouteErrorBoundary>
        </main>

        <footer className="app-footer" role="contentinfo">
          <div className="footer-content">
            <p>{t("footer.copyright", "© 2026 StellarCade. All rights reserved.")}</p>

            <div className="footer-links">
              <a href="/terms">{t("footer.terms", "Terms")}</a>
              <a href="/privacy">{t("footer.privacy", "Privacy")}</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FeatureFlagsProvider>
      <I18nProvider>
        <ModalStackProvider>
          <Suspense fallback={null}>
            <AppShellContent>{children}</AppShellContent>
          </Suspense>
        </ModalStackProvider>
      </I18nProvider>
    </FeatureFlagsProvider>
  );
};

export default AppShell;
