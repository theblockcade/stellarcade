import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PinnedWalletActionTray } from "../../../src/components/v1/PinnedWalletActionTray";

describe("PinnedWalletActionTray", () => {
  it("renders wallet repeat action buttons", () => {
    render(
      <PinnedWalletActionTray
        actions={[
          { id: "a", label: "Repeat transfer", onClick: vi.fn() },
          { id: "b", label: "Reconnect", onClick: vi.fn() },
        ]}
      />,
    );

    expect(screen.getByTestId("pinned-wallet-action-tray")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Repeat transfer" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconnect" })).toBeInTheDocument();
  });

  it("honors disabled states", () => {
    render(
      <PinnedWalletActionTray
        actions={[{ id: "a", label: "Repeat transfer", onClick: vi.fn(), disabled: true }]}
      />,
    );

    expect(screen.getByRole("button", { name: "Repeat transfer" })).toBeDisabled();
  });

  it("fires selected action callbacks", () => {
    const onClick = vi.fn();
    render(
      <PinnedWalletActionTray
        actions={[{ id: "a", label: "Repeat transfer", onClick }]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Repeat transfer" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
