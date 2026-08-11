import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import AboutPage from "./page";

describe("AboutPage", () => {
  it("renders the main heading and subtitle", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 1, name: /About StellarCade/i })).toBeInTheDocument();
    expect(screen.getByText(/provably fair gaming ecosystem/i)).toBeInTheDocument();
  });

  it("renders all 4 family repositories", () => {
    render(<AboutPage />);
    expect(screen.getByText(/Web App & Soroban Contracts/i)).toBeInTheDocument();
    expect(screen.getByText(/TypeScript SDK & Client Verifier/i)).toBeInTheDocument();
    expect(screen.getByText(/High-Throughput Settlement Arbiter/i)).toBeInTheDocument();
    expect(screen.getByText(/Community Discord & Telegram Bot/i)).toBeInTheDocument();
    expect(screen.getByText(/^github\.com\/theblockcade\/stellarcade$/i)).toBeInTheDocument();
    expect(screen.getByText(/^github\.com\/theblockcade\/stellarcade-sdk$/i)).toBeInTheDocument();
    expect(screen.getByText(/^github\.com\/theblockcade\/stellarcade-arbiter$/i)).toBeInTheDocument();
    expect(screen.getByText(/^github\.com\/theblockcade\/stellarcade-bot$/i)).toBeInTheDocument();
  });

  it("renders the fairness explanation section and verify CTA", () => {
    render(<AboutPage />);
    expect(screen.getByRole("heading", { level: 2, name: /How Provable Fairness Works/i })).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Commitment/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 2: Entropy Mix/i)).toBeInTheDocument();
    expect(screen.getByText(/Step 3: Verification/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Launch Interactive Fairness Verifier/i })).toHaveAttribute(
      "href",
      "/verify"
    );
  });
});
