import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const { default: PortfolioPage } = await import("./page.js");

describe("PortfolioPage", () => {
  it("renders the Portfolio component", () => {
    render(<PortfolioPage />);
    // Portfolio's own root testid is "portfolio-view" — "portfolio-page"
    // never existed on the component, so this always failed.
    expect(screen.getByTestId("portfolio-view")).toBeInTheDocument();
  });
});
