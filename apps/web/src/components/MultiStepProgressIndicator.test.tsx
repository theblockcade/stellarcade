import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MultiStepProgressIndicator, type ProgressStep } from "./MultiStepProgressIndicator";

const STEPS: ProgressStep[] = [
  { id: "step-1", label: "Connect Freighter", description: "Sign auth challenge" },
  { id: "step-2", label: "Commit Entropy", description: "Submit client seed" },
  { id: "step-3", label: "Verify Result", description: "Recompute settlement hash" },
];

describe("MultiStepProgressIndicator", () => {
  it("renders steps and highlights active step", () => {
    render(
      <MultiStepProgressIndicator
        steps={STEPS}
        currentStepIndex={1}
        showDescriptions={true}
      />
    );

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "2");

    expect(screen.getByText("Connect Freighter")).toBeInTheDocument();
    expect(screen.getByText("Commit Entropy")).toBeInTheDocument();
    expect(screen.getByText("Verify Result")).toBeInTheDocument();
    expect(screen.getByText("Sign auth challenge")).toBeInTheDocument();
  });

  it("handles step clicks on completed steps", () => {
    const onStepClick = vi.fn();
    render(
      <MultiStepProgressIndicator
        steps={STEPS}
        currentStepIndex={2}
        onStepClick={onStepClick}
      />
    );

    const step0 = screen.getByTestId("multi-step-progress-step-0");
    fireEvent.click(step0);
    expect(onStepClick).toHaveBeenCalledWith(0);
  });
});
