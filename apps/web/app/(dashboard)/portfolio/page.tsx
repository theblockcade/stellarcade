"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Portfolio, type PortfolioState } from "../../../src/components/Portfolio";
import { useWalletStatus } from "../../../src/hooks/useWalletStatus";
import { createProfileApiClient } from "../../../src/services/profile-service";

const EMPTY_SECTION = { status: "ready" as const, items: [] };

/**
 * Thin Next route wrapper around the ported Portfolio component. The
 * original app (frontend/src/App.tsx) wired onOpenWallet/onBrowseRewards/
 * onBrowseCollectibles to react-router's useNavigate; here they go through
 * next/navigation's useRouter instead. Portfolio itself stays a plain,
 * router-agnostic component (see MIGRATION.md) so it's independently
 * testable without a routing context.
 *
 * The wallet balance is the one section actually wired to real data —
 * Horizon on-chain balances via GET /wallet/:address/balance. Rewards and
 * collectibles have no backend behind them yet, so they render Portfolio's
 * own honest "nothing yet" empty state rather than fabricated numbers.
 */
export default function PortfolioPage() {
  const router = useRouter();
  const wallet = useWalletStatus();
  const [walletSection, setWalletSection] = useState<PortfolioState["wallet"]>(EMPTY_SECTION);

  useEffect(() => {
    if (!wallet.capabilities.isConnected || !wallet.address) {
      setWalletSection(EMPTY_SECTION);
      return;
    }

    let cancelled = false;
    setWalletSection({ status: "loading", items: [] });

    const client = createProfileApiClient();
    client.getWalletBalance(wallet.address).then((result) => {
      if (cancelled) return;

      if (!result.success) {
        setWalletSection({ status: "error", items: [], errorMessage: result.error.message });
        return;
      }

      const xlm = Number.parseFloat(result.data.balances.XLM ?? "0");
      setWalletSection({
        status: "ready",
        items: [
          {
            availableBalance: Number.isNaN(xlm) ? 0 : xlm,
            networkLabel: wallet.network ?? "Stellar Testnet",
          },
        ],
      });
    });

    return () => {
      cancelled = true;
    };
  }, [wallet.capabilities.isConnected, wallet.address, wallet.network]);

  const state: PortfolioState = {
    wallet: walletSection,
    rewards: EMPTY_SECTION,
    collectibles: EMPTY_SECTION,
  };

  return (
    <Portfolio
      state={state}
      onOpenWallet={() => router.push("/profile")}
      onBrowseRewards={() => router.push("/rewards")}
      onBrowseCollectibles={() => router.push("/quests")}
    />
  );
}
