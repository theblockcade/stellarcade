import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CautionStatePanel } from "@/components/v1/CautionStatePanel";

describe("CautionStatePanel (#682)", () => {
  it("renders title, description, and a variant icon by default", () => {
    render(
      <CautionStatePanel
        variant="blocked-wallet"
        title="Wallet not connected"
        description="Connect your Freighter wallet to deposit."
      />,
    );

    const panel = screen.getByTestId("caution-state-panel");
    expect(panel).toHaveAttribute("data-variant", "blocked-wallet");
    expect(panel).toHaveAttribute("role", "alert");
    expect(panel).toHaveTextContent("Wallet not connected");
    expect(panel).toHaveTextContent("Connect your Freighter wallet to deposit.");
    expect(screen.getByTestId("caution-state-panel-icon")).toBeInTheDocument();
  });

  it("renders all four variant CSS classes", () => {
    const variants: Array<
      "blocked-wallet" | "paused-contract" | "network-mismatch" | "rate-limited"
    > = ["blocked-wallet", "paused-contract", "network-mismatch", "rate-limited"];

    for (const variant of variants) {
      const { unmount, container } = render(
        <CautionStatePanel
          variant={variant}
          title={variant}
          description="x"
          testId={`panel-${variant}`}
        />,
      );
      expect(container.querySelector(`.caution-state-panel--${variant}`)).toBeInTheDocument();
      unmount();
    }
  });

  it("invokes the action handler when an action button is clicked", () => {
    const onAction = vi.fn();
    render(
      <CautionStatePanel
        variant="paused-contract"
        title="Deposits are paused"
        description="The treasury contract is in maintenance."
        actions={[
          { label: "Open status page", onAction, variant: "primary" },
          { label: "Dismiss for now", onAction: vi.fn() },
        ]}
      />,
    );

    expect(screen.getByTestId("caution-state-panel-actions")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("caution-state-panel-action-0"));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it("renders the dismiss button only when onDismiss is supplied", () => {
    const { rerender } = render(
      <CautionStatePanel
        variant="rate-limited"
        title="Slow down"
        description="Hit a rate limit."
      />,
    );
    expect(
      screen.queryByTestId("caution-state-panel-dismiss"),
    ).not.toBeInTheDocument();

    const onDismiss = vi.fn();
    rerender(
      <CautionStatePanel
        variant="rate-limited"
        title="Slow down"
        description="Hit a rate limit."
        onDismiss={onDismiss}
      />,
    );
    const dismiss = screen.getByTestId("caution-state-panel-dismiss");
    expect(dismiss).toHaveAttribute("aria-label", "Dismiss caution panel");
    fireEvent.click(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("does not render the actions container when no actions are provided", () => {
    render(
      <CautionStatePanel
        variant="network-mismatch"
        title="Wrong network"
        description="Switch to mainnet."
      />,
    );
    expect(
      screen.queryByTestId("caution-state-panel-actions"),
    ).not.toBeInTheDocument();
  });

  it("supports custom icon override", () => {
    render(
      <CautionStatePanel
        variant="blocked-wallet"
        title="t"
        description="d"
        icon={<span data-testid="custom-icon">⚠</span>}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeInTheDocument();
  });

  it("primary action button has the primary class", () => {
    render(
      <CautionStatePanel
        variant="blocked-wallet"
        title="t"
        description="d"
        actions={[
          { label: "Connect", onAction: vi.fn(), variant: "primary" },
          { label: "Cancel", onAction: vi.fn() },
        ]}
      />,
    );
    const primary = screen.getByTestId("caution-state-panel-action-0");
    const secondary = screen.getByTestId("caution-state-panel-action-1");
    expect(primary.className).toContain("caution-state-panel__action--primary");
    expect(secondary.className).not.toContain("caution-state-panel__action--primary");
  });
});
