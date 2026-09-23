// Shared, deterministic rules for the ServeWise operational-data workbook.
// The template generator, the browser parser and the server validator all use this module,
// so the template and importer can never drift apart.

export const IMPORT_SHEET = "Service Records";
export const EXAMPLES_SHEET = "Examples (never imported)";
export const INSTRUCTIONS_SHEET = "Instructions";
export const MAX_IMPORT_ROWS = 2000;
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export const importFields = [
  "service_date",
  "meal",
  "menu",
  "expected_attendance",
  "actual_attendance",
  "prepared_quantity",
  "consumed_quantity",
  "notes",
] as const;
export type ImportField = (typeof importFields)[number];

export const requiredFields: ReadonlySet<ImportField> = new Set([
  "service_date",
  "meal",
  "menu",
  "expected_attendance",
  "prepared_quantity",
  "consumed_quantity",
]);

export const fieldLabel: Record<ImportField, string> = {
  service_date: "Service Date",
  meal: "Meal",
  menu: "Menu",
  expected_attendance: "Expected Attendance",
  actual_attendance: "Actual Attendance",
  prepared_quantity: "Prepared Quantity",
  consumed_quantity: "Consumed Quantity",
  notes: "Notes",
};

export const headerFor = (f: ImportField) => (requiredFields.has(f) ? `${f} *` : f);
export const mealValues = ["Breakfast", "Lunch", "Dinner"] as const;
const mealMap = { breakfast: "breakfast", lunch: "lunch", dinner: "dinner" } as const;

export type Cell = string | number | null;
export type RawRow = { row: number; cells: Partial<Record<ImportField, Cell>> };

export type CleanRow = {
  serviceDate: string;
  mealPeriod: "breakfast" | "lunch" | "dinner";
  menuName: string;
  expectedAttendance: number;
  actualAttendance: number | null;
  preparedQuantity: number;
  consumedQuantity: number;
  notes: string | null;
};

export type RowIssue = { severity: "error" | "warning"; message: string };
export type ValidatedRow = {
  row: number;
  status: "valid" | "warning" | "error";
  display: Record<ImportField, string>;
  issues: RowIssue[];
  clean: CleanRow | null;
};

/** Normalise a header cell: "Service_Date *" → "service_date". */
export const normaliseHeader = (h: string) =>
  h
    .trim()
    .replace(/\s*\*\s*$/, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");

const text = (v: Cell) => (v === null || v === undefined ? "" : String(v).trim());

function parseDate(v: Cell, today: string): { value?: string; error?: string } {
  const s = text(v);
  if (!s) return { error: "Service Date is missing." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
    return { error: `Service Date "${s}" is not a valid date. Use YYYY-MM-DD.` };
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s)
    return { error: `Service Date "${s}" is not a real calendar date.` };
  if (s > today) return { error: "Service Date can't be in the future." };
  if (s < "2000-01-01") return { error: "Service Date must be in the year 2000 or later." };
  return { value: s };
}

function parseCount(v: Cell, f: ImportField): { value?: number | null; error?: string } {
  const s = text(v);
  if (!s)
    return requiredFields.has(f) ? { error: `${fieldLabel[f]} is missing.` } : { value: null };
  if (!/^\d+$/.test(s)) {
    return {
      error: /^-/.test(s)
        ? `${fieldLabel[f]} can't be negative.`
        : `${fieldLabel[f]} must be a whole number (found "${s.slice(0, 30)}").`,
    };
  }
  const n = Number(s);
  if (n > 1_000_000) return { error: `${fieldLabel[f]} is too large.` };
  return { value: n };
}

/**
 * Validate every row. `existing` holds "date|meal" keys already stored for the kitchen
 * (excluding any import being replaced), so duplicates against the database are errors too.
 */
export function validateRows(rows: RawRow[], existing: Set<string>, today: string): ValidatedRow[] {
  const seen = new Map<string, number>();
  return rows.map(({ row, cells }) => {
    const issues: RowIssue[] = [];
    const err = (message: string) => issues.push({ severity: "error", message });
    const display = Object.fromEntries(
      importFields.map((f) => [f, text(cells[f] ?? null)]),
    ) as Record<ImportField, string>;

    const date = parseDate(cells.service_date ?? null, today);
    if (date.error) err(date.error);

    const mealText = display.meal.toLowerCase() as keyof typeof mealMap;
    const meal = mealMap[mealText];
    if (!display.meal) err("Meal is missing.");
    else if (!meal)
      err(`Meal "${display.meal.slice(0, 30)}" is not allowed. Use Breakfast, Lunch or Dinner.`);

    const menu = display.menu;
    if (!menu) err("Menu is missing.");
    else if (menu.length > 200) err("Menu must be 200 characters or fewer.");

    const counts = {
      expected_attendance: parseCount(cells.expected_attendance ?? null, "expected_attendance"),
      actual_attendance: parseCount(cells.actual_attendance ?? null, "actual_attendance"),
      prepared_quantity: parseCount(cells.prepared_quantity ?? null, "prepared_quantity"),
      consumed_quantity: parseCount(cells.consumed_quantity ?? null, "consumed_quantity"),
    };
    for (const c of Object.values(counts)) if (c.error) err(c.error);

    const notes = display.notes;
    if (notes.length > 1000) err("Notes must be 1000 characters or fewer.");

    if (date.value && meal) {
      const key = `${date.value}|${meal}`;
      const first = seen.get(key);
      if (first !== undefined) err(`Duplicate of row ${first}: same date and meal.`);
      else {
        seen.set(key, row);
        if (existing.has(key)) err("A record for this date and meal already exists in ServeWise.");
      }
    }

    const prepared = counts.prepared_quantity.value;
    const consumed = counts.consumed_quantity.value;
    if (typeof prepared === "number" && typeof consumed === "number" && consumed > prepared)
      issues.push({ severity: "warning", message: "Consumed Quantity exceeds Prepared Quantity." });

    const hasError = issues.some((i) => i.severity === "error");
    return {
      row,
      display,
      issues,
      status: hasError ? "error" : issues.length ? "warning" : "valid",
      clean: hasError
        ? null
        : {
            serviceDate: date.value!,
            mealPeriod: meal!,
            menuName: menu,
            expectedAttendance: counts.expected_attendance.value as number,
            actualAttendance: counts.actual_attendance.value ?? null,
            preparedQuantity: prepared as number,
            consumedQuantity: consumed as number,
            notes: notes || null,
          },
    };
  });
}

/** Structural checks on the header row. Returns column index per field or blocking errors. */
export function mapHeaders(headers: string[]): {
  columns?: Record<ImportField, number>;
  errors: string[];
} {
  const errors: string[] = [];
  const columns: Partial<Record<ImportField, number>> = {};
  headers.forEach((raw, i) => {
    if (!raw.trim()) return;
    const key = normaliseHeader(raw) as ImportField;
    if (!importFields.includes(key)) {
      errors.push(
        `Unexpected column "${raw.trim().slice(0, 40)}". Use the columns from the ServeWise template.`,
      );
    } else if (columns[key] !== undefined) {
      errors.push(`Column "${key}" appears more than once.`);
    } else columns[key] = i;
  });
  for (const f of importFields)
    if (columns[f] === undefined) errors.push(`Required column "${headerFor(f)}" is missing.`);
  return errors.length ? { errors } : { columns: columns as Record<ImportField, number>, errors };
}
