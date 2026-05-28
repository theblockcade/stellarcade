import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PendingActionResumeChip from "../../../src/components/v1/PendingActionResumeChip";

describe("PendingActionResumeChip", () => {
  it("renders the pending action copy and calls resume", () => {
    const onResume = vi.fn();
    render(
      <PendingActionResumeChip
        label="wallet deposit"
        detail="submitting in progress"
        onResume={onResume}
      />,
    );

    expect(screen.getByTestId("pending-action-resume-chip")).toHaveTextContent(
      /wallet deposit/i,
    );

    fireEvent.click(screen.getByTestId("pending-action-resume-chip-resume-btn"));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("omits the dismiss action when not provided", () => {
    render(<PendingActionResumeChip label="wallet deposit" onResume={() => undefined} />);
    expect(
      screen.queryByTestId("pending-action-resume-chip-dismiss-btn"),
    ).not.toBeInTheDocument();
  });
});
