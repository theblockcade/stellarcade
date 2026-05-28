import {
  Holding,
  HoldingsBreakdownCard,
} from "@/components/HoldingsBreakDowncard";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

const SAMPLE: Holding[] = [
  { id: "xlm", label: "XLM", amount: 5000, valueUsd: 250 },
  { id: "usdc", label: "USDC", amount: 1000, valueUsd: 1000 },
  { id: "btc", label: "BTC", amount: 0.01, valueUsd: 600 },
];

describe("HoldingsBreakdownCard", () => {
  // -------------------------------------------------------------------------
  // Render states
  // -------------------------------------------------------------------------
  it("renders the title", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} title="My Portfolio" />);
    expect(
      screen.getByRole("region", { name: /my portfolio/i }),
    ).toBeInTheDocument();
  });

  it("renders a row per holding", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} />);
    expect(screen.getByText("XLM")).toBeInTheDocument();
    expect(screen.getByText("USDC")).toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
  });

  it("renders the stacked distribution bar", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} />);
    expect(
      screen.getByRole("img", { name: /holdings distribution bar/i }),
    ).toBeInTheDocument();
  });

  it("renders fiat values when holdings have valueUsd", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} />);
    // Total = 1850
    expect(screen.getByLabelText(/total value/i)).toHaveTextContent(
      "$1,850.00",
    );
  });

  it("renders fiat column per row", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} />);
    expect(screen.getByText("$250.00")).toBeInTheDocument();
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
  });

  it("hides fiat column when showFiatValues=false", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} showFiatValues={false} />);
    expect(screen.queryByText("Value")).not.toBeInTheDocument();
  });

  it("shows percentage share per holding", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} />);
    // XLM is 5000/6000.01 ≈ 83.3%
    const badges = screen.getAllByText(/%/);
    expect(badges.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------
  it("renders empty state when holdings array is empty", () => {
    render(<HoldingsBreakdownCard holdings={[]} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no holdings/i);
  });

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------
  it("renders loading skeleton", () => {
    render(<HoldingsBreakdownCard holdings={[]} isLoading />);
    expect(screen.getByLabelText(/loading holdings/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("does not render a table while loading", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} isLoading />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Error state
  // -------------------------------------------------------------------------
  it("renders error message", () => {
    render(
      <HoldingsBreakdownCard
        holdings={[]}
        error="Failed to load wallet data"
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/failed to load/i);
  });

  it("does not render a table when error is set", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} error="Oops" />);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------
  it("table has accessible label", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} title="Wallet" />);
    expect(
      screen.getByRole("table", { name: /wallet breakdown/i }),
    ).toBeInTheDocument();
  });

  it("total badge has an accessible label with the formatted amount", () => {
    render(<HoldingsBreakdownCard holdings={SAMPLE} />);
    expect(
      screen.getByLabelText(/total value \$1,850\.00/i),
    ).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Custom currency symbol
  // -------------------------------------------------------------------------
  it("uses custom currency symbol", () => {
    render(
      <HoldingsBreakdownCard
        holdings={[
          { id: "eth", label: "ETH", amount: 1, valueUsd: 3000 },
          { id: "btc", label: "BTC", amount: 0.5, valueUsd: 20000 },
        ]}
        currencySymbol="€"
      />,
    );
    expect(screen.getByLabelText(/total value €23,000\.00/i)).toBeInTheDocument();
    expect(screen.getAllByText("€23,000.00").length).toBeGreaterThanOrEqual(1);
  });

  // -------------------------------------------------------------------------
  // Edge / regression
  // -------------------------------------------------------------------------
  it("does not crash for single holding", () => {
    render(
      <HoldingsBreakdownCard
        holdings={[{ id: "sol", label: "SOL", amount: 100 }]}
      />,
    );
    expect(screen.getByText("SOL")).toBeInTheDocument();
  });

  it("renders holding with zero amount without division errors", () => {
    const holdings: Holding[] = [
      { id: "a", label: "Token A", amount: 0 },
      { id: "b", label: "Token B", amount: 0 },
    ];
    render(<HoldingsBreakdownCard holdings={holdings} />);
    // Should render 0.0% for both — no NaN
    const pcts = screen.getAllByText("0.0%");
    expect(pcts.length).toBe(2);
  });
});
