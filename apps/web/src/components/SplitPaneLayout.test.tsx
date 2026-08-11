import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { SplitPaneLayout } from "./SplitPaneLayout";

describe("SplitPaneLayout", () => {
  it("renders left and right panes with divider", () => {
    render(
      <SplitPaneLayout
        leftPane={<div>Left Content</div>}
        rightPane={<div>Right Content</div>}
        resizable={true}
      />
    );

    expect(screen.getByText("Left Content")).toBeInTheDocument();
    expect(screen.getByText("Right Content")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});
