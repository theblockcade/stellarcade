import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EmptySearchResults } from "@/components/EmptySearchResults";

describe("EmptySearchResults", () => {
  // -------------------------------------------------------------------------
  // Default rendering
  // -------------------------------------------------------------------------
  it("renders default message when no props provided", () => {
    render(<EmptySearchResults />);
    expect(screen.getByText("No results found")).toBeInTheDocument();
  });

  it("renders query-based message when query is supplied", () => {
    render(<EmptySearchResults query="stellar" />);
    expect(screen.getByText(/No results for "stellar"/)).toBeInTheDocument();
  });

  it("renders custom message overriding the default", () => {
    render(<EmptySearchResults message="Nothing matched your filters" />);
    expect(screen.getByText("Nothing matched your filters")).toBeInTheDocument();
  });

  it("custom message takes precedence over query", () => {
    render(<EmptySearchResults query="foo" message="Custom override" />);
    expect(screen.getByText("Custom override")).toBeInTheDocument();
    expect(screen.queryByText(/No results for/)).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Hint and action
  // -------------------------------------------------------------------------
  it("renders hint text when provided", () => {
    render(<EmptySearchResults hint="Try broader keywords" />);
    expect(screen.getByText("Try broader keywords")).toBeInTheDocument();
  });

  it("does not render hint section when omitted", () => {
    render(<EmptySearchResults />);
    expect(screen.queryByText(/Try/)).not.toBeInTheDocument();
  });

  it("renders action element when provided", () => {
    render(
      <EmptySearchResults
        action={<button type="button">Clear filters</button>}
      />,
    );
    expect(
      screen.getByRole("button", { name: /clear filters/i }),
    ).toBeInTheDocument();
  });

  it("does not render action slot when omitted", () => {
    render(<EmptySearchResults />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------
  it("has role=status for live-region announcement", () => {
    render(<EmptySearchResults />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has aria-live=polite", () => {
    render(<EmptySearchResults />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");
  });

  it("has aria-atomic=true", () => {
    render(<EmptySearchResults />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-atomic", "true");
  });

  it("search icon is aria-hidden", () => {
    render(<EmptySearchResults />);
    const svg = document.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  // -------------------------------------------------------------------------
  // Edge / regression cases
  // -------------------------------------------------------------------------
  it("applies custom className to container", () => {
    render(<EmptySearchResults className="mt-8" />);
    expect(screen.getByRole("status")).toHaveClass("mt-8");
  });

  it("renders without crashing when all props are provided", () => {
    render(
      <EmptySearchResults
        query="nft"
        message="Nothing here"
        hint="Adjust filters"
        action={<button type="button">Reset</button>}
        className="custom"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
    expect(screen.getByText("Adjust filters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });
});
