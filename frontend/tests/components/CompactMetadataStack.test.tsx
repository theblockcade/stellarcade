/**
 * @vitest-environment happy-dom
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it } from "vitest";
import {
  CompactMetadataStack,
  type MetadataItem,
} from "@/components/v1/CompactMetadataStack";

const items: MetadataItem[] = [
  { id: "network", label: "Network", value: "Testnet" },
  { id: "players", label: "Players", value: 128 },
  { id: "id", label: "Lobby ID", value: "LBY-7F1C", title: "LBY-7F1C-full" },
];

describe("CompactMetadataStack", () => {
  it("renders label/value pairs as a definition list", () => {
    render(<CompactMetadataStack items={items} />);
    expect(screen.getByText("Network")).toBeInTheDocument();
    expect(screen.getByText("Testnet")).toBeInTheDocument();
    expect(screen.getByText("128")).toBeInTheDocument();
    // value title is forwarded for tooltips
    expect(screen.getByText("LBY-7F1C")).toHaveAttribute(
      "title",
      "LBY-7F1C-full",
    );
  });

  it("renders skeletons while loading and hides values", () => {
    render(<CompactMetadataStack items={items} loading />);
    const list = screen.getByLabelText("Details");
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByTestId("metadata-skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByText("Testnet")).not.toBeInTheDocument();
  });

  it("shows the empty message when there are no items", () => {
    render(
      <CompactMetadataStack items={[]} emptyMessage="Nothing configured" />,
    );
    expect(screen.getByText("Nothing configured")).toBeInTheDocument();
    expect(screen.queryByRole("term")).not.toBeInTheDocument();
  });

  it("accepts a custom aria-label", () => {
    render(<CompactMetadataStack items={items} ariaLabel="Lobby details" />);
    expect(screen.getByLabelText("Lobby details")).toBeInTheDocument();
  });
});
