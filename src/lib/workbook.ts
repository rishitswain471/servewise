// Browser-only workbook helpers. exceljs is loaded on demand so it never enters SSR.
import {
  EXAMPLES_SHEET,
  IMPORT_SHEET,
  INSTRUCTIONS_SHEET,
  MAX_FILE_BYTES,
  MAX_IMPORT_ROWS,
  headerFor,
  importFields,
  mapHeaders,
  mealValues,
  type Cell,
  type RawRow,
} from "@/lib/import-rules";

const loadExcel = async () => (await import("exceljs")).default;
const FONT = "Arial";
const GREEN = "FF2F5D3A";
const TEMPLATE_ROWS = 1000;

const widths: Record<(typeof importFields)[number], number> = {
  service_date: 16,
  meal: 13,
  menu: 42,
  expected_attendance: 22,
  actual_attendance: 20,
  prepared_quantity: 20,
  consumed_quantity: 21,
  notes: 44,
};

const examples: (string | number | null)[][] = [
  ["2026-09-14", "Breakfast", "Poha, boiled eggs, tea", 420, 398, 430, 395, null],
  ["2026-09-14", "Lunch", "Rice, dal tadka, mixed vegetables, curd", 610, 587, 620, 571, null],
  [
    "2026-09-14",
    "Dinner",
    "Chapati, paneer butter masala, jeera rice",
    580,
    541,
    590,
    548,
    "Cricket match on campus",
  ],
  [
    "2026-09-15",
    "Lunch",
    "Veg biryani, raita, salad",
    600,
    null,
    610,
    604,
    "Actual headcount not taken",
  ],
];

const instructions: [string, string][] = [
  ["Purpose", "This workbook loads your kitchen's past meal services into ServeWise in one step."],
  [
    "How ServeWise uses it",
    "Each row is one meal service: one date and one meal, with its menu, attendance and the meals prepared and consumed. These records become your kitchen's operational history.",
  ],
  ["What to fill", "Fill only the Service Records sheet with your real operational data."],
  [
    "Examples",
    "Examples (never imported) contains sample data only. ServeWise ignores that sheet and this Instructions sheet.",
  ],
  [
    "Required fields",
    "Columns marked * are required: service_date, meal, menu, expected_attendance, prepared_quantity, consumed_quantity.",
  ],
  ["Optional fields", "actual_attendance and notes may be left blank."],
  [
    "service_date",
    "A real date, not in the future. Enter it as a date (for example 2026-09-14) — the column is already formatted as YYYY-MM-DD.",
  ],
  ["meal", "Choose from the dropdown: Breakfast, Lunch or Dinner. Other values are rejected."],
  ["menu", "What was served, up to 200 characters."],
  [
    "Attendance",
    "expected_attendance and actual_attendance are numbers of people: whole numbers, 0 or more.",
  ],
  [
    "Quantities",
    "prepared_quantity and consumed_quantity are counted in meals: whole numbers, 0 or more. If consumed is higher than prepared, ServeWise shows a warning for you to confirm — it never changes your numbers.",
  ],
  ["notes", "Optional context such as a holiday or event, up to 1000 characters."],
  [
    "Duplicates",
    "Only one row per date and meal. A row that repeats another row, or a meal service already stored in ServeWise, is flagged as an error.",
  ],
  [
    "Limits",
    `Up to ${MAX_IMPORT_ROWS.toLocaleString()} rows and 5 MB per file. Do not rename the sheet or its columns.`,
  ],
  [
    "What happens on import",
    "ServeWise reads the file and checks every row before anything is saved. You then review the results.",
  ],
  [
    "Errors and warnings",
    "Errors (missing or invalid values, duplicates) must be fixed before you can import. Warnings can be imported once you confirm them.",
  ],
  [
    "Fixing errors",
    "Correct the listed rows in this workbook, save it, and upload it again. Nothing is saved until you confirm.",
  ],
  [
    "After import",
    "Imported records can be edited or deleted directly in ServeWise under Menu & Consumption. You do not need to re-upload Excel for normal corrections.",
  ],
  [
    "Replacing an import",
    "Use Replace on a previous import to upload a corrected workbook. The old records are only replaced after the new file passes every check and you confirm.",
  ],
  [
    "Removing an import",
    "Remove deletes only the records created by that import. Records you added by hand are never affected.",
  ],
];

