import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { TextDivider } from "./TextDivider";

describe("TextDivider", () => {
  it("renders text label and badge in separator", () => {
    render(<TextDivider label="OR CONTINUE WITH" badge={<span>WEB3</span>} />);
    expect(screen.getByText("OR CONTINUE WITH")).toBeInTheDocument();
    expect(screen.getByText("WEB3")).toBeInTheDocument();
    expect(screen.getByRole("separator")).toBeInTheDocument();
  });
});
