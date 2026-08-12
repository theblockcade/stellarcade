import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { I18nProvider } from "../i18n/provider";

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const { default: Breadcrumbs } = await import("./BreadCrumbs.js");

function renderBreadcrumbs() {
  return render(
    <I18nProvider>
      <Breadcrumbs />
    </I18nProvider>,
  );
}

describe("Breadcrumbs", () => {
  // Breadcrumbs no longer renders a fixed root "Home" crumb — AppShell's own
  // header already has a "Home" link (see AppShell.tsx), so a second one
  // here would have been a redundant duplicate rather than a real gap.
  it("renders nothing at the root path", () => {
    mockUsePathname.mockReturnValue("/");
    const { container } = renderBreadcrumbs();
    expect(container.querySelector("nav")?.textContent).toBe("");
  });

  it("renders one crumb per path segment, using each route's known label", () => {
    mockUsePathname.mockReturnValue("/games/coin-flip");
    renderBreadcrumbs();
    // "games" is a known route (see ROUTE_KEYS) and renders its label, not
    // the raw segment text.
    expect(screen.getByRole("link", { name: "Games Arena" })).toHaveAttribute("href", "/games");
    expect(screen.getByText("coin flip")).toHaveAttribute("aria-current", "page");
  });

  it("replaces hyphens with spaces in segment labels not found in ROUTE_KEYS", () => {
    mockUsePathname.mockReturnValue("/profile/wallet-settings");
    renderBreadcrumbs();
    // "profile" is a known route -> "Player Profile"; "wallet-settings" is
    // not, so it falls back to hyphen-replaced raw text.
    expect(screen.getByRole("link", { name: "Player Profile" })).toBeInTheDocument();
    expect(screen.getByText("wallet settings")).toBeInTheDocument();
  });

  it("marks only the last segment as the current page", () => {
    mockUsePathname.mockReturnValue("/a/b/c");
    renderBreadcrumbs();
    const a = screen.getByRole("link", { name: "a" });
    const b = screen.getByRole("link", { name: "b" });
    // shadcn's BreadcrumbPage (used for the last segment) is role="link" too
    // — a deliberate a11y pattern for visual/semantic consistency with the
    // clickable crumbs — but it's aria-disabled and has an <a> href,
    // whereas a and b are real navigable links.
    expect(a).toHaveAttribute("href", "/a");
    expect(b).toHaveAttribute("href", "/a/b");
    const current = screen.getByText("c");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveAttribute("aria-disabled", "true");
  });
});
