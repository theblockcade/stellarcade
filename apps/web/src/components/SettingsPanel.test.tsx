import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { SettingsPanel } from "./SettingsPanel";

describe("SettingsPanel", () => {
  it("renders when open and handles close click", () => {
    const onClose = vi.fn();
    render(
      <SettingsPanel isOpen={true} onClose={onClose} title="Audio Settings">
        <div>Sound Effects Volume</div>
      </SettingsPanel>
    );

    expect(screen.getByText("Audio Settings")).toBeInTheDocument();
    expect(screen.getByText("Sound Effects Volume")).toBeInTheDocument();

    const closeBtn = screen.getByTestId("settings-panel-close-btn");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });
});
