"use client";

import { useRouter } from "next/navigation";
import { Portfolio } from "../../../src/components/Portfolio";

/**
 * Thin Next route wrapper around the ported Portfolio component. The
 * original app (frontend/src/App.tsx) wired onOpenWallet/onBrowseRewards/
 * onBrowseCollectibles to react-router's useNavigate; here they go through
 * next/navigation's useRouter instead. Portfolio itself stays a plain,
 * router-agnostic component (see MIGRATION.md) so it's independently
 * testable without a routing context.
 */
export default function PortfolioPage() {
  const router = useRouter();

  return (
    <Portfolio
      onOpenWallet={() => router.push("/profile")}
      onBrowseRewards={() => router.push("/rewards")}
      onBrowseCollectibles={() => router.push("/quests")}
    />
  );
}
