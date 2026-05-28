import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import AnalyticsDashboard from "../../src/pages/AnalyticsDashboard";

describe("AnalyticsDashboard page", () => {
  it("renders sparse dashboard empty shells", () => {
    render(<AnalyticsDashboard />);

    expect(
      screen.getByTestId("sparse-module-campaign-latency"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("sparse-module-reward-anomalies"),
    ).toBeInTheDocument();
  });
});
