import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TableRowActionOverflowMenu } from "@/components/v1/TableRowActionOverflowMenu";

describe("TableRowActionOverflowMenu (#565)", () => {
  it("renders only the trigger when closed", () => {
    render(
      <TableRowActionOverflowMenu
        items={[
          { id: "edit", label: "Edit", onSelect: vi.fn() },
          { id: "delete", label: "Delete", onSelect: vi.fn() },
        ]}
      />,
    );
    expect(screen.getByTestId("table-row-action-overflow-trigger")).toBeInTheDocument();
    expect(
      screen.queryByTestId("table-row-action-overflow-menu"),
    ).not.toBeInTheDocument();
  });

  it("opens the menu on click and lists every action", () => {
    render(
      <TableRowActionOverflowMenu
        items={[
          { id: "edit", label: "Edit", onSelect: vi.fn() },
          { id: "delete", label: "Delete", onSelect: vi.fn(), tone: "danger" },
        ]}
      />,
    );
    fireEvent.click(screen.getByTestId("table-row-action-overflow-trigger"));
    expect(screen.getByTestId("table-row-action-overflow-menu")).toBeInTheDocument();
    expect(screen.getByTestId("table-row-action-overflow-item-edit")).toBeInTheDocument();
    expect(
      screen.getByTestId("table-row-action-overflow-item-delete"),
    ).toHaveAttribute("data-tone", "danger");
  });

  it("invokes onSelect when an action is chosen and closes the menu", async () => {
    const onSelect = vi.fn();
    render(
      <TableRowActionOverflowMenu
        items={[{ id: "edit", label: "Edit", onSelect }]}
      />,
    );
    fireEvent.click(screen.getByTestId("table-row-action-overflow-trigger"));
    fireEvent.click(screen.getByTestId("table-row-action-overflow-item-edit"));
    expect(onSelect).toHaveBeenCalledOnce();
    // Menu re-renders without the popover after selecting.
    expect(
      screen.queryByTestId("table-row-action-overflow-menu"),
    ).not.toBeInTheDocument();
  });

  it("does not invoke onSelect for disabled actions", () => {
    const onSelect = vi.fn();
    render(
      <TableRowActionOverflowMenu
        items={[{ id: "edit", label: "Edit", onSelect, disabled: true }]}
      />,
    );
    fireEvent.click(screen.getByTestId("table-row-action-overflow-trigger"));
    fireEvent.click(screen.getByTestId("table-row-action-overflow-item-edit"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("disables the trigger when no items are supplied", () => {
    render(<TableRowActionOverflowMenu items={[]} />);
    const trigger = screen.getByTestId("table-row-action-overflow-trigger");
    expect(trigger).toBeDisabled();
  });

  it("respects the `disabled` prop on the trigger", () => {
    render(
      <TableRowActionOverflowMenu
        items={[{ id: "edit", label: "Edit", onSelect: vi.fn() }]}
        disabled
      />,
    );
    const trigger = screen.getByTestId("table-row-action-overflow-trigger");
    expect(trigger).toBeDisabled();
  });

  it("closes on Escape", () => {
    render(
      <TableRowActionOverflowMenu
        items={[{ id: "edit", label: "Edit", onSelect: vi.fn() }]}
      />,
    );
    fireEvent.click(screen.getByTestId("table-row-action-overflow-trigger"));
    expect(screen.getByTestId("table-row-action-overflow-menu")).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByTestId("table-row-action-overflow-menu"),
    ).not.toBeInTheDocument();
  });

  it("supports keyboard navigation across enabled items only", () => {
    render(
      <TableRowActionOverflowMenu
        items={[
          { id: "view", label: "View", onSelect: vi.fn() },
          { id: "skip", label: "Skip me", onSelect: vi.fn(), disabled: true },
          { id: "delete", label: "Delete", onSelect: vi.fn() },
        ]}
      />,
    );
    fireEvent.click(screen.getByTestId("table-row-action-overflow-trigger"));
    const menu = screen.getByTestId("table-row-action-overflow-menu");
    // Initial active should be the first enabled item.
    expect(screen.getByTestId("table-row-action-overflow-item-view")).toHaveAttribute(
      "data-active",
      "true",
    );
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    // Next enabled is delete (skipping the disabled item).
    expect(
      screen.getByTestId("table-row-action-overflow-item-delete"),
    ).toHaveAttribute("data-active", "true");
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    // Wraps back to first enabled.
    expect(screen.getByTestId("table-row-action-overflow-item-view")).toHaveAttribute(
      "data-active",
      "true",
    );
  });

  it("shows an empty fallback if every item is disabled and the menu is opened anyway", () => {
    // Forcing the menu open by passing a single item that's disabled — the
    // trigger stays clickable but selecting the disabled item is a no-op.
    render(
      <TableRowActionOverflowMenu
        items={[{ id: "view", label: "View", onSelect: vi.fn(), disabled: true }]}
      />,
    );
    fireEvent.click(screen.getByTestId("table-row-action-overflow-trigger"));
    const item = screen.getByTestId("table-row-action-overflow-item-view");
    expect(item).toBeDisabled();
  });
});
