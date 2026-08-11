import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { RestartFlowPrompt } from "./RestartFlowPrompt";

describe("RestartFlowPrompt", () => {
  it("renders restart prompt and dispatches decisions", () => {
    const onDecision = vi.fn();
    render(
      <RestartFlowPrompt
        open={true}
        flowLabel="Wager Deposit"
        lastStepLabel="Approve Allowance"
        onDecision={onDecision}
      />
    );

    expect(screen.getByText("Resume where you left off?")).toBeInTheDocument();
    expect(screen.getByText(/Wager Deposit was paused at "Approve Allowance"/)).toBeInTheDocument();

    const resumeBtn = screen.getByTestId("restart-flow-prompt-resume");
    fireEvent.click(resumeBtn);
    expect(onDecision).toHaveBeenCalledWith("resume");
  });
});
