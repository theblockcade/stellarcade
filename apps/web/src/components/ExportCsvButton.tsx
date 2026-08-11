"use client";

import React, { useState, useCallback } from "react";
import type { CsvColumn } from "../utils/csv";
import { serializeToCsv, downloadCsv } from "../utils/csv";

export interface ExportCsvButtonProps<T>
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick"> {
  rows: T[];
  columns: CsvColumn<T>[];
  filename: string;
  children?: React.ReactNode;
  testId?: string;
  onExportSuccess?: () => void;
  onUnsupportedBrowser?: () => void;
}

export function ExportCsvButton<T>({
  rows,
  columns,
  filename,
  children = "Export CSV",
  testId = "export-csv-button",
  onExportSuccess,
  onUnsupportedBrowser,
  className = "",
  disabled,
  ...rest
}: ExportCsvButtonProps<T>) {
  const [exporting, setExporting] = useState(false);

  const handleClick = useCallback(() => {
    if (rows.length === 0) return;

    setExporting(true);

    const content = serializeToCsv({ columns, rows });
    const supported = downloadCsv({ filename, content });

    setExporting(false);

    if (!supported) {
      onUnsupportedBrowser?.();
      return;
    }

    onExportSuccess?.();
  }, [rows, columns, filename, onExportSuccess, onUnsupportedBrowser]);

  const isEmpty = rows.length === 0;
  const isDisabled = disabled || isEmpty || exporting;

  return (
    <button
      type="button"
      className={`export-csv-button ${className}`.trim()}
      onClick={handleClick}
      disabled={isDisabled}
      aria-label={isEmpty ? "No data to export" : `Export ${filename}`}
      aria-busy={exporting}
      data-testid={testId}
      {...rest}
    >
      {children}
    </button>
  );
}

export default ExportCsvButton;
