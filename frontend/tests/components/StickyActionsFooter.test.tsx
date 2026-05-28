import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StickyActionsFooter } from "@/components/v1/StickyActionsFooter";

describe("StickyActionsFooter", () => {
  it("renders default page actions region", () => {
    render(
      <StickyActionsFooter>
        <button type="button">Save</button>
      </StickyActionsFooter>,
    );

    expect(screen.getByRole("region", { name: "Page actions" })).toBeInTheDocument();
  });

  it("renders guided workflow progress when steps are provided", () => {
    render(
      <StickyActionsFooter
        steps={[
          { id: "review", label: "Review changes" },
          { id: "verify", label: "Verify details" },
        ]}
        currentStepId="review"
        testId="guided-footer"
      >
        <button type="button">Continue</button>
      </StickyActionsFooter>,
    );

    expect(screen.getByRole("region", { name: "Workflow actions" })).toBeInTheDocument();
    expect(screen.getByTestId("guided-footer-progress")).toHaveTextContent("Step 1 of 2: Review changes");
  });
});
