/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import NoResultsStateShell, {
  type NoResultsActiveFilter,
} from "@/components/v1/NoResultsStateShell";

const FILTERS: NoResultsActiveFilter[] = [
  { id: "status", label: "Status", value: "Open" },
  { id: "kind", label: "Kind", value: "Tournament" },
];

describe("NoResultsStateShell (#830)", () => {
  it("renders default title + description when no props are supplied", () => {
    render(<NoResultsStateShell />);
    expect(
      screen.getByText("No matches found")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Adjust your filters or clear them/i)
    ).toBeInTheDocument();
  });

  it("renders the active filter chips with per-filter clear buttons", () => {
    const onClearFilter = vi.fn();
    render(
      <NoResultsStateShell
        filters={FILTERS}
        onClearFilter={onClearFilter}
        onClearAll={() => undefined}
      />
    );
    const clearStatus = screen.getByRole("button", {
      name: "Clear filter: Status",
    });
    expect(clearStatus).toBeInTheDocument();
    fireEvent.click(clearStatus);
    expect(onClearFilter).toHaveBeenCalledWith("status");
  });

  it("suppresses the clear-all button when there are no dismissable filters", () => {
    render(
      <NoResultsStateShell
        filters={[{ id: "locked", label: "Locked", locked: true }]}
        onClearAll={() => undefined}
      />
    );
    expect(screen.queryByText("Clear all filters")).toBeNull();
  });

  it("suppresses the clear-all button when no onClearAll is supplied", () => {
    render(<NoResultsStateShell filters={FILTERS} />);
    expect(screen.queryByText("Clear all filters")).toBeNull();
  });

  it("invokes onClearAll when the primary action is clicked", () => {
    const onClearAll = vi.fn();
    render(
      <NoResultsStateShell
        filters={FILTERS}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear all filters" }));
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  it("respects the disabled prop by hiding the primary action", () => {
    render(
      <NoResultsStateShell
        filters={FILTERS}
        onClearAll={() => undefined}
        disabled
      />
    );
    expect(screen.queryByText("Clear all filters")).toBeNull();
  });

  it("renders a secondary action slot when provided", () => {
    render(
      <NoResultsStateShell
        secondaryAction={<a href="/help">Need help?</a>}
      />
    );
    expect(screen.getByRole("link", { name: "Need help?" })).toBeInTheDocument();
  });

  it("announces itself politely via role=status / aria-live", () => {
    render(<NoResultsStateShell testId="nrs" />);
    const region = screen.getByTestId("nrs");
    expect(region).toHaveAttribute("role", "status");
    expect(region).toHaveAttribute("aria-live", "polite");
  });
});
