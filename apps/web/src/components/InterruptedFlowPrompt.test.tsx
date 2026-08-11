import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { InterruptedFlowPrompt } from "./InterruptedFlowPrompt";

describe("InterruptedFlowPrompt", () => {
  it("renders interrupted action label and triggers action button", () => {
    const onResume = vi.fn();
    render(
      <InterruptedFlowPrompt
        actionLabel="Claim Quest Rewards"
        description="Your signature was pending."
        actions={[{ label: "Resume Signature", onClick: onResume, variant: "resume" }]}
      />
    );

    expect(screen.getByText("Resume: Claim Quest Rewards")).toBeInTheDocument();
    expect(screen.getByText("Your signature was pending.")).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: "Resume Signature" });
    fireEvent.click(btn);
    expect(onResume).toHaveBeenCalled();
  });
});
