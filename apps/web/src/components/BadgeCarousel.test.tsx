import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { BadgeCarousel } from "./BadgeCarousel";

describe("BadgeCarousel", () => {
  it("renders badges and handles click", () => {
    const onClick = vi.fn();
    render(
      <BadgeCarousel
        badges={[
          { id: "b1", label: "Master Roller", unlockedAt: "2026-08-10" },
        ]}
        onBadgeClick={onClick}
      />
    );

    expect(screen.getByText("Master Roller")).toBeInTheDocument();
    const badge = screen.getByTestId("badge-carousel-badge-b1");
    fireEvent.click(badge);
    expect(onClick).toHaveBeenCalled();
  });
});
