import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { InterruptedFlowPrompt } from "@/components/v1/InterruptedFlowPrompt";

describe("InterruptedFlowPrompt (#745)", () => {
  it("renders the action label in the title", () => {
    render(<InterruptedFlowPrompt actionLabel="Token swap" />);
    expect(screen.getByTestId("interrupted-flow-prompt")).toHaveTextContent(
      "Resume: Token swap",
    );
  });

  it("renders description when provided", () => {
    render(
      <InterruptedFlowPrompt
        actionLabel="Place bid"
        description="Your bid was interrupted by a network error."
      />,
    );
    expect(screen.getByTestId("interrupted-flow-prompt")).toHaveTextContent(
      "Your bid was interrupted by a network error.",
    );
  });

  it("renders resume and discard action buttons and calls their handlers", () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();

    render(
      <InterruptedFlowPrompt
        actionLabel="Token swap"
        actions={[
          { label: "Resume", onClick: onResume, variant: "resume" },
          { label: "Discard", onClick: onDiscard, variant: "discard" },
        ]}
      />,
    );

    fireEvent.click(screen.getByTestId("interrupted-flow-prompt-action-0"));
    expect(onResume).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId("interrupted-flow-prompt-action-1"));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });

  it("shows dismiss button and calls onDismiss", () => {
    const onDismiss = vi.fn();
    render(
      <InterruptedFlowPrompt actionLabel="Place bid" onDismiss={onDismiss} />,
    );
    fireEvent.click(screen.getByTestId("interrupted-flow-prompt-dismiss"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("hides dismiss button when onDismiss is not provided", () => {
    render(<InterruptedFlowPrompt actionLabel="Place bid" />);
    expect(
      screen.queryByTestId("interrupted-flow-prompt-dismiss"),
    ).not.toBeInTheDocument();
  });

  it("applies compact CSS class when compact prop is true", () => {
    const { container } = render(
      <InterruptedFlowPrompt actionLabel="Place bid" compact />,
    );
    expect(
      container.querySelector(".interrupted-flow-prompt--compact"),
    ).toBeInTheDocument();
  });

  it("disables action button when disabled prop is set", () => {
    render(
      <InterruptedFlowPrompt
        actionLabel="Token swap"
        actions={[{ label: "Resume", onClick: vi.fn(), variant: "resume", disabled: true }]}
      />,
    );
    expect(screen.getByTestId("interrupted-flow-prompt-action-0")).toBeDisabled();
  });

  it("renders no actions section when actions array is empty", () => {
    render(<InterruptedFlowPrompt actionLabel="Token swap" actions={[]} />);
    expect(
      screen.queryByTestId("interrupted-flow-prompt-actions"),
    ).not.toBeInTheDocument();
  });
});
