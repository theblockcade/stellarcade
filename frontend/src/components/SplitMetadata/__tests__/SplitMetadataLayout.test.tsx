import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SplitMetadataLayout } from "../SplitMetadataLayout";
import type { MetadataSection } from "../types";

describe("SplitMetadataLayout", () => {
  const mockMetadataSections: MetadataSection[] = [
    {
      id: "stats",
      title: "Game Statistics",
      visible: true,
      collapsible: true,
      defaultOpen: true,
      fields: [
        {
          id: "players",
          label: "Players",
          value: "150",
          visible: true,
          loading: false,
        },
        {
          id: "winRate",
          label: "Win Rate",
          value: "45%",
          visible: true,
          loading: false,
          helpText: "Win rate over last 30 days",
        },
      ],
    },
    {
      id: "rewards",
      title: "Rewards",
      visible: true,
      collapsible: false,
      fields: [
        {
          id: "totalEarned",
          label: "Total Earned",
          value: "1,250 GAME",
          visible: true,
          loading: false,
        },
      ],
    },
  ];

  const mockPrimaryContent = <div>Primary Content</div>;

  it("renders split layout with primary content and sidebar", () => {
    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={mockMetadataSections}
      />
    );

    expect(screen.getByText("Primary Content")).toBeInTheDocument();
    expect(screen.getByText("Game Statistics")).toBeInTheDocument();
    expect(screen.getByText("Rewards")).toBeInTheDocument();
  });

  it("displays all metadata fields in sections", () => {
    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={mockMetadataSections}
      />
    );

    expect(screen.getByText("Players")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.getByText("Total Earned")).toBeInTheDocument();
    expect(screen.getByText("1,250 GAME")).toBeInTheDocument();
  });

  it("handles collapsible sections", async () => {
    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={mockMetadataSections}
      />
    );

    const statsHeader = screen.getByRole("button", {
      name: /game statistics/i,
    });

    // Section starts open
    expect(screen.getByText("150")).toBeInTheDocument();

    // Click to close
    fireEvent.click(statsHeader);
    await waitFor(() => {
      expect(screen.queryByText("150")).not.toBeInTheDocument();
    });

    // Click to open again
    fireEvent.click(statsHeader);
    await waitFor(() => {
      expect(screen.getByText("150")).toBeInTheDocument();
    });
  });

  it("shows loading state", () => {
    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={mockMetadataSections}
        isLoading={true}
      />
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("shows empty state when no sections", () => {
    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={[]}
        emptyMessage="No data available"
      />
    );

    expect(screen.getByText("No data available")).toBeInTheDocument();
  });

  it("handles disabled state", () => {
    const onFieldInteraction = vi.fn();
    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={mockMetadataSections}
        isDisabled={true}
        onFieldInteraction={onFieldInteraction}
      />
    );

    const statsHeader = screen.getByRole("button", {
      name: /game statistics/i,
    });
    expect(statsHeader).toBeDisabled();
  });

  it("calls onFieldInteraction callback when field is clicked", async () => {
    const onFieldInteraction = vi.fn();
    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={mockMetadataSections}
        onFieldInteraction={onFieldInteraction}
      />
    );

    const playersField = screen.getByText("Players").closest(".metadata-field");
    if (playersField) {
      fireEvent.click(playersField);
    }

    expect(onFieldInteraction).toHaveBeenCalledWith("players", "stats");
  });

  it("handles loading fields within sections", () => {
    const loadingMetadata: MetadataSection[] = [
      {
        id: "stats",
        title: "Stats",
        fields: [
          {
            id: "field1",
            label: "Loading Field",
            value: "test",
            loading: true,
          },
          {
            id: "field2",
            label: "Normal Field",
            value: "loaded",
            loading: false,
          },
        ],
      },
    ];

    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={loadingMetadata}
      />
    );

    const skeleton = screen.getByText("Loading...");
    expect(skeleton).toBeInTheDocument();
    expect(screen.getByText("loaded")).toBeInTheDocument();
  });

  it("hides sections with visible: false", () => {
    const hiddenMetadata: MetadataSection[] = [
      ...mockMetadataSections,
      {
        id: "hidden",
        title: "Hidden Section",
        visible: false,
        fields: [
          { id: "field1", label: "Hidden", value: "value" },
        ],
      },
    ];

    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={hiddenMetadata}
      />
    );

    expect(screen.queryByText("Hidden Section")).not.toBeInTheDocument();
  });

  it("displays help text in field labels", () => {
    render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={mockMetadataSections}
      />
    );

    const helpIcon = screen.getByTitle("Win rate over last 30 days");
    expect(helpIcon).toBeInTheDocument();
  });

  it("is responsive and has proper accessibility", () => {
    const { container } = render(
      <SplitMetadataLayout
        primaryContent={mockPrimaryContent}
        metadataSections={mockMetadataSections}
      />
    );

    const main = container.querySelector("[role='main']");
    expect(main).toBeInTheDocument();

    const aside = container.querySelector("aside[aria-label='Metadata']");
    expect(aside).toBeInTheDocument();
  });
});
