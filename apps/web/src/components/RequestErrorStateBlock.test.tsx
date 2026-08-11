import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { RequestErrorStateBlock } from "./RequestErrorStateBlock";

describe("RequestErrorStateBlock", () => {
  it("renders error block with message and status code", () => {
    const onRetry = vi.fn();
    render(
      <RequestErrorStateBlock
        hasError={true}
        statusCode={503}
        message="RPC Service temporarily unavailable"
        onRetry={onRetry}
      />
    );

    expect(screen.getByText("Request failed")).toBeInTheDocument();
    expect(screen.getByText("503")).toBeInTheDocument();
    expect(screen.getByText("RPC Service temporarily unavailable")).toBeInTheDocument();

    const retryBtn = screen.getByRole("button", { name: "Try again" });
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });
});
