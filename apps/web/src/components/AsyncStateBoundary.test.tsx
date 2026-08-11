import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { AsyncStateBoundary } from "./AsyncStateBoundary";

describe("AsyncStateBoundary", () => {
  it("renders loading state", () => {
    render(
      <AsyncStateBoundary
        status="loading"
        renderSuccess={(data) => <div>{String(data)}</div>}
      />
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders success state with data", () => {
    render(
      <AsyncStateBoundary
        status="success"
        data={{ title: "Stellar Arcade" }}
        renderSuccess={(data) => <div>{data?.title}</div>}
      />
    );
    expect(screen.getByText("Stellar Arcade")).toBeInTheDocument();
  });

  it("renders error state with retry button", () => {
    const onRetry = vi.fn();
    render(
      <AsyncStateBoundary
        status="error"
        error={new Error("Failed to load")}
        onRetry={onRetry}
        renderSuccess={() => null}
      />
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
