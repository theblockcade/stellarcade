import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ProfilePage from "./page";

describe("ProfilePage", () => {
  it("renders the ProfileSettings component", async () => {
    render(<ProfilePage />);
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "Profile Settings" })).toBeInTheDocument();
    });
  });
});
