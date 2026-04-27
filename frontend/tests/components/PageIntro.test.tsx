import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PageIntro } from "@/components/v1/PageIntro";

describe("PageIntro (#576)", () => {
  it("renders title only when other slots are omitted", () => {
    render(<PageIntro title="Audit Log" />);
    expect(screen.getByTestId("page-intro-title")).toHaveTextContent("Audit Log");
    expect(screen.queryByTestId("page-intro-eyebrow")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-intro-description")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-intro-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-intro-meta")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-intro-breadcrumbs")).not.toBeInTheDocument();
  });

  it("renders eyebrow + description when provided", () => {
    render(
      <PageIntro
        title="Audit Log"
        eyebrow="Operations"
        description="Every state-changing call is recorded with its caller."
      />,
    );
    expect(screen.getByTestId("page-intro-eyebrow")).toHaveTextContent("Operations");
    expect(screen.getByTestId("page-intro-description")).toHaveTextContent(
      "Every state-changing call",
    );
  });

  it("renders the actions slot for top-right buttons", () => {
    render(
      <PageIntro
        title="Treasury"
        actions={
          <button type="button" data-testid="primary-action">
            Settle
          </button>
        }
      />,
    );
    expect(screen.getByTestId("page-intro-actions")).toBeInTheDocument();
    expect(screen.getByTestId("primary-action")).toBeInTheDocument();
  });

  it("renders breadcrumbs and marks the last crumb aria-current", () => {
    render(
      <PageIntro
        title="Player Detail"
        breadcrumbs={[
          { label: "Dashboard", href: "/" },
          { label: "Players", href: "/players" },
          { label: "Alice" },
        ]}
      />,
    );
    expect(screen.getByTestId("page-intro-breadcrumbs")).toBeInTheDocument();
    expect(screen.getByTestId("page-intro-breadcrumb-2")).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByTestId("page-intro-breadcrumb-0")).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("invokes the breadcrumb onClick handler instead of navigating", () => {
    const onClick = vi.fn();
    render(
      <PageIntro
        title="Player Detail"
        breadcrumbs={[
          { label: "Dashboard", onClick },
          { label: "Alice" },
        ]}
      />,
    );
    const link = screen.getByTestId("page-intro-breadcrumb-0");
    fireEvent.click(link);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders the meta strip with label/value pairs", () => {
    render(
      <PageIntro
        title="Analytics"
        meta={[
          { label: "Last refresh", value: "2 min ago" },
          { label: "Rows", value: "1,234" },
        ]}
      />,
    );
    const strip = screen.getByTestId("page-intro-meta");
    expect(strip).toBeInTheDocument();
    expect(screen.getByTestId("page-intro-meta-0")).toHaveTextContent("Last refresh");
    expect(screen.getByTestId("page-intro-meta-1")).toHaveTextContent("1,234");
  });

  it("hides the breadcrumbs slot when the array is empty", () => {
    render(<PageIntro title="t" breadcrumbs={[]} />);
    expect(screen.queryByTestId("page-intro-breadcrumbs")).not.toBeInTheDocument();
  });

  it("hides the meta slot when the array is empty", () => {
    render(<PageIntro title="t" meta={[]} />);
    expect(screen.queryByTestId("page-intro-meta")).not.toBeInTheDocument();
  });
});
