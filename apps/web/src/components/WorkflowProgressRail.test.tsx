import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { WorkflowProgressRail } from "./WorkflowProgressRail";

describe("WorkflowProgressRail", () => {
  it("renders workflow steps and active indicators", () => {
    render(
      <WorkflowProgressRail
        steps={[
          { id: "1", label: "Review Wager" },
          { id: "2", label: "Sign Transaction" },
          { id: "3", label: "Submit to Ledger" },
        ]}
        currentStepIndex={1}
      />
    );

    expect(screen.getByText("Review Wager")).toBeInTheDocument();
    expect(screen.getByText("Sign Transaction")).toBeInTheDocument();
    expect(screen.getByText("Submit to Ledger")).toBeInTheDocument();
  });
});
