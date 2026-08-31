import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { DuelChallengePopup } from "./DuelChallengePopup";
import type { DuelChallengePopupProps } from "./types";

afterEach(() => cleanup());

function makeProps(overrides: Partial<DuelChallengePopupProps> = {}) {
  return {
    challenger: { username: "StarFighter99", winRate: 0.72, level: 14 },
    gameTitle: "Coin Flip Showdown",
    stakeAmountXlm: 25,
    expiresInSeconds: 30,
    onAccept: vi.fn(),
    onDecline: vi.fn(),
    ...overrides,
  };
}

describe("DuelChallengePopup", () => {
  it("renders popup with backdrop", () => {
    render(<DuelChallengePopup {...makeProps()} />);
    expect(screen.getByTestId("duel-popup-backdrop")).toBeTruthy();
    expect(screen.getByTestId("duel-popup")).toBeTruthy();
  });

  it("shows challenger username", () => {
    render(<DuelChallengePopup {...makeProps()} />);
    expect(screen.getByTestId("challenger-username").textContent).toBe("StarFighter99");
  });

  it("shows game title", () => {
    render(<DuelChallengePopup {...makeProps()} />);
    expect(screen.getByTestId("game-title").textContent).toBe("Coin Flip Showdown");
  });

  it("shows stake amount when provided", () => {
    render(<DuelChallengePopup {...makeProps()} />);
    expect(screen.getByTestId("stake-amount").textContent).toContain("25");
  });

  it("shows challenger level and win rate", () => {
    render(<DuelChallengePopup {...makeProps()} />);
    expect(screen.getByTestId("challenger-level").textContent).toContain("14");
    expect(screen.getByTestId("challenger-winrate").textContent).toContain("72%");
  });

  it("shows avatar placeholder when no avatarUrl", () => {
    render(<DuelChallengePopup {...makeProps()} />);
    expect(screen.getByTestId("challenger-avatar-placeholder")).toBeTruthy();
  });

  it("shows avatar img when avatarUrl provided", () => {
    render(
      <DuelChallengePopup
        {...makeProps({ challenger: { username: "X", avatarUrl: "https://example.com/avatar.png" } })}
      />
    );
    expect(screen.getByTestId("challenger-avatar")).toBeTruthy();
  });

  it("shows expiry timer when pending", () => {
    render(<DuelChallengePopup {...makeProps()} />);
    expect(screen.getByTestId("expiry-timer")).toBeTruthy();
  });

  it("calls onAccept when Accept button clicked in pending state", () => {
    const onAccept = vi.fn();
    render(<DuelChallengePopup {...makeProps({ onAccept })} />);
    fireEvent.click(screen.getByTestId("btn-accept"));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("calls onDecline when Decline button clicked in pending state", () => {
    const onDecline = vi.fn();
    render(<DuelChallengePopup {...makeProps({ onDecline })} />);
    fireEvent.click(screen.getByTestId("btn-decline"));
    expect(onDecline).toHaveBeenCalledTimes(1);
  });

  it("disables action buttons when status is accepted", () => {
    render(<DuelChallengePopup {...makeProps({ status: "accepted" })} />);
    expect(screen.getByTestId("btn-accept")).toBeDisabled();
    expect(screen.getByTestId("btn-decline")).toBeDisabled();
  });

  it("disables action buttons when status is declined", () => {
    render(<DuelChallengePopup {...makeProps({ status: "declined" })} />);
    expect(screen.getByTestId("btn-accept")).toBeDisabled();
  });

  it("shows status message for accepted", () => {
    render(<DuelChallengePopup {...makeProps({ status: "accepted" })} />);
    expect(screen.getByTestId("duel-status").textContent).toContain("Accepted");
  });

  it("shows status message for declined", () => {
    render(<DuelChallengePopup {...makeProps({ status: "declined" })} />);
    expect(screen.getByTestId("duel-status").textContent).toContain("Declined");
  });

  it("shows status message for expired", () => {
    render(<DuelChallengePopup {...makeProps({ status: "expired" })} />);
    expect(screen.getByTestId("duel-status").textContent).toContain("Expired");
  });

  it("renders close button and calls onClose when clicked", () => {
    const onClose = vi.fn();
    render(<DuelChallengePopup {...makeProps({ onClose })} />);
    fireEvent.click(screen.getByTestId("btn-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render close button when onClose not provided", () => {
    render(<DuelChallengePopup {...makeProps()} />);
    expect(screen.queryByTestId("btn-close")).toBeNull();
  });
});
