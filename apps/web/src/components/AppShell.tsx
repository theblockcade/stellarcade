"use client";

import React, { Suspense, useCallback, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { I18nProvider, useI18n } from "../i18n/provider";
import LocaleSwitcher from "./LocaleSwitcher";
import Breadcrumbs from "./BreadCrumbs";
import { AppSidebar, type AppRoute } from "./AppSidebar";
import NotificationCenter from "./NotificationCenter";
import { ModalStackProvider } from "./modal-stack";
import { FeatureFlagsProvider } from "../services/feature-flags";
import CommandPalette, { type Command } from "./CommandPalette";
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
  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return "profile";
  }
  if (pathname === "/portfolio" || pathname.startsWith("/portfolio/")) {
    return "portfolio";
  }
  if (pathname === "/games" || pathname.startsWith("/games/")) {
    return "games";
  }
  return "lobby";
}

function routeToPath(route: AppRoute): string {
  switch (route) {
    case "profile":
      return "/profile";
    case "portfolio":
      return "/portfolio";
    case "games":
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
          <div className="logo">{t("app.title")}</div>
          <LocaleSwitcher />
        </header>

        <Breadcrumbs />

        <main className="app-content" id={MAIN_CONTENT_ID} tabIndex={-1}>
          <RouteErrorBoundary>{children}</RouteErrorBoundary>
        </main>

        <footer className="app-footer" role="contentinfo">
          <div className="footer-content">
            <p>{t("footer.copyright")}</p>

            <div className="footer-links">
              <a href="/terms">{t("footer.terms")}</a>
              <a href="/privacy">{t("footer.privacy")}</a>
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
