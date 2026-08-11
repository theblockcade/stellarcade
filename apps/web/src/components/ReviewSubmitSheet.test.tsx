import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ReviewSubmitSheet } from "./ReviewSubmitSheet";

describe("ReviewSubmitSheet", () => {
  it("renders review sheet and handles confirm", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();

    render(
      <ReviewSubmitSheet
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        title="Review Prize Pool Deposit"
        riskLevel="high"
        fields={[{ label: "Amount", value: "500 XLM" }]}
      />
    );

    expect(screen.getByText("Review Prize Pool Deposit")).toBeInTheDocument();
    expect(screen.getByText("High risk")).toBeInTheDocument();
    expect(screen.getByText("500 XLM")).toBeInTheDocument();

    const confirmBtn = screen.getByTestId("review-submit-sheet-confirm");
    fireEvent.click(confirmBtn);
    expect(onConfirm).toHaveBeenCalled();
  });
});
