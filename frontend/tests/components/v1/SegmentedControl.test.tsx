import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "../../../src/components/v1/SegmentedControl";

describe("SegmentedControl", () => {
  it("marks the active segment and keeps the others inactive", () => {
    render(
      <SegmentedControl
        label="Density"
        value="standard"
        onChange={() => undefined}
        options={[
          { value: "standard", label: "Standard" },
          { value: "compact", label: "Compact" },
        ]}
      />,
    );

    expect(screen.getByTestId("segmented-control-standard")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByTestId("segmented-control-compact")).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("calls onChange when a new segment is selected", () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        label="Density"
        value="standard"
        onChange={onChange}
        options={[
          { value: "standard", label: "Standard" },
          { value: "compact", label: "Compact" },
        ]}
      />,
    );

    fireEvent.click(screen.getByTestId("segmented-control-compact"));
    expect(onChange).toHaveBeenCalledWith("compact");
  });
});
