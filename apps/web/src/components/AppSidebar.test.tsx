import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AppSidebar } from "./AppSidebar";
import { I18nProvider } from "../i18n/provider";
import { SidebarProvider } from "./ui/sidebar";

/**
 * AppSidebar now renders on shadcn/ui's Sidebar primitive, which requires a
 * SidebarProvider ancestor (it calls useSidebar() internally) — the mobile
 * offcanvas sheet, icon-collapse, and ⌘/Ctrl+B shortcut all live in that
 * primitive and are exercised together with the navbar's SidebarTrigger in
 * AppShell.test.tsx instead of in isolation here.
 */
function renderSidebar(props: Parameters<typeof AppSidebar>[0]) {
  return render(
    <I18nProvider>
      <SidebarProvider>
        <AppSidebar {...props} />
      </SidebarProvider>
    </I18nProvider>,
  );
}

describe("AppSidebar", () => {
  it("renders as a single named primary navigation landmark", () => {
    const onNavigate = vi.fn();

    renderSidebar({ currentRoute: "lobby", onNavigate });

    expect(screen.getByRole("navigation", { name: /primary dashboard/i })).toBeInTheDocument();
  });

  it("renders grouped navigation and highlights the active route", () => {
    const onNavigate = vi.fn();

    // AppSidebar's account-settings nav item was renamed profile -> settings
    // (see AppShell's routeToPath) — this was "profile" before that rename.
    renderSidebar({ currentRoute: "settings", onNavigate });

    expect(screen.getByText("Play")).toBeInTheDocument();
    expect(screen.getByText("Compete")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.queryByText("More")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-settings")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("app-sidebar-link-lobby")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("app-sidebar-link-leaderboard")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-quests")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-history")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-verify")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-tournaments")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-rewards")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-cleanup")).toBeInTheDocument();
  });

  it("calls onNavigate when a nav item is selected", () => {
    const onNavigate = vi.fn();

    renderSidebar({ currentRoute: "lobby", onNavigate });

    fireEvent.click(screen.getByTestId("app-sidebar-link-games"));
    expect(onNavigate).toHaveBeenCalledWith("games");
  });

  it("navigates to profile, portfolio, and settings from the account menu", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();

    renderSidebar({ currentRoute: "lobby", onNavigate });

    await user.click(screen.getByTestId("sidebar-profile-card"));
    await user.click(await screen.findByText("Portfolio"));
    expect(onNavigate).toHaveBeenCalledWith("portfolio");
  });

  it("clicking the brand navigates to the lobby", () => {
    const onNavigate = vi.fn();

    renderSidebar({ currentRoute: "settings", onNavigate });

    fireEvent.click(screen.getByTestId("app-sidebar-brand"));
    expect(onNavigate).toHaveBeenCalledWith("lobby");
  });
});
