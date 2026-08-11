import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AnalyticsRangeSwitcher } from "./AnalyticsRangeSwitcher";

describe("AnalyticsRangeSwitcher", () => {
  it("renders range options and selects active range", () => {
    const onChange = vi.fn();
    render(<AnalyticsRangeSwitcher selectedId="7d" onChange={onChange} />);

    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
    const opt24h = screen.getByTestId("analytics-range-switcher-option-24h");
    fireEvent.click(opt24h);

    expect(onChange).toHaveBeenCalledWith(
      "24h",
      expect.objectContaining({ id: "24h", label: "24 Hours" })
    );
  });
});
