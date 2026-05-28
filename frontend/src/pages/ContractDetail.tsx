import React from "react";
import RecentSurfaceShortcuts, {
  type RecentSurfaceShortcut,
} from "../components/v1/RecentSurfaceShortcuts";

interface ContractDetailProps {
  contractId?: string;
  /**
   * Optional injection point for tests. Production callers can rely on the
   * default no-data state and the hook layer to populate this.
   */
  recentContracts?: RecentSurfaceShortcut[];
}

/**
 * Thin contract detail page — primarily a host for the recent-surface
 * shortcuts pattern (#788). The full contract dashboard lives elsewhere;
 * this surface deliberately keeps a small footprint so the shortcuts
 * component has a real consumer to verify against.
 */
const ContractDetail: React.FC<ContractDetailProps> = ({
  contractId = "contract_unknown",
  recentContracts,
}) => {
  return (
    <section aria-labelledby="contract-detail-heading">
      <header>
        <h1 id="contract-detail-heading">Contract: {contractId}</h1>
      </header>

      <RecentSurfaceShortcuts
        items={recentContracts ?? []}
        surfaceKind="contract"
        emptyMessage="No other contracts visited yet."
      />
    </section>
  );
};

export default ContractDetail;
