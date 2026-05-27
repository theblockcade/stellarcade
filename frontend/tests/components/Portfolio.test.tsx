import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import Portfolio, { type PortfolioState } from "../../src/pages/Portfolio";

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
    <Portfolio
      state={state}
      onOpenWallet={vi.fn()}
      onBrowseRewards={vi.fn()}
      onBrowseCollectibles={vi.fn()}
    />,
  );
}

describe("Portfolio page", () => {
  it("renders distinct empty states for wallet, rewards, and collectibles", () => {
    renderPortfolio();
    expect(screen.getByTestId("portfolio-wallet-empty")).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-wallet-health")).toHaveTextContent(
      "Empty",
    );
    expect(screen.getByTestId("portfolio-rewards-empty")).toBeInTheDocument();
    expect(
      screen.getByTestId("portfolio-collectibles-empty"),
    ).toBeInTheDocument();
  });

  it("does not render empty states while sections are loading", () => {
    renderPortfolio({
      wallet: { status: "loading", items: [] },
      rewards: { status: "loading", items: [] },
      collectibles: { status: "loading", items: [] },
    });

    expect(screen.getByTestId("portfolio-wallet-loading")).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-rewards-loading")).toBeInTheDocument();
    expect(
      screen.getByTestId("portfolio-collectibles-loading"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("portfolio-skeleton-orchestrator"),
    ).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByTestId("portfolio-skeleton-orchestrator"),
    ).toHaveAttribute("data-loading-count", "3");
    expect(
      screen.queryByTestId("portfolio-wallet-empty"),
    ).not.toBeInTheDocument();
  });

  it("keeps ready surfaces visible while another portfolio surface is loading", () => {
    renderPortfolio({
      wallet: { status: "loading", items: [] },
      rewards: {
        status: "ready",
        items: [
          { id: "r1", title: "Daily streak", amountLabel: "12 XLM bonus" },
        ],
      },
    });

    expect(screen.getByTestId("portfolio-wallet-loading")).toBeInTheDocument();
    expect(
      screen.getByTestId("portfolio-rewards-populated"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("portfolio-skeleton-orchestrator"),
    ).toHaveAttribute("data-loading-count", "1");
  });

  it("renders error states instead of empty states when fetches fail", () => {
    renderPortfolio({
      rewards: {
        status: "error",
        items: [],
        errorMessage: "Rewards service unavailable.",
      },
    });

    expect(screen.getByTestId("portfolio-rewards-error")).toHaveTextContent(
      "Rewards service unavailable.",
    );
    expect(
      screen.queryByTestId("portfolio-rewards-empty"),
    ).not.toBeInTheDocument();
  });

  it("renders populated sections when data exists", () => {
    renderPortfolio({
      wallet: {
        status: "ready",
        items: [{ availableBalance: 24.5, networkLabel: "Mainnet wallet" }],
      },
      rewards: {
        status: "ready",
        items: [
          { id: "r1", title: "Daily streak", amountLabel: "12 XLM bonus" },
        ],
      },
      collectibles: {
        status: "ready",
        items: [{ id: "c1", name: "Genesis Blaster", rarity: "Epic" }],
      },
    });

    expect(
      screen.getByTestId("portfolio-wallet-populated"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-wallet-health")).toHaveTextContent(
      "Healthy",
    );
    expect(
      screen.getByTestId("portfolio-rewards-populated"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("portfolio-collectibles-populated"),
    ).toBeInTheDocument();
  });

  it("wires empty-state CTA callbacks", () => {
    const onOpenWallet = vi.fn();
    const onBrowseRewards = vi.fn();
    const onBrowseCollectibles = vi.fn();

    render(
      <Portfolio
        onOpenWallet={onOpenWallet}
        onBrowseRewards={onBrowseRewards}
        onBrowseCollectibles={onBrowseCollectibles}
      />,
    );

    fireEvent.click(screen.getByTestId("portfolio-wallet-empty-action-0"));
    fireEvent.click(screen.getByTestId("portfolio-rewards-empty-action-0"));
    fireEvent.click(screen.getByTestId("portfolio-collectibles-empty-action-0"));

    expect(onOpenWallet).toHaveBeenCalledTimes(1);
    expect(onBrowseRewards).toHaveBeenCalledTimes(1);
    expect(onBrowseCollectibles).toHaveBeenCalledTimes(1);
  });

  it("renders spotlight card and pinned wallet action tray", () => {
    render(
      <Portfolio
        activeCampaignsCount={3}
        onOpenWallet={vi.fn()}
        onBrowseRewards={vi.fn()}
        onBrowseCollectibles={vi.fn()}
      />,
    );

    expect(screen.getByTestId("campaign-rewards-spotlight")).toBeInTheDocument();
    expect(screen.getByTestId("pinned-wallet-action-tray")).toBeInTheDocument();
  });

  it("renders an explicit missing wallet-balance fallback", () => {
    renderPortfolio({
      wallet: {
        status: "ready",
        items: [],
      },
    });

    expect(screen.getByTestId("portfolio-wallet-missing")).toBeInTheDocument();
    expect(screen.getByTestId("portfolio-wallet-health")).toHaveTextContent(
      "Unknown",
    );
  });
});
