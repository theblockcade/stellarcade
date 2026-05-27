import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyResultCallout } from "../../../src/components/v1/EmptyResultCallout";

describe("EmptyResultCallout", () => {
  it("summarizes search and filter empty results", () => {
    render(
      <EmptyResultCallout
        query="coin"
        activeFilters={["status: active", "network: testnet"]}
      />,
    );

    expect(screen.getByTestId("empty-result-callout")).toBeInTheDocument();
    expect(screen.getByText("No matching results")).toBeInTheDocument();
    expect(screen.getByText(/search "coin"/i)).toBeInTheDocument();
    expect(screen.getByText(/2 active filters/i)).toBeInTheDocument();
  });

  it("supports a disabled clear action for blocked fallback states", () => {
    const onClear = vi.fn();
    render(<EmptyResultCallout onClear={onClear} disabled />);

    const action = screen.getByTestId("empty-result-callout-action-0");
    expect(action).toBeDisabled();
    fireEvent.click(action);
    expect(onClear).not.toHaveBeenCalled();
  });
});
