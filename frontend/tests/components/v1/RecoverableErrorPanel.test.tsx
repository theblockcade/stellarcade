import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecoverableErrorPanel } from "../../../src/components/v1/RecoverableErrorPanel";

describe("RecoverableErrorPanel", () => {
  it("renders retry and secondary affordances for recoverable states", () => {
    const onRetry = vi.fn();
    const onSecondary = vi.fn();

    render(
      <RecoverableErrorPanel
        title="Dashboard unavailable"
        message="We could not refresh the lobby."
        description="Try again without leaving the page."
        onRetry={onRetry}
        secondaryAction={{ label: "Review wallet panel", onClick: onSecondary }}
      />,
    );

    fireEvent.click(screen.getByTestId("recoverable-error-panel-retry"));
    fireEvent.click(screen.getByTestId("recoverable-error-panel-secondary"));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it("can render without actions for passive fallback messaging", () => {
    render(
      <RecoverableErrorPanel
        title="Temporary issue"
        message="We are still collecting the latest state."
      />,
    );

    expect(screen.getByTestId("recoverable-error-panel")).toBeInTheDocument();
    expect(
      screen.queryByTestId("recoverable-error-panel-retry"),
    ).not.toBeInTheDocument();
  });
});
