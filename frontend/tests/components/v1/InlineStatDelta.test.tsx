import { render, screen } from "@testing-library/react";
import { InlineStatDelta } from "../../../src/components/v1/InlineStatDelta";

describe("InlineStatDelta", () => {
  it("renders a positive delta with sign", () => {
    render(<InlineStatDelta value={4} />);

    expect(screen.getByText("+4")).toBeInTheDocument();
    expect(screen.getByText("vs last refresh")).toBeInTheDocument();
  });

  it("renders an empty-state fallback when data is unavailable", () => {
    render(<InlineStatDelta value={null} label="vs prior sample" />);

    expect(screen.getByText("--")).toBeInTheDocument();
    expect(screen.getByText("vs prior sample")).toBeInTheDocument();
  });

  it("renders loading text when loading is true", () => {
    render(<InlineStatDelta value={2} loading={true} />);

    expect(screen.getByText("Updating")).toBeInTheDocument();
    expect(screen.queryByText("+2")).not.toBeInTheDocument();
  });
});
