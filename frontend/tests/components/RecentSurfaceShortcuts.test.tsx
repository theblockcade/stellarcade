/**
 * @vitest-environment happy-dom
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, expect, it, vi } from "vitest";
import RecentSurfaceShortcuts, {
  type RecentSurfaceShortcut,
} from "@/components/v1/RecentSurfaceShortcuts";

const items: RecentSurfaceShortcut[] = [
  { id: "w-1", label: "Sponsor wallet", hint: "sponsor", href: "/wallet/1" },
  { id: "w-2", label: "Multisig peer", hint: "multisig-member", href: "/wallet/2" },
  { id: "w-3", label: "Counterparty", hint: "counterparty", href: "/wallet/3" },
];

describe("RecentSurfaceShortcuts (#788)", () => {
  it("renders each item as a navigable link with label + hint", () => {
    render(<RecentSurfaceShortcuts items={items} surfaceKind="wallet" />);
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent("Sponsor wallet");
    expect(links[0]).toHaveAttribute("href", "/wallet/1");
    expect(screen.getByText("multisig-member")).toBeInTheDocument();
  });

  it("renders the empty state when no items are provided", () => {
    render(<RecentSurfaceShortcuts items={[]} surfaceKind="contract" />);
    expect(
      screen.getByText("No other contracts visited yet.")
    ).toBeInTheDocument();
    // Empty state means no list, so no link items either.
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders skeleton blocks while loading and hides them from AT", () => {
    const { container } = render(
      <RecentSurfaceShortcuts items={items} surfaceKind="wallet" isLoading />
    );
    const list = container.querySelector(
      ".recent-surface-shortcuts__list--loading"
    );
    expect(list).not.toBeNull();
    expect(list).toHaveAttribute("aria-hidden", "true");
  });

  it("invokes onSelect for items without href and renders them as buttons", () => {
    const onSelect = vi.fn();
    const interactiveItems: RecentSurfaceShortcut[] = [
      { id: "c-1", label: "Custom item", hint: "no href" },
      { id: "c-2", label: "Disabled item", disabled: true },
    ];
    render(
      <RecentSurfaceShortcuts
        items={interactiveItems}
        surfaceKind="contract"
        onSelect={onSelect}
      />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    expect(onSelect).toHaveBeenCalledWith(interactiveItems[0]);
    // Disabled item: clicking still finds the button but onSelect must not
    // fire because the button has the `disabled` HTML attribute.
    expect(buttons[1]).toBeDisabled();
    fireEvent.click(buttons[1]);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("caps visible items at maxItems", () => {
    const many = Array.from({ length: 10 }).map<RecentSurfaceShortcut>((_, i) => ({
      id: `m-${i}`,
      label: `Item ${i}`,
    }));
    render(
      <RecentSurfaceShortcuts items={many} surfaceKind="wallet" maxItems={4} />
    );
    expect(screen.getAllByRole("button")).toHaveLength(4);
  });

  it("uses the surface-kind heading text", () => {
    render(<RecentSurfaceShortcuts items={items} surfaceKind="contract" />);
    expect(
      screen.getByRole("heading", { name: "Recent contracts" })
    ).toBeInTheDocument();
  });
});
