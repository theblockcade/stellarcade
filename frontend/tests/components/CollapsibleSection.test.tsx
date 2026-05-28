import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CollapsibleSection } from "@/components/CollapsibleSection";

describe("CollapsibleSection", () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------
  it("renders the title and is collapsed by default", () => {
    render(<CollapsibleSection title="Settings">Content</CollapsibleSection>);
    expect(
      screen.getByRole("button", { name: /settings/i }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("renders open when defaultOpen=true", () => {
    render(
      <CollapsibleSection title="Settings" defaultOpen>
        Content
      </CollapsibleSection>,
    );
    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Toggle behaviour
  // -------------------------------------------------------------------------
  it("opens on click and closes on second click", () => {
    render(<CollapsibleSection title="FAQ">Answer</CollapsibleSection>);
    const btn = screen.getByRole("button");

    fireEvent.click(btn);
    expect(screen.getByRole("region")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  it("calls onToggle with correct values", () => {
    const onToggle = vi.fn();
    render(
      <CollapsibleSection title="FAQ" onToggle={onToggle}>
        Answer
      </CollapsibleSection>,
    );
    const btn = screen.getByRole("button");

    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith(true);

    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledWith(false);
  });

  it("does not toggle when disabled", () => {
    render(
      <CollapsibleSection title="Locked" disabled>
        Hidden
      </CollapsibleSection>,
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Keyboard
  // -------------------------------------------------------------------------
  it("opens with Enter key", () => {
    render(<CollapsibleSection title="Key test">Body</CollapsibleSection>);
    const btn = screen.getByRole("button");
    btn.focus();
    fireEvent.keyDown(btn, { key: "Enter" });
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  it("opens with Space key", () => {
    render(<CollapsibleSection title="Key test">Body</CollapsibleSection>);
    const btn = screen.getByRole("button");
    btn.focus();
    fireEvent.keyDown(btn, { key: " " });
    expect(screen.getByRole("region")).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // ARIA
  // -------------------------------------------------------------------------
  it("sets aria-expanded correctly", () => {
    render(<CollapsibleSection title="ARIA">Body</CollapsibleSection>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(btn);
    expect(btn).toHaveAttribute("aria-expanded", "true");
  });

  it("aria-controls points to the panel id", () => {
    render(<CollapsibleSection title="ARIA ctrl">Body</CollapsibleSection>);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    const panelId = btn.getAttribute("aria-controls");
    expect(document.getElementById(panelId!)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Inline validation reveal on focus
  // -------------------------------------------------------------------------
  it("shows inline validation message on focus when collapsed", () => {
    render(
      <CollapsibleSection
        title="Profile"
        validation={{ type: "error", text: "Name is required" }}
      >
        Form
      </CollapsibleSection>,
    );
    const btn = screen.getByRole("button");
    fireEvent.focus(btn);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Name is required")).toBeInTheDocument();
  });

  it("does not show validation message when section is open", () => {
    render(
      <CollapsibleSection
        title="Profile"
        defaultOpen
        validation={{ type: "error", text: "Name is required" }}
      >
        Form
      </CollapsibleSection>,
    );
    const btn = screen.getByRole("button");
    fireEvent.focus(btn);
    expect(screen.getByRole("status")).toHaveStyle({ maxHeight: "0" });
  });

  it("hides validation message after section is opened", () => {
    render(
      <CollapsibleSection
        title="Profile"
        validation={{ type: "warning", text: "Incomplete data" }}
      >
        Form
      </CollapsibleSection>,
    );
    const btn = screen.getByRole("button");
    fireEvent.focus(btn);
    expect(screen.getByText("Incomplete data")).toBeInTheDocument();

    fireEvent.click(btn);
    expect(screen.getByRole("status")).toHaveStyle({ maxHeight: "0" });
  });

  // -------------------------------------------------------------------------
  // Edge / regression cases
  // -------------------------------------------------------------------------
  it("renders with no validation prop without crashing", () => {
    render(<CollapsibleSection title="Clean">Content</CollapsibleSection>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("renders empty children without crashing", () => {
    render(
      <CollapsibleSection title="Empty" defaultOpen>
        {null}
      </CollapsibleSection>,
    );
    expect(screen.getByRole("region")).toBeInTheDocument();
  });
});
