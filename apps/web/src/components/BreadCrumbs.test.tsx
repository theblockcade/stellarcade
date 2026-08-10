import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const { default: Breadcrumbs } = await import("./BreadCrumbs.js");

describe("Breadcrumbs", () => {
  it("always renders a Home crumb", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Breadcrumbs />);
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
  });

  it("renders one crumb per path segment", () => {
    mockUsePathname.mockReturnValue("/games/coin-flip");
    render(<Breadcrumbs />);
    expect(screen.getByRole("link", { name: "games" })).toHaveAttribute("href", "/games");
    expect(screen.getByText("coin flip")).toHaveAttribute("aria-current", "page");
  });

  it("replaces hyphens with spaces in segment labels", () => {
    mockUsePathname.mockReturnValue("/profile/wallet-settings");
    render(<Breadcrumbs />);
    expect(screen.getByText("wallet settings")).toBeInTheDocument();
  });

  it("marks only the last segment as the current page", () => {
    mockUsePathname.mockReturnValue("/a/b/c");
    render(<Breadcrumbs />);
    expect(screen.getByRole("link", { name: "a" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "b" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "c" })).not.toBeInTheDocument();
    expect(screen.getByText("c")).toHaveAttribute("aria-current", "page");
  });
});
