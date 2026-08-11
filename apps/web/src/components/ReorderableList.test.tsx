import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { ReorderableList } from "./ReorderableList";

describe("ReorderableList", () => {
  it("renders list items with drag handles", () => {
    const onReorder = vi.fn();
    render(
      <ReorderableList
        items={[
          { id: "1", title: "First Quest" },
          { id: "2", title: "Second Quest" },
        ]}
        onReorder={onReorder}
        renderItem={(item) => <div>{item.title}</div>}
      />
    );

    expect(screen.getByText("First Quest")).toBeInTheDocument();
    expect(screen.getByText("Second Quest")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
