import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QuestCard } from "./QuestCard";
import type { Quest } from "../types/quest";

const MOCK_QUEST_UNENROLLED: Quest = {
  id: "quest-intro-stellar",
  title: "Stellar Novice Challenge",
  description: "Play 3 coin flip rounds and verify fairness proofs.",
  enrolled: false,
  totalXpReward: 150,
  estimatedTime: "5 mins",
  category: "beginner",
  milestones: [
    { id: "m1", title: "Play Round 1", description: "Place a flip bet", completed: false },
    { id: "m2", title: "Verify Proof", description: "Recompute commit hash", completed: false },
  ],
};

const MOCK_QUEST_ENROLLED_COMPLETE: Quest = {
  id: "quest-champion",
  title: "Tournament Champion",
  description: "Win 5 tournament matches.",
  enrolled: true,
  totalXpReward: 500,
  estimatedTime: "20 mins",
  category: "advanced",
  milestones: [
    { id: "m1", title: "Match 1", description: "Victory", completed: true },
    { id: "m2", title: "Match 2", description: "Victory", completed: true },
  ],
};

describe("QuestCard", () => {
  it("renders unenrolled quest card with enroll button", () => {
    const onEnroll = vi.fn();
    render(<QuestCard quest={MOCK_QUEST_UNENROLLED} onEnroll={onEnroll} />);

    expect(screen.getByText("Stellar Novice Challenge")).toBeInTheDocument();
    expect(screen.getByText("150 XP")).toBeInTheDocument();
    const enrollBtn = screen.getByTestId("quest-enroll-btn");
    fireEvent.click(enrollBtn);
    expect(onEnroll).toHaveBeenCalled();
  });

  it("renders enrolled complete quest with claim button", () => {
    const onClaim = vi.fn();
    render(
      <QuestCard quest={MOCK_QUEST_ENROLLED_COMPLETE} onClaimCertificate={onClaim} />
    );

    expect(screen.getByText("Tournament Champion")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    const claimBtn = screen.getByTestId("quest-claim-certificate-btn");
    fireEvent.click(claimBtn);
    expect(onClaim).toHaveBeenCalled();
  });
});
