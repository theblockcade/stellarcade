import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MetadataSection } from "../MetadataSection";
import type { MetadataSection as MetadataSectionType } from "../types";

describe("MetadataSection", () => {
  const mockSection: MetadataSectionType = {
    id: "stats",
    title: "Statistics",
    visible: true,
    collapsible: true,
    defaultOpen: true,
    fields: [
      {
        id: "field1",
        label: "Field 1",
        value: "Value 1",
        visible: true,
        loading: false,
      },
      {
        id: "field2",
        label: "Field 2",
        value: "Value 2",
        visible: true,
        loading: false,
        helpText: "This is field 2",
      },
    ],
  };

  it("renders section title", () => {
    render(
      <MetadataSection section={mockSection} />
    );

    expect(screen.getByText("Statistics")).toBeInTheDocument();
  });

  it("renders all visible fields", () => {
    render(
      <MetadataSection section={mockSection} />
    );

    expect(screen.getByText("Field 1")).toBeInTheDocument();
    expect(screen.getByText("Value 1")).toBeInTheDocument();
    expect(screen.getByText("Field 2")).toBeInTheDocument();
    expect(screen.getByText("Value 2")).toBeInTheDocument();
  });

  it("toggles collapsible section open/close", async () => {
    render(
      <MetadataSection section={mockSection} />
    );

    const button = screen.getByRole("button", { name: /statistics/i });

    // Initially open
    expect(screen.getByText("Value 1")).toBeInTheDocument();

    // Click to close
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText("Value 1")).not.toBeInTheDocument();
    });

    // Click to open
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText("Value 1")).toBeInTheDocument();
    });
  });

  it("handles controlled open state", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <MetadataSection
        section={mockSection}
        isOpen={true}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getByText("Value 1")).toBeInTheDocument();

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(onOpenChange).toHaveBeenCalledWith(false);

    rerender(
      <MetadataSection
        section={mockSection}
        isOpen={false}
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.queryByText("Value 1")).not.toBeInTheDocument();
  });

  it("calls onFieldInteraction when field is clicked", () => {
    const onFieldInteraction = vi.fn();
    render(
      <MetadataSection
        section={mockSection}
        onFieldInteraction={onFieldInteraction}
      />
    );

    const field = screen.getByText("Value 1").closest(".metadata-field");
    if (field) {
      fireEvent.click(field);
    }

    expect(onFieldInteraction).toHaveBeenCalledWith("field1");
  });

  it("respects visible property on fields", () => {
    const sectionWithHidden: MetadataSectionType = {
      ...mockSection,
      fields: [
        { ...mockSection.fields[0] },
        { ...mockSection.fields[1], visible: false },
      ],
    };

    render(
      <MetadataSection section={sectionWithHidden} />
    );

    expect(screen.getByText("Value 1")).toBeInTheDocument();
    expect(screen.queryByText("Value 2")).not.toBeInTheDocument();
  });

  it("shows empty state when all fields hidden", () => {
    const emptySection: MetadataSectionType = {
      ...mockSection,
      fields: mockSection.fields.map((f) => ({ ...f, visible: false })),
    };

    render(
      <MetadataSection section={emptySection} />
    );

    expect(screen.getByText("No metadata available")).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    render(
      <MetadataSection section={mockSection} isDisabled={true} />
    );

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("displays loading state for fields", () => {
    const loadingSection: MetadataSectionType = {
      ...mockSection,
      fields: [
        { ...mockSection.fields[0], loading: true },
        mockSection.fields[1],
      ],
    };

    render(
      <MetadataSection section={loadingSection} />
    );

    expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    expect(screen.getByText("Value 2")).toBeInTheDocument();
  });

  it("renders static section (non-collapsible)", () => {
    const staticSection: MetadataSectionType = {
      ...mockSection,
      collapsible: false,
    };

    render(
      <MetadataSection section={staticSection} />
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Statistics")).toBeInTheDocument();
    expect(screen.getByText("Value 1")).toBeInTheDocument();
  });

  it("displays help text", () => {
    render(
      <MetadataSection section={mockSection} />
    );

    const helpIcon = screen.getByTitle("This is field 2");
    expect(helpIcon).toBeInTheDocument();
  });

  it("returns null when visible is false", () => {
    const hiddenSection: MetadataSectionType = {
      ...mockSection,
      visible: false,
    };

    const { container } = render(
      <MetadataSection section={hiddenSection} />
    );

    expect(container.firstChild).toBeNull();
  });
});
