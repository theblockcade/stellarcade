/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import {
  ExpandableMetricsBlock,
  type Metric,
} from "@/components/v1/ExpandableMetricsBlock";

const primary: Metric[] = [
  { id: "tvl", label: "Total locked", value: "1,200 XLM" },
  { id: "players", label: "Players", value: 42 },
];

const expanded: Metric[] = [
  { id: "fees", label: "Fees (24h)", value: "12 XLM" },
  { id: "txns", label: "Transactions", value: 318, hint: "last 24h" },
];

describe("ExpandableMetricsBlock", () => {
  it("always renders the primary metrics", () => {
    render(
      <ExpandableMetricsBlock title="Vault" primaryMetrics={primary} />,
    );
    expect(screen.getByText("Total locked")).toBeInTheDocument();
    expect(screen.getByText("1,200 XLM")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("hides expanded metrics until toggled and reflects aria-expanded", () => {
    const onToggle = vi.fn();
    render(
      <ExpandableMetricsBlock
        title="Vault"
        primaryMetrics={primary}
        expandedMetrics={expanded}
        onToggle={onToggle}
      />,
    );

    // Collapsed by default.
    expect(screen.queryByText("Fees (24h)")).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /show 2 more/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(onToggle).toHaveBeenCalledWith(true);
    expect(screen.getByText("Fees (24h)")).toBeInTheDocument();
    expect(screen.getByText("last 24h")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /show less/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("does not render a toggle when there are no expanded metrics", () => {
    render(
      <ExpandableMetricsBlock title="Vault" primaryMetrics={primary} />,
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders skeletons while loading", () => {
    render(
      <ExpandableMetricsBlock
        title="Vault"
        primaryMetrics={primary}
        loading
      />,
    );
    expect(screen.getByRole("status", { name: /loading metrics/i })).toBeInTheDocument();
    expect(screen.getAllByTestId("metric-skeleton").length).toBeGreaterThan(0);
    // Real values are not shown while loading.
    expect(screen.queryByText("1,200 XLM")).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no metrics", () => {
    render(
      <ExpandableMetricsBlock
        title="Vault"
        primaryMetrics={[]}
        emptyMessage="Nothing to show yet"
      />,
    );
    expect(screen.getByText("Nothing to show yet")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("disables the toggle when disabled", () => {
    render(
      <ExpandableMetricsBlock
        title="Vault"
        primaryMetrics={primary}
        expandedMetrics={expanded}
        disabled
      />,
    );
    const toggle = screen.getByRole("button");
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    // Stays collapsed.
    expect(screen.queryByText("Fees (24h)")).not.toBeInTheDocument();
  });
});
