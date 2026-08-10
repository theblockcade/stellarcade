import React from "react";
import { StatusPill } from "./StatusPill";
import "./CampaignRewardsSpotlightCard.css";

export interface CampaignRewardsSpotlightCardProps {
  activeCampaigns: number;
  pendingRewardsLabel: string;
  onViewCampaigns?: () => void;
  onClaimRewards?: () => void;
  testId?: string;
}

export const CampaignRewardsSpotlightCard: React.FC<
  CampaignRewardsSpotlightCardProps
> = ({
  activeCampaigns,
  pendingRewardsLabel,
  onViewCampaigns,
  onClaimRewards,
  testId = "campaign-rewards-spotlight",
}) => {
  const hasCampaigns = activeCampaigns > 0;
  return (
    <section className="campaign-rewards-spotlight" data-testid={testId}>
      <div className="campaign-rewards-spotlight__header">
        <h2>Campaign Spotlight</h2>
        <StatusPill
          tone={hasCampaigns ? "success" : "neutral"}
          label={hasCampaigns ? "Active campaigns" : "No active campaigns"}
          size="compact"
        />
      </div>

      <p className="campaign-rewards-spotlight__metrics">
        <strong>{activeCampaigns}</strong> running campaign
        {activeCampaigns === 1 ? "" : "s"} • <span>{pendingRewardsLabel}</span>{" "}
        pending rewards
      </p>

      <div className="campaign-rewards-spotlight__actions">
        <button type="button" onClick={onViewCampaigns}>
          View campaigns
        </button>
        <button type="button" onClick={onClaimRewards}>
          Claim rewards
        </button>
      </div>
    </section>
  );
};

export default CampaignRewardsSpotlightCard;
