import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const push = vi.fn();
let currentPathname = "/app";

vi.mock("next/navigation", () => ({
  usePathname: () => currentPathname,
  useRouter: () => ({ push }),
}));

const { default: AppShell } = await import("./AppShell");

describe("AppShell", () => {
  it("highlights the lobby link when on /app", () => {
    currentPathname = "/app";
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );
    expect(screen.getByTestId("app-sidebar-link-lobby")).toHaveAttribute("aria-current", "page");
  });

  it("highlights the profile link when on /profile", () => {
    currentPathname = "/profile";
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );
    expect(screen.getByTestId("app-sidebar-link-profile")).toHaveAttribute("aria-current", "page");
  });

  it("highlights the portfolio link when on /portfolio", () => {
    currentPathname = "/portfolio";
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );
    expect(screen.getByTestId("app-sidebar-link-portfolio")).toHaveAttribute("aria-current", "page");
  });

  it("navigates via router.push when a sidebar link is clicked", () => {
    currentPathname = "/app";
    push.mockClear();
    render(
      <AppShell>
        <div>content</div>
      </AppShell>,
    );
    screen.getByTestId("app-sidebar-link-profile").click();
    expect(push).toHaveBeenCalledWith("/profile");
  });

  it("renders the page content inside the main region", () => {
    currentPathname = "/app";
    render(
      <AppShell>
        <div data-testid="page-content">hello</div>
      </AppShell>,
    );
    expect(screen.getByTestId("page-content")).toBeInTheDocument();
  });
});
