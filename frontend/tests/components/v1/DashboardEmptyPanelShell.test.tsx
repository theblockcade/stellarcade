import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DashboardEmptyPanelShell } from "../../../src/components/v1/DashboardEmptyPanelShell";

describe("DashboardEmptyPanelShell", () => {
  it("renders sparse shell content", () => {
    render(
      <DashboardEmptyPanelShell
        title="Rewards anomaly stream"
        description="No sparse samples yet."
      />,
    );

    expect(screen.getByText("Sparse module")).toBeInTheDocument();
    expect(screen.getByText("Rewards anomaly stream")).toBeInTheDocument();
    expect(screen.getByText("No sparse samples yet.")).toBeInTheDocument();
  });

  it("invokes CTA action", () => {
    const onAction = vi.fn();
    render(
      <DashboardEmptyPanelShell
        title="Module"
        description="Description"
        actionLabel="Load fallback"
        onAction={onAction}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Load fallback" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
