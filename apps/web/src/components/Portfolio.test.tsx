import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import Portfolio, { type PortfolioState } from "./Portfolio";

// Portfolio was rewritten into a tabbed layout (Balances/Rewards/Badges);
// only one tab's content is in the DOM at a time, so these switch tabs via
// the tab buttons before asserting on that tab's testids — the previous
// version rendered all three sections' states simultaneously.

function renderPortfolio(overrides?: Partial<PortfolioState>) {
  const state: PortfolioState = {
    wallet: {
      status: "ready",
      items: [{ availableBalance: 0, networkLabel: "Testnet wallet" }],
    },
    rewards: {
      status: "ready",
      items: [],
    },
    collectibles: {
      status: "ready",
      items: [],
    },
    ...overrides,
  };

  return render(
    <Portfolio state={state} onOpenWallet={vi.fn()} onBrowseRewards={vi.fn()} onBrowseCollectibles={vi.fn()} />,
  );
}

describe("Portfolio page", () => {
  it("renders the real balance from state, not a hardcoded number", () => {
    renderPortfolio({
      wallet: { status: "ready", items: [{ availableBalance: 24.5, networkLabel: "Mainnet wallet" }] },
    });
    expect(screen.getByTestId("portfolio-wallet-populated")).toHaveTextContent("24.50 XLM");
    expect(screen.getByTestId("portfolio-wallet-populated")).toHaveTextContent("Mainnet wallet");
  });

  it("shows a missing-balance state with an action, not a fabricated balance, when there's no wallet data", () => {
    const onOpenWallet = vi.fn();
    render(
      <Portfolio
        state={{
          wallet: { status: "ready", items: [] },
          rewards: { status: "ready", items: [] },
          collectibles: { status: "ready", items: [] },
        }}
        onOpenWallet={onOpenWallet}
      />,
    );
    expect(screen.getByTestId("portfolio-wallet-missing")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("portfolio-wallet-empty-action-0"));
    expect(onOpenWallet).toHaveBeenCalledTimes(1);
  });

  it("shows a loading state for the active tab while wallet data is loading", () => {
    renderPortfolio({ wallet: { status: "loading", items: [] } });
    expect(screen.getByTestId("portfolio-wallet-loading")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByTestId("portfolio-wallet-populated")).not.toBeInTheDocument();
  });

  it("shows an error state instead of a fallback when the wallet fetch fails", () => {
    renderPortfolio({
      wallet: { status: "error", items: [], errorMessage: "Wallet service unavailable." },
    });
    expect(screen.getByTestId("portfolio-wallet-error")).toHaveTextContent("Wallet service unavailable.");
  });

  it("renders real reward items on the Rewards tab, not fabricated ones", () => {
    renderPortfolio({
      rewards: { status: "ready", items: [{ id: "r1", title: "Daily streak", amountLabel: "12 XLM bonus" }] },
    });
    fireEvent.click(screen.getByTestId("portfolio-tab-rewards"));
    expect(screen.getByTestId("portfolio-rewards-populated")).toHaveTextContent("Daily streak");
    expect(screen.getByTestId("portfolio-rewards-populated")).toHaveTextContent("12 XLM bonus");
  });

  it("shows a real empty state (not invented rewards) when there are none", () => {
    const onBrowseRewards = vi.fn();
    render(
      <Portfolio
        state={{
          wallet: { status: "ready", items: [] },
          rewards: { status: "ready", items: [] },
          collectibles: { status: "ready", items: [] },
        }}
        onBrowseRewards={onBrowseRewards}
      />,
    );
    fireEvent.click(screen.getByTestId("portfolio-tab-rewards"));
    expect(screen.getByTestId("portfolio-rewards-empty")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("portfolio-rewards-empty-action-0"));
    expect(onBrowseRewards).toHaveBeenCalledTimes(1);
  });

  it("renders real badges on the Badges tab, not the three fabricated ones (Early Pioneer etc.)", () => {
    renderPortfolio({
      collectibles: { status: "ready", items: [{ id: "c1", name: "Genesis Blaster", rarity: "Epic" }] },
    });
    fireEvent.click(screen.getByTestId("portfolio-tab-badges"));
    expect(screen.getByTestId("portfolio-collectibles-populated")).toHaveTextContent("Genesis Blaster");
    expect(screen.queryByText("Early Pioneer")).not.toBeInTheDocument();
    expect(screen.queryByText("Provable Auditor")).not.toBeInTheDocument();
    expect(screen.queryByText("Gauntlet Victor")).not.toBeInTheDocument();
  });

  it("shows a real empty state when there are no badges", () => {
    renderPortfolio({ collectibles: { status: "ready", items: [] } });
    fireEvent.click(screen.getByTestId("portfolio-tab-badges"));
    expect(screen.getByTestId("portfolio-collectibles-empty")).toBeInTheDocument();
  });

  it("switches tabs on click", () => {
    renderPortfolio();
    expect(screen.getByTestId("portfolio-wallet-section")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("portfolio-tab-rewards"));
    expect(screen.queryByTestId("portfolio-wallet-section")).not.toBeInTheDocument();
    expect(screen.getByTestId("portfolio-rewards-section")).toBeInTheDocument();
  });
});
