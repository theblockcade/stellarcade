import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import { CampaignRewardsSpotlightCard } from "../../../src/components/v1/CampaignRewardsSpotlightCard";

describe("CampaignRewardsSpotlightCard", () => {
  it("renders active campaign and rewards copy", () => {
    render(
      <CampaignRewardsSpotlightCard
        activeCampaigns={4}
        pendingRewardsLabel="18 claims"
      />,
    );

    expect(screen.getByTestId("campaign-rewards-spotlight")).toBeInTheDocument();
    expect(
      screen.getByText((_, element) =>
        element?.textContent === "4 running campaigns • 18 claims pending rewards",
      ),
    ).toBeInTheDocument();
  });

  it("handles empty campaign state", () => {
    render(
      <CampaignRewardsSpotlightCard
        activeCampaigns={0}
        pendingRewardsLabel="0 claims"
      />,
    );
    expect(screen.getByText("No active campaigns")).toBeInTheDocument();
  });

  it("fires action callbacks", () => {
    const onViewCampaigns = vi.fn();
    const onClaimRewards = vi.fn();
    render(
      <CampaignRewardsSpotlightCard
        activeCampaigns={1}
        pendingRewardsLabel="2 claims"
        onViewCampaigns={onViewCampaigns}
        onClaimRewards={onClaimRewards}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "View campaigns" }));
    fireEvent.click(screen.getByRole("button", { name: "Claim rewards" }));

    expect(onViewCampaigns).toHaveBeenCalledTimes(1);
    expect(onClaimRewards).toHaveBeenCalledTimes(1);
  });
});
