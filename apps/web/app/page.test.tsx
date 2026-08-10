import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LandingPage from "./page.js";

describe("LandingPage", () => {
  it("renders the hero heading", () => {
    render(<LandingPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "The provably-fair arcade, on-chain",
    );
  });

  it("links to the arcade app and the games list", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: "Enter the arcade" })).toHaveAttribute("href", "/app");
    expect(screen.getByRole("link", { name: "Browse games" })).toHaveAttribute("href", "/games");
  });

  it("renders all four feature cards", () => {
    render(<LandingPage />);
    expect(screen.getByText("Provably fair")).toBeInTheDocument();
    expect(screen.getByText("No custody, ever")).toBeInTheDocument();
    expect(screen.getByText("Real prize pools")).toBeInTheDocument();
    expect(screen.getByText("Built for Stellar")).toBeInTheDocument();
  });

  it("has a skip link targeting #main", () => {
    render(<LandingPage />);
    expect(screen.getByText("Skip to main content")).toHaveAttribute("href", "#main");
  });

  it("footer links to terms and privacy", () => {
    render(<LandingPage />);
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
  });
});
