import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppSidebar } from "./AppSidebar";
import { I18nProvider } from "../i18n/provider";

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

function renderSidebar(props: Parameters<typeof AppSidebar>[0]) {
  return render(
    <I18nProvider>
      <AppSidebar {...props} />
    </I18nProvider>,
  );
}

describe("AppSidebar", () => {
  afterEach(() => {
    mockMatchMedia(false);
  });

  it("renders as a single named primary navigation landmark", () => {
    const onNavigate = vi.fn();

    renderSidebar({ currentRoute: "lobby", onNavigate });

    expect(screen.getByRole("navigation", { name: /primary dashboard/i })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: /sidebar navigation/i })).not.toBeInTheDocument();
  });

  it("renders grouped navigation and highlights the active route", () => {
    const onNavigate = vi.fn();

    // AppSidebar's account-settings nav item was renamed profile -> settings
    // (see AppShell's routeToPath) — this was "profile" before that rename.
    renderSidebar({ currentRoute: "settings", onNavigate });

    expect(screen.getByText("Play")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.queryByText("More")).not.toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-settings")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("app-sidebar-link-lobby")).not.toHaveAttribute("aria-current");
    expect(screen.getByTestId("app-sidebar-link-leaderboard")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-quests")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-history")).toBeInTheDocument();
    expect(screen.getByTestId("app-sidebar-link-verify")).toBeInTheDocument();
  });

  it("supports mobile open/close toggle behavior", () => {
    const onNavigate = vi.fn();

    renderSidebar({ currentRoute: "lobby", onNavigate });

    const sidebar = screen.getByTestId("app-sidebar");
    expect(sidebar).not.toHaveClass("is-mobile-open");

    fireEvent.click(screen.getByTestId("app-sidebar-mobile-toggle"));
    expect(sidebar).toHaveClass("is-mobile-open");

    fireEvent.click(screen.getByTestId("app-sidebar-mobile-close"));
    expect(sidebar).not.toHaveClass("is-mobile-open");
  });

  it("supports desktop collapse and calls onNavigate when selecting a route", () => {
    const onNavigate = vi.fn();

    renderSidebar({ currentRoute: "lobby", onNavigate });

    const sidebar = screen.getByTestId("app-sidebar");
    expect(sidebar).not.toHaveClass("is-collapsed");

    fireEvent.click(screen.getByTestId("app-sidebar-collapse-toggle"));
    expect(sidebar).toHaveClass("is-collapsed");

    fireEvent.click(screen.getByTestId("app-sidebar-link-games"));
    expect(onNavigate).toHaveBeenCalledWith("games");
  });

  it("keeps closed mobile navigation out of the focus order until opened", () => {
    mockMatchMedia(true);
    const onNavigate = vi.fn();

    renderSidebar({ currentRoute: "lobby", onNavigate });

    const toggle = screen.getByTestId("app-sidebar-mobile-toggle");
    const sidebar = screen.getByTestId("app-sidebar");

    expect(toggle).toHaveAttribute("aria-controls", "primary-dashboard-navigation");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(sidebar).toHaveAttribute("aria-hidden", "true");
    expect(sidebar).toHaveAttribute("inert");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(sidebar).not.toHaveAttribute("aria-hidden");
    expect(sidebar).not.toHaveAttribute("inert");
  });
});
