import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { QuickPivotLinks } from "./QuickPivotLinks";

describe("QuickPivotLinks", () => {
  it("renders pivot links and handles click", () => {
    const onClick = vi.fn();
    render(
      <QuickPivotLinks
        links={[
          { id: "l1", label: "Overview", onClick },
          { id: "l2", label: "Signers", badge: 3 },
        ]}
        activeId="l1"
      />
    );

    expect(screen.getByText("Overview")).toBeInTheDocument();
    expect(screen.getByText("Signers")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    const overviewBtn = screen.getByTestId("quick-pivot-links-link-l1");
    fireEvent.click(overviewBtn);
    expect(onClick).toHaveBeenCalled();
  });
});
