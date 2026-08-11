import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { PaginatedListController } from "./PaginatedListController";

describe("PaginatedListController", () => {
  it("renders page info and fires navigation callbacks", () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    const onPageChange = vi.fn();
    const onPageSizeChange = vi.fn();

    render(
      <PaginatedListController
        page={2}
        pageSize={10}
        total={57}
        totalPages={6}
        onNext={onNext}
        onPrev={onPrev}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    );

    expect(screen.getByText(/Showing/i)).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("57")).toBeInTheDocument();

    const nextBtn = screen.getByRole("button", { name: "Go to next page" });
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalled();
  });
});
