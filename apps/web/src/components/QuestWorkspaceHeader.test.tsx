import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QuestWorkspaceHeader } from "./QuestWorkspaceHeader";
import type { Quest, QuestProgress } from "../types/quest";

const MOCK_ACTIVE_QUEST: Quest = {
  id: "active-quest-1",
  title: "Soroban Security Explorer",
  description: "Explore smart contract state and auth guards.",
  enrolled: true,
  category: "advanced",
  milestones: [],
};

const MOCK_PROGRESS_COMPLETE: QuestProgress = {
  completedMilestones: 4,
  totalMilestones: 4,
  percentage: 100,
  isComplete: true,
};

describe("QuestWorkspaceHeader", () => {
  it("renders active quest title and certificate claim when complete", () => {
    const onClaim = vi.fn();
    const onBack = vi.fn();

    render(
      <QuestWorkspaceHeader
        activeQuest={MOCK_ACTIVE_QUEST}
        progress={MOCK_PROGRESS_COMPLETE}
        onClaimCertificate={onClaim}
        onBack={onBack}
      />
    );

    expect(screen.getByText("Soroban Security Explorer")).toBeInTheDocument();
    expect(screen.getByText("Quest Complete!")).toBeInTheDocument();
    const claimBtn = screen.getByTestId("quest-workspace-claim-btn");
    fireEvent.click(claimBtn);
    expect(onClaim).toHaveBeenCalled();

    const backBtn = screen.getByTestId("quest-workspace-back-btn");
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalled();
  });
});
