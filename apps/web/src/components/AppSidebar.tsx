"use client";

import React from "react";
import Image from "next/image";
import {
  User,
  Gamepad2,
  Settings,
  Dices,
  Flame,
  Award,
  Sparkles,
  History,
  ShieldCheck,
  Wallet,
  ChevronsUpDown,
  Trophy,
  Gift,
  Wrench,
} from "lucide-react";
import { useWalletStatus } from "../hooks/useWalletStatus";
import { useI18n } from "../i18n/provider";
import { profileStore } from "./ProfileSettings";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback } from "./ui/avatar";

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
      { route: "lobby", labelKey: "nav.lobby", defaultLabel: "Arcade Lobby", icon: <Gamepad2 /> },
      { route: "games", labelKey: "nav.games", defaultLabel: "Games Arena", icon: <Dices /> },
      { route: "history", labelKey: "nav.history", defaultLabel: "Match History", icon: <History /> },
    ],
  },
  {
    id: "compete",
    titleKey: "section.compete",
    defaultTitle: "Compete",
    items: [
      { route: "tournaments", labelKey: "nav.tournaments", defaultLabel: "Tournaments", icon: <Trophy /> },
      { route: "leaderboard", labelKey: "nav.leaderboard", defaultLabel: "Leaderboard", icon: <Flame /> },
      { route: "quests", labelKey: "nav.quests", defaultLabel: "Quests & Badges", icon: <Award /> },
      { route: "rewards", labelKey: "nav.rewards", defaultLabel: "Claim Rewards", icon: <Gift /> },
    ],
  },
  {
    id: "tools",
    titleKey: "section.tools",
    defaultTitle: "Tools",
    items: [
      { route: "verify", labelKey: "nav.verify", defaultLabel: "Fairness Verifier", icon: <ShieldCheck /> },
      { route: "cleanup", labelKey: "nav.cleanup", defaultLabel: "Cleanup", icon: <Wrench /> },
    ],
  },
  {
    id: "account",
    titleKey: "section.account",
    defaultTitle: "Account",
    items: [
      { route: "profile", labelKey: "nav.profile", defaultLabel: "Profile", icon: <User /> },
      { route: "settings", labelKey: "nav.settings", defaultLabel: "Settings", icon: <Settings /> },
    ],
  },
];

/**
 * Rebuilt on shadcn/ui's Sidebar primitive (`collapsible="icon"`,
 * `variant="inset"`) instead of a hand-rolled `isCollapsed`/`isMobileOpen`
 * state machine plus a matching AppSidebar.css. Icon-collapse, the
 * offcanvas mobile sheet, the ⌘/Ctrl+B shortcut, and per-item tooltips when
 * collapsed all come from the primitive itself now — this file only
 * supplies StellarCade's actual nav structure and branding.
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({ currentRoute, onNavigate }) => {
  const { t } = useI18n();
  const wallet = useWalletStatus();

  const [profile, setProfile] = React.useState(() => profileStore.selectProfile());
  React.useEffect(() => {
    return profileStore.subscribe(() => {
      setProfile(profileStore.selectProfile());
    });
  }, []);

  // Prevents hydration mismatch: SSR always renders the guest/disconnected
  // view, then the client switches to the real wallet/profile state after
  // mount (same pattern as HeaderWalletControl).
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isConnected = mounted && wallet.capabilities.isConnected;
  const profileDisplayName = mounted && profile?.username
    ? profile.username
    : mounted && wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : t("common.guest_player", "Guest Player");
  const initials = profileDisplayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar
      collapsible="icon"
      variant="inset"
      role="navigation"
      aria-label="Primary dashboard"
      data-testid="app-sidebar"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={() => onNavigate("lobby")}
              data-testid="app-sidebar-brand"
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <div className="flex aspect-square size-9 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 shadow-sm">
                <Image
                  src="/favicon-logo.webp"
                  alt="StellarCade Logo"
                  width={36}
                  height={36}
                  className="rounded-lg object-contain"
                />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-bold tracking-tight text-foreground">
                  StellarCade
                </span>
                <span className="truncate text-[11px] text-muted-foreground">
                  {t("common.tagline", "Provably-fair arcade")}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {SECTION_CONFIGS.map((section) => (
          <SidebarGroup key={section.id}>
            <SidebarGroupLabel className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">
              {t(section.titleKey, section.defaultTitle)}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive = item.route === currentRoute;
                  const label = t(item.labelKey, item.defaultLabel);
                  return (
                    <SidebarMenuItem key={item.route}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={label}
                        onClick={() => onNavigate(item.route)}
                        aria-current={isActive ? "page" : undefined}
                        data-testid={`app-sidebar-link-${item.route}`}
                        className="data-[active=true]:bg-primary/12 data-[active=true]:font-semibold data-[active=true]:text-primary data-[active=true]:[&_svg]:text-primary"
                      >
                        {item.icon}
                        <span>{label}</span>
                        {/* Active-state marker: colour alone shouldn't be the
                            only cue for which route you're on. */}
                        {isActive ? (
                          <span
                            className="ml-auto h-4 w-0.5 rounded-full bg-primary group-data-[collapsible=icon]:hidden"
                            aria-hidden
                          />
                        ) : null}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  data-testid="sidebar-profile-card"
                  className="border border-border/60 bg-background/40"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-linear-to-br from-teal-400 to-blue-500 font-bold text-black">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight">
                    <span className="truncate text-sm font-semibold">{profileDisplayName}</span>
                    <span className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                      {isConnected && (
                        <span className="size-1.5 shrink-0 rounded-full bg-emerald-400" />
                      )}
                      {isConnected
                        ? t("common.connected", "Connected")
                        : t("common.view_profile", "View Profile")}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>{t("common.my_account", "My Account")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate("profile")}>
                  <User /> {t("nav.profile", "Profile")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("portfolio")}>
                  <Wallet /> {t("nav.portfolio", "Portfolio")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("settings")}>
                  <Settings /> {t("nav.settings", "Settings")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
