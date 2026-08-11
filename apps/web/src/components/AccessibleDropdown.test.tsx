import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { AccessibleDropdown } from "./AccessibleDropdown";

describe("AccessibleDropdown", () => {
  it("opens listbox and selects option", () => {
    const onChange = vi.fn();
    render(
      <AccessibleDropdown
        options={[
          { value: "opt1", label: "Option 1" },
          { value: "opt2", label: "Option 2" },
        ]}
        onChange={onChange}
        placeholder="Select option..."
      />
    );

    const trigger = screen.getByTestId("accessible-dropdown-trigger");
    fireEvent.click(trigger);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    const opt2 = screen.getByTestId("accessible-dropdown-option-opt2");
    fireEvent.click(opt2);

    expect(onChange).toHaveBeenCalledWith("opt2");
  });
});
