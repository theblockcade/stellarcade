import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppPage from "./page";

describe("AppPage", () => {
  it("renders the GameLobby component", async () => {
    render(<AppPage />);
    await waitFor(() => {
      expect(screen.getByText(/Live Arena|Loading elite games/)).toBeInTheDocument();
    });
  });
});
