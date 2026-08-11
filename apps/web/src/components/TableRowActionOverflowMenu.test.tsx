import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { TableRowActionOverflowMenu } from "./TableRowActionOverflowMenu";

describe("TableRowActionOverflowMenu", () => {
  it("opens menu and executes selected action", () => {
    const onSelect = vi.fn();
    render(
      <TableRowActionOverflowMenu
        items={[
          { id: "edit", label: "Edit Record", onSelect },
          { id: "delete", label: "Delete", onSelect: vi.fn(), tone: "danger" },
        ]}
      />
    );

    const trigger = screen.getByTestId("table-row-action-overflow-trigger");
    fireEvent.click(trigger);

    expect(screen.getByRole("menu")).toBeInTheDocument();
    const editBtn = screen.getByTestId("table-row-action-overflow-item-edit");
    fireEvent.click(editBtn);

    expect(onSelect).toHaveBeenCalled();
  });
});