function styleHeader(row: import("exceljs").Row) {
  row.height = 22;
  row.eachCell((c) => {
    c.font = { name: FONT, bold: true, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    c.alignment = { vertical: "middle" };
  });
}

function applyColumns(ws: import("exceljs").Worksheet) {
  ws.columns = importFields.map((f) => ({ header: headerFor(f), key: f, width: widths[f] }));
  styleHeader(ws.getRow(1));
  ws.views = [{ state: "frozen", ySplit: 1 }];
}

export async function downloadTemplate() {
  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  wb.creator = "ServeWise";

  const info = wb.addWorksheet(INSTRUCTIONS_SHEET);
  info.columns = [{ width: 26 }, { width: 110 }];
  info.getCell("A1").value = "ServeWise — Operational Data Template";
  info.getCell("A1").font = { name: FONT, bold: true, size: 14, color: { argb: GREEN } };
  info.getCell("A2").value = "Fill only the Service Records sheet with your real operational data.";
  info.getCell("A2").font = { name: FONT, bold: true };
  instructions.forEach(([k, v], i) => {
    const r = info.getRow(i + 4);
    r.values = [k, v];
    r.getCell(1).font = { name: FONT, bold: true };
    r.getCell(2).font = { name: FONT };
    r.getCell(2).alignment = { wrapText: true, vertical: "top" };
    r.getCell(1).alignment = { vertical: "top" };
  });

  const ws = wb.addWorksheet(IMPORT_SHEET);
  applyColumns(ws);
  const last = TEMPLATE_ROWS + 1;
  for (let r = 2; r <= last; r++) {
    const row = ws.getRow(r);
    row.font = { name: FONT };
    row.getCell(1).numFmt = "yyyy-mm-dd";
    row.getCell(1).dataValidation = {
      type: "date",
      operator: "greaterThanOrEqual",
      allowBlank: true,
      formulae: [new Date(Date.UTC(2000, 0, 1))],
      showErrorMessage: true,
      errorTitle: "Invalid date",
      error: "Enter a real date such as 2026-09-14.",
    };
    row.getCell(2).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`"${mealValues.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Invalid meal",
      error: "Choose Breakfast, Lunch or Dinner.",
    };
    row.getCell(3).dataValidation = {
      type: "textLength",
      operator: "lessThanOrEqual",
      allowBlank: true,
      formulae: [200],
      showErrorMessage: true,
      error: "Menu must be 200 characters or fewer.",
    };
    for (let c = 4; c <= 7; c++) {
      row.getCell(c).numFmt = "0";
      row.getCell(c).dataValidation = {
        type: "whole",
        operator: "between",
        allowBlank: true,
        formulae: [0, 1000000],
        showErrorMessage: true,
        errorTitle: "Whole number required",
        error: "Enter a whole number, 0 or more.",
      };
    }
    row.getCell(8).dataValidation = {
      type: "textLength",
      operator: "lessThanOrEqual",
      allowBlank: true,
      formulae: [1000],
      showErrorMessage: true,
      error: "Notes must be 1000 characters or fewer.",
    };
  }

  const ex = wb.addWorksheet(EXAMPLES_SHEET, { properties: { tabColor: { argb: "FFC2410C" } } });
  ex.getCell("A1").value = "SAMPLE / EXAMPLE — NEVER IMPORTED";
  ex.getCell("A1").font = { name: FONT, bold: true, color: { argb: "FFC2410C" }, size: 13 };
  ex.getCell("A2").value =
    "These rows show the expected format only. Enter your data on the Service Records sheet.";
  ex.getCell("A2").font = { name: FONT, italic: true };
  ex.getRow(4).values = importFields.map(headerFor);
  styleHeader(ex.getRow(4));
  importFields.forEach((f, i) => (ex.getColumn(i + 1).width = widths[f]));
  examples.forEach((values, i) => {
    const r = ex.getRow(5 + i);
    r.values = values;
    r.font = { name: FONT, color: { argb: "FF6B6B6B" } };
    r.eachCell(
      (c) => (c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF4E5" } }),
    );
  });
  ex.views = [{ state: "frozen", ySplit: 4 }];

  const buf = await wb.xlsx.writeBuffer();
  const url = URL.createObjectURL(
    new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "servewise-operational-data-template.xlsx";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type ParseResult = { ok: true; rows: RawRow[] } | { ok: false; errors: string[] };

const pad = (n: number) => String(n).padStart(2, "0");

function cellValue(v: unknown): Cell {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "invalid date";
    // exceljs returns dates as UTC midnight; read UTC parts so the calendar day never shifts.
    return `${v.getUTCFullYear()}-${pad(v.getUTCMonth() + 1)}-${pad(v.getUTCDate())}`;
  }
  if (typeof v === "number" || typeof v === "string")
    return typeof v === "string" ? v.slice(0, 2000) : v;
  if (typeof v === "boolean") return String(v);
  if (typeof v === "object") {
    const o = v as {
      result?: unknown;
      richText?: { text: string }[];
      text?: unknown;
      error?: string;
    };
    if (o.error) return String(o.error);
    if ("result" in o) return cellValue(o.result);
    if (o.richText)
      return o.richText
        .map((t) => t.text)
        .join("")
        .slice(0, 2000);
    if (o.text !== undefined) return cellValue(o.text);
  }
  return String(v).slice(0, 2000);
}

export async function parseWorkbook(file: File): Promise<ParseResult> {
  if (!/\.xlsx$/i.test(file.name))
    return { ok: false, errors: ["Choose an Excel workbook (.xlsx)."] };
  if (file.size === 0) return { ok: false, errors: ["This file is empty."] };
  if (file.size > MAX_FILE_BYTES) return { ok: false, errors: ["This file is larger than 5 MB."] };

  const ExcelJS = await loadExcel();
  const wb = new ExcelJS.Workbook();
  try {
    await wb.xlsx.load(await file.arrayBuffer());
  } catch {
    return {
      ok: false,
      errors: ["This file couldn't be read as an Excel workbook. Save it as .xlsx and try again."],
    };
  }
  const ws = wb.worksheets.find((s) => s.name.trim().toLowerCase() === IMPORT_SHEET.toLowerCase());
  if (!ws)
    return {
      ok: false,
      errors: [
        `The workbook has no "${IMPORT_SHEET}" sheet. Download the ServeWise template and use it.`,
      ],
    };

  const header = ws.getRow(1);
  const headers: string[] = [];
  for (let c = 1; c <= Math.max(header.cellCount, importFields.length); c++)
    headers.push(String(cellValue(header.getCell(c).value) ?? ""));
  if (headers.every((h) => !h.trim()))
    return { ok: false, errors: ["The Service Records sheet has no header row."] };
  const mapped = mapHeaders(headers);
  if (!mapped.columns) return { ok: false, errors: mapped.errors };

  const rows: RawRow[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const cells: RawRow["cells"] = {};
    let blank = true;
    for (const f of importFields) {
      let v = cellValue(row.getCell(mapped.columns[f] + 1).value);
      if (typeof v === "string" && !v.trim()) v = null;
      if (v !== null) blank = false;
      cells[f] = v;
    }
    if (blank) continue;
    rows.push({ row: r, cells });
    if (rows.length > MAX_IMPORT_ROWS)
      return {
        ok: false,
        errors: [
          `The workbook has more than ${MAX_IMPORT_ROWS.toLocaleString()} rows. Split it into smaller files.`,
        ],
      };
  }
  if (!rows.length) return { ok: false, errors: ["The Service Records sheet has no data rows."] };
  return { ok: true, rows };
}
