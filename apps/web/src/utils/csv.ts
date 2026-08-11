export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => string | number | boolean | null | undefined;
}

export interface SerializeCsvOptions<T> {
  columns: CsvColumn<T>[];
  rows: T[];
}

export function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export function serializeToCsv<T>(options: SerializeCsvOptions<T>): string {
  const { columns, rows } = options;

  if (rows.length === 0) return "";

  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const body = rows.map((row) =>
    columns.map((c) => escapeCsvCell(c.accessor(row))).join(",")
  );

  return [header, ...body].join("\r\n");
}

export interface DownloadCsvOptions {
  filename: string;
  content: string;
}

export function downloadCsv(options: DownloadCsvOptions): boolean {
  const { filename, content } = options;

  if (
    typeof Blob === "undefined" ||
    typeof URL === "undefined" ||
    typeof URL.createObjectURL !== "function"
  ) {
    return false;
  }

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 100);

  return true;
}
