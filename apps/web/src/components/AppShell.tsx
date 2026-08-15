"use client";

import React, { Suspense, useCallback, useEffect, useMemo } from "react";
import Image from "next/image";
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
import { useWalletStatus } from "../hooks/useWalletStatus";
import { useProfile } from "../hooks/useProfile";
import { ProfileOnboardingDialog } from "./ProfileOnboardingDialog";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";

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
 *
 * Shell chrome (sidebar + navbar) is built entirely on shadcn/ui's Sidebar
 * primitive and Tailwind utility classes bound to @stellarcade/tokens via
 * globals.css — there is no AppShell.css/AppSidebar.css anymore. Everything
 * below the navbar (route content) is unchanged.
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
  const walletStatus = useWalletStatus();

  /*
   * Profile sync now goes through useProfile/profile-service rather than an
   * ApiClient built inline here. The old inline client passed neither a
   * session token nor the wallet address, so this sync silently failed on
   * every route — the sidebar only ever showed a username after the user
   * visited /profile, which was the one place that built an authenticated
   * client. Sharing one store also means a rename on /profile repaints the
   * sidebar immediately instead of on next reload.
   */
  const { needsOnboarding: profileNeedsOnboarding, refresh: refreshProfile } = useProfile();

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
    <SidebarProvider>
      <CommandPalette commands={commands} />
      <NotificationCenter />

      {/* A wallet with no profile has to choose a username and confirm it is
          18+ before using the app; the app must not pick either for them. */}
      <ProfileOnboardingDialog
        open={profileNeedsOnboarding}
        onCompleted={() => void refreshProfile()}
      />

      <a
        href={`#${MAIN_CONTENT_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:font-bold focus:text-primary-foreground"
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

      <SidebarInset>
        {/*
          Header chrome sits one step up the surface ramp (bg-chrome), not on
          --background: painted the page's own colour it read as an invisible
          strip with a hairline rather than as a bar. The old left cluster —
          trigger │ "PLAYER WORKSPACE" │ breadcrumbs — spent its best space on
          a label that told the user nothing; the trigger and breadcrumbs
          carry it alone now.
        */}
        <header
          className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-4 border-b border-border/60 bg-chrome px-3 backdrop-blur-xl sm:px-4"
          role="banner"
        >
          <div className="flex min-w-0 items-center gap-2">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-4 opacity-60" />
            <Breadcrumbs />
          </div>

          <div className="hidden min-w-0 flex-1 justify-center lg:flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => commandStore.dispatch({ type: "COMMAND_PALETTE_OPEN" })}
              className="w-full max-w-md justify-start gap-2 rounded-full border border-border/60 bg-background/40 text-xs font-normal text-muted-foreground hover:border-primary/40 hover:bg-background/60"
              aria-label="Open command palette (Control or Command K)"
            >
              <Search className="size-3.5" />
              <span className="flex-1 text-left">Search actions, routes, and tools…</span>
              <kbd className="rounded border border-border bg-foreground/5 px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                ⌘K
              </kbd>
            </Button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Small screens lose the centred palette bar, so the shortcut
                needs its own affordance rather than vanishing entirely. */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground lg:hidden"
              onClick={() => commandStore.dispatch({ type: "COMMAND_PALETTE_OPEN" })}
              aria-label="Open command palette"
            >
              <Search />
            </Button>
            <HeaderWalletControl />
          </div>
        </header>

        <main
          className="mx-auto w-full max-w-350 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8"
          id={MAIN_CONTENT_ID}
          tabIndex={-1}
        >
          <RouteErrorBoundary>{children}</RouteErrorBoundary>
        </main>

        <footer className="border-t border-border px-4 py-4 text-xs text-muted-foreground sm:px-6 lg:px-8" role="contentinfo">
          <div className="mx-auto flex max-w-350 flex-col items-center justify-between gap-3 sm:flex-row">
            <p>{t("footer.copyright", "© 2026 StellarCade. All rights reserved.")}</p>

            <div className="flex items-center gap-4 font-semibold">
              <a href="/about" className="transition-colors hover:text-primary">{t("footer.about", "About")}</a>
              <a href="/terms" className="transition-colors hover:text-primary">{t("footer.terms", "Terms")}</a>
              <a href="/privacy" className="transition-colors hover:text-primary">{t("footer.privacy", "Privacy")}</a>
            </div>
          </div>
        </footer>
      </SidebarInset>
    </SidebarProvider>
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
