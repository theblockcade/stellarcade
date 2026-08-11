import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { PreferenceDraftIndicator } from "./PreferenceDraftIndicator";

describe("PreferenceDraftIndicator", () => {
  it("renders draft indicator with resume and discard buttons", () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();

    render(
      <PreferenceDraftIndicator
        hasDraft={true}
        onResume={onResume}
        onDiscard={onDiscard}
      />
    );

    expect(screen.getByText("Draft")).toBeInTheDocument();

    const resumeBtn = screen.getByTestId("preference-draft-resume");
    fireEvent.click(resumeBtn);
    expect(onResume).toHaveBeenCalled();

    const discardBtn = screen.getByTestId("preference-draft-discard");
    fireEvent.click(discardBtn);
    expect(onDiscard).toHaveBeenCalled();
  });
});
