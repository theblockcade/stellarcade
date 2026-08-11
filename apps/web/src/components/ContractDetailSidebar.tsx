"use client";

import React, { useState, useEffect } from "react";
import { RelatedRecordActionRow, type RelatedRecordAction } from "./RelatedRecordActionRow";
import "./ContractDetailSidebar.css";

interface RelatedContract {
  id: string;
  title: string;
  subtitle: string;
  status: "active" | "locked" | "pending";
}

interface ContractDetailSidebarProps {
  contractId: string;
  className?: string;
  testId?: string;
}

export const ContractDetailSidebar: React.FC<ContractDetailSidebarProps> = ({
  contractId,
  className = "",
  testId = "contract-detail-sidebar",
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [relatedContracts, setRelatedContracts] = useState<RelatedContract[]>([]);

  useEffect(() => {
    // Immediate mock for test/initial render
    setRelatedContracts([
      {
        id: "1",
        title: "Coin Flip V1",
        subtitle: "Active • Last updated 2h ago",
        status: "active",
      },
      {
        id: "2",
        title: "Coin Flip V2",
        subtitle: "Locked • Awaiting arbiter signature",
        status: "locked",
      },
      {
        id: "3",
        title: "PrizePool Multi-Asset",
        subtitle: "Pending • Draft state",
        status: "pending",
      },
    ]);
  }, [contractId]);

  const getActionsForContract = (contract: RelatedContract): RelatedRecordAction[] => {
    const baseActions: RelatedRecordAction[] = [
      {
        label: "View",
        onClick: () => console.log("View", contract.id),
        testId: `contract-${contract.id}-view`,
        variant: "primary",
      },
    ];

    if (contract.status === "active") {
      baseActions.push({
        label: "Edit",
        onClick: () => console.log("Edit", contract.id),
        testId: `contract-${contract.id}-edit`,
      });
    }

    return baseActions;
  };

  return (
    <div className={`contract-detail-sidebar ${className}`} data-testid={testId}>
      <div className="contract-detail-sidebar__header">
        <h3 className="contract-detail-sidebar__title">Related Contracts</h3>
        <span className="contract-detail-sidebar__count">{relatedContracts.length}</span>
      </div>

      <div className="contract-detail-sidebar__content">
        {relatedContracts.length === 0 ? (
          <RelatedRecordActionRow
            id="empty"
            title="No related contracts"
            isEmpty
            emptyMessage="No related contracts found for this contract"
          />
        ) : (
          relatedContracts.map((contract) => (
            <RelatedRecordActionRow
              key={contract.id}
              id={contract.id}
              title={contract.title}
              subtitle={contract.subtitle}
              actions={getActionsForContract(contract)}
              disabled={contract.status === "locked"}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ContractDetailSidebar;
