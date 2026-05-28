import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import DraftRecoveryPrompt from "../../src/components/v1/DraftRecoveryPrompt";
import RecentItemsRail from "../../src/components/v1/RecentItemsRail";
import PropertyList from "../../src/components/v1/PropertyList";

describe("DraftRecoveryPrompt", () => {
  it("should render with form name", () => {
    const onRecover = vi.fn();
    const onDiscard = vi.fn();

    render(
      <DraftRecoveryPrompt
        formId="test-form"
        formName="User Profile"
        onRecover={onRecover}
        onDiscard={onDiscard}
      />,
    );

    expect(screen.getByText(/User Profile/)).toBeInTheDocument();
  });

  it("should call onRecover when recover button is clicked", async () => {
    const onRecover = vi.fn();
    const onDiscard = vi.fn();

    render(
      <DraftRecoveryPrompt
        formId="test-form"
        formName="User Profile"
        onRecover={onRecover}
        onDiscard={onDiscard}
      />,
    );

    const recoverBtn = screen.getByTestId("draft-recovery-prompt-recover-btn");
    fireEvent.click(recoverBtn);

    expect(onRecover).toHaveBeenCalled();
  });

  it("should call onDiscard when discard button is clicked", async () => {
    const onRecover = vi.fn();
    const onDiscard = vi.fn();

    render(
      <DraftRecoveryPrompt
        formId="test-form"
        formName="User Profile"
        onRecover={onRecover}
        onDiscard={onDiscard}
      />,
    );

    const discardBtn = screen.getByTestId("draft-recovery-prompt-discard-btn");
    fireEvent.click(discardBtn);

    expect(onDiscard).toHaveBeenCalled();
  });

  it("should display time ago text", () => {
    const onRecover = vi.fn();
    const onDiscard = vi.fn();
    const draftSavedAt = Date.now() - 5 * 60 * 1000; // 5 minutes ago

    render(
      <DraftRecoveryPrompt
        formId="test-form"
        formName="User Profile"
        onRecover={onRecover}
        onDiscard={onDiscard}
        draftSavedAt={draftSavedAt}
      />,
    );

    expect(screen.getByText(/5 minutes ago/)).toBeInTheDocument();
  });
});

describe("RecentItemsRail", () => {
  const mockItems = [
    {
      id: "1",
      title: "Game 1",
      subtitle: "Active",
      accessedAt: Date.now(),
    },
    {
      id: "2",
      title: "Game 2",
      subtitle: "Completed",
      accessedAt: Date.now() - 1000,
    },
  ];

  it("should render recent items", () => {
    render(<RecentItemsRail items={mockItems} title="Recent Games" />);

    expect(screen.getByText("Recent Games")).toBeInTheDocument();
    expect(screen.getByText("Game 1")).toBeInTheDocument();
    expect(screen.getByText("Game 2")).toBeInTheDocument();
  });

  it("should call onItemClick when item is clicked", () => {
    const onItemClick = vi.fn();

    render(<RecentItemsRail items={mockItems} onItemClick={onItemClick} />);

    const item = screen.getByTestId("recent-items-rail-item-1");
    fireEvent.click(item);

    expect(onItemClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it("should show empty state when no items", () => {
    render(<RecentItemsRail items={[]} emptyMessage="No recent items" />);

    expect(screen.getByText("No recent items")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<RecentItemsRail items={[]} isLoading={true} />);

    expect(screen.getByTestId("recent-items-rail")).toBeInTheDocument();
  });

  it("should limit items to maxItems", () => {
    const manyItems = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      title: `Item ${i}`,
      accessedAt: Date.now() - i * 1000,
    }));

    render(<RecentItemsRail items={manyItems} maxItems={5} />);

    const items = screen.getAllByTestId(/recent-items-rail-item-/);
    expect(items).toHaveLength(5);
  });
});

describe("PropertyList", () => {
  const mockProperties = [
    { key: "Name", value: "John Doe" },
    {
      key: "Email",
      value: "john@example.com",
      type: "link" as const,
      href: "mailto:john@example.com",
    },
    {
      key: "Status",
      value: "Active",
      type: "badge" as const,
      tone: "success" as const,
    },
    { key: "ID", value: "abc123", type: "code" as const },
  ];

  it("should render properties", () => {
    render(<PropertyList properties={mockProperties} title="User Details" />);

    expect(screen.getByText("User Details")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("should render links", () => {
    render(<PropertyList properties={mockProperties} />);

    const link = screen.getByText("john@example.com");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "mailto:john@example.com");
  });

  it("should render badges", () => {
    render(<PropertyList properties={mockProperties} />);

    const badge = screen.getByText("Active");
    expect(badge).toHaveClass("property-list__badge--success");
  });

  it("should render code", () => {
    render(<PropertyList properties={mockProperties} />);

    const code = screen.getByText("abc123");
    expect(code.tagName).toBe("CODE");
  });

  it("should show empty state when no properties", () => {
    render(<PropertyList properties={[]} emptyMessage="No properties" />);

    expect(screen.getByText("No properties")).toBeInTheDocument();
  });

  it("should show loading state", () => {
    render(<PropertyList properties={[]} isLoading={true} />);

    expect(screen.getByTestId("property-list")).toBeInTheDocument();
  });

  it("should support multi-column layout", () => {
    const { container } = render(
      <PropertyList properties={mockProperties} columns={2} />,
    );

    const grid = container.querySelector(".property-list__grid");
    expect(grid).toBeInTheDocument();
  });

  it("should filter out undefined values", () => {
    const propsWithUndefined = [
      { key: "Name", value: "John" },
      { key: "Empty", value: undefined },
      { key: "Email", value: "john@example.com" },
    ];

    render(<PropertyList properties={propsWithUndefined as any} />);

    expect(screen.getByText("John")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.queryByText("Empty")).not.toBeInTheDocument();
  });
});
