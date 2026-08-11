import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ExportCsvButton } from "./ExportCsvButton";

describe("ExportCsvButton", () => {
  it("renders export button and triggers export success", () => {
    const onSuccess = vi.fn();
    render(
      <ExportCsvButton
        rows={[{ tx: "0x123", amount: 100 }]}
        columns={[
          { header: "Tx", accessor: (r) => r.tx },
          { header: "Amount", accessor: (r) => r.amount },
        ]}
        filename="transactions.csv"
        onExportSuccess={onSuccess}
      >
        Export Transactions
      </ExportCsvButton>
    );

    const btn = screen.getByRole("button", { name: /Export transactions\.csv/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
  });
});
