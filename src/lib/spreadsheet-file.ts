import { parseCsvText } from "@/lib/student-csv";

/** File picker `accept` for imports that understand both CSV and Excel. */
export const SPREADSHEET_ACCEPT =
  ".csv,.tsv,.txt,.xlsx,text/csv,text/tab-separated-values,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export class SpreadsheetReadError extends Error {
  constructor(
    message: string,
    readonly description?: string,
  ) {
    super(message);
    this.name = "SpreadsheetReadError";
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    // Excel dates are calendar values; read them in UTC to avoid timezone day shifts.
    return `${pad2(value.getUTCDate())}-${pad2(value.getUTCMonth() + 1)}-${value.getUTCFullYear()}`;
  }
  if (typeof value === "number") {
    // Long numbers (phones, Aadhaar) must not become 9.87e+9.
    return Number.isInteger(value) ? value.toFixed(0) : String(value);
  }
  return String(value).trim();
}

/**
 * Heuristic for "this is not a text spreadsheet": NUL bytes, many U+FFFD replacement
 * characters, or a ZIP/OLE signature (xlsx / xls opened as text).
 */
export function looksLikeBinaryText(text: string): boolean {
  const sample = text.slice(0, 4096);
  if (!sample) return false;
  if (sample.startsWith("PK\u0003\u0004") || sample.startsWith("\u00D0\u00CF\u0011\u00E0")) {
    return true;
  }
  let suspicious = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if (code === 0) return true;
    if (code === 0xfffd || (code < 32 && code !== 9 && code !== 10 && code !== 13)) {
      suspicious += 1;
    }
  }
  return suspicious / sample.length > 0.02;
}

async function readXlsx(file: File): Promise<string[][]> {
  const { readSheet } = await import("read-excel-file/browser");
  try {
    const data = await readSheet(file);
    return data.map((row) => row.map(cellToText)).filter((row) => row.some((cell) => cell !== ""));
  } catch {
    throw new SpreadsheetReadError(
      "Could not read this Excel file",
      "The file may be damaged or password-protected. Open it in Excel and use Save As → CSV, then upload.",
    );
  }
}

/**
 * Read an uploaded CSV / TSV / .xlsx into a trimmed string table (first sheet for Excel).
 * Throws {@link SpreadsheetReadError} with a user-facing message for unsupported files.
 */
export async function readSpreadsheetTable(file: File): Promise<string[][]> {
  const name = file.name.trim().toLowerCase();
  if (name.endsWith(".xlsx")) return readXlsx(file);
  if (name.endsWith(".xls") || name.endsWith(".numbers") || name.endsWith(".ods")) {
    throw new SpreadsheetReadError(
      "This spreadsheet format isn't supported",
      "Save the file as Excel Workbook (.xlsx) or CSV, then upload again.",
    );
  }

  const text = await file.text();
  if (looksLikeBinaryText(text)) {
    // Renamed .xlsx (e.g. "students.csv" that is really a workbook) — try it as Excel.
    if (text.startsWith("PK")) return readXlsx(file);
    throw new SpreadsheetReadError(
      "This file isn't a readable CSV",
      "Upload the Excel file (.xlsx) directly, or Save As → CSV (Comma delimited) and try again.",
    );
  }
  return parseCsvText(text);
}
