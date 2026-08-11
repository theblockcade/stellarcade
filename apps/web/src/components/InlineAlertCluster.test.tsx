import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { InlineAlertCluster } from "./InlineAlertCluster";

describe("InlineAlertCluster", () => {
  it("renders multiple alerts with callout items", () => {
    const onAction = vi.fn();
    render(
      <InlineAlertCluster
        alerts={[
          {
            id: "c1",
            title: "Network Notice",
            description: "Soroban Testnet reset scheduled",
            action: { label: "Learn more", onClick: onAction },
          },
        ]}
      />
    );

    expect(screen.getByText("Network Notice")).toBeInTheDocument();
    expect(screen.getByText("Soroban Testnet reset scheduled")).toBeInTheDocument();

    const btn = screen.getByRole("button", { name: "Learn more" });
    fireEvent.click(btn);
    expect(onAction).toHaveBeenCalled();
  });
});
