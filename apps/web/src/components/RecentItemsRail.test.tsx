import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { RecentItemsRail } from "./RecentItemsRail";

describe("RecentItemsRail", () => {
  it("renders recent items and handles click", () => {
    const onClick = vi.fn();
    render(
      <RecentItemsRail
        items={[
          { id: "1", title: "Coinflip #104", subtitle: "Won 25 XLM", accessedAt: Date.now() },
        ]}
        onItemClick={onClick}
      />
    );

    expect(screen.getByText("Coinflip #104")).toBeInTheDocument();
    expect(screen.getByText("Won 25 XLM")).toBeInTheDocument();

    const itemBtn = screen.getByTestId("recent-items-rail-item-1");
    fireEvent.click(itemBtn);
    expect(onClick).toHaveBeenCalled();
  });
});
