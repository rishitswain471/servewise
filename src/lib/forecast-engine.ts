/**
 * ServeWise deterministic demand engine — method "sw-demand-v1".
 *
 * Pure functions only: same inputs → same outputs. No AI, no randomness, no clock reads.
 *
 * 1. Comparable history: same organization (enforced server-side), same meal period,
 *    service date strictly before the planned date, consumed quantity recorded and
 *    actual attendance > 0. Every other record is excluded with a stated reason.
 * 2. Window: the most recent WINDOW comparable services.
 * 3. Signal: consumption rate per attendee r = consumed / actual attendance.
 * 4. Outliers (n ≥ 5): rates are clamped (not discarded) to median ± 3 × 1.4826 × MAD.
 * 5. Recency: weight w = 0.5^(age / HALF_LIFE), age 0 = most recent. Bounded in (0, 1].
 * 6. Rate = Σ w·r / Σ w.   Forecast = round(expected attendance × rate).
 * 7. Buffer:
 *    - sufficient history (n ≥ MIN_HISTORY): ceil(expected × weighted std-dev of rates),
 *      i.e. one standard deviation of observed demand, capped at MAX_BUFFER_SHARE × forecast.
 *    - limited history: variability cannot be estimated reliably, so a fixed
 *      LIMITED_BUFFER_SHARE × forecast (rounded up) is used and labelled as such.
 *    Preparation = forecast + buffer.
 */
export const METHOD_VERSION = "sw-demand-v1";
export const MIN_HISTORY = 7;
export const WINDOW = 28;
export const HALF_LIFE = 7;
export const MAX_BUFFER_SHARE = 0.15;
export const LIMITED_BUFFER_SHARE = 0.05;

export type HistoryRecord = {
  id: string;
  serviceDate: string;
  menuName: string;
  actualAttendance: number | null;
  consumedQuantity: number | null;
  preparedQuantity: number | null;
};

export type ForecastResult =
  | { status: "none"; totalRecords: number; exclusions: Exclusions }
  | {
      status: "limited" | "sufficient";
      totalRecords: number;
      exclusions: Exclusions;
      used: number;
      expectedAttendance: number;
      rate: number;
      medianRate: number;
      unweightedRate: number;
      stdDev: number | null;
      clamped: number;
      overPrepared: number;
      forecast: number;
      buffer: number;
      bufferRule: "variability" | "variability-capped" | "limited-fixed" | "zero";
      preparation: number;
      oldest: string;
      newest: string;
      samples: { id: string; serviceDate: string; menuName: string; rate: number; weight: number }[];
    };

export type Exclusions = { noAttendance: number; noConsumption: number; beyondWindow: number };

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const safe = (n: number) => (Number.isFinite(n) && n >= 0 ? n : 0);

export function computeForecast(
  history: HistoryRecord[],
  plannedDate: string,
  expectedAttendanceInput: number,
): ForecastResult {
  const expectedAttendance = Math.max(0, Math.round(safe(expectedAttendanceInput)));
  const exclusions: Exclusions = { noAttendance: 0, noConsumption: 0, beyondWindow: 0 };
  const prior = history
    .filter((r) => r.serviceDate < plannedDate)
    .sort((a, b) =>
      a.serviceDate === b.serviceDate ? a.id.localeCompare(b.id) : b.serviceDate.localeCompare(a.serviceDate),
    );
  const usable: HistoryRecord[] = [];
  for (const r of prior) {
    if (r.consumedQuantity == null) exclusions.noConsumption++;
    else if (!r.actualAttendance || r.actualAttendance <= 0) exclusions.noAttendance++;
    else usable.push(r);
  }
  exclusions.beyondWindow = Math.max(0, usable.length - WINDOW);
  const window = usable.slice(0, WINDOW);
  if (window.length === 0) return { status: "none", totalRecords: prior.length, exclusions };

  const raw = window.map((r) => r.consumedQuantity! / r.actualAttendance!);
  const med = median(raw);
  let clamped = 0;
  let rates = raw;
  if (raw.length >= 5) {
    const mad = median(raw.map((x) => Math.abs(x - med))) * 1.4826;
    if (mad > 0) {
      const lo = Math.max(0, med - 3 * mad);
      const hi = med + 3 * mad;
      rates = raw.map((x) => {
        const c = Math.min(hi, Math.max(lo, x));
        if (c !== x) clamped++;
        return c;
      });
    }
  }
  const weights = rates.map((_, i) => Math.pow(0.5, i / HALF_LIFE));
  const wSum = weights.reduce((a, b) => a + b, 0);
  const rate = rates.reduce((a, r, i) => a + r * weights[i]!, 0) / wSum;
  const sufficient = window.length >= MIN_HISTORY;
  let stdDev: number | null = null;
  if (window.length >= 2) {
    const v = rates.reduce((a, r, i) => a + weights[i]! * (r - rate) ** 2, 0) / wSum;
    stdDev = Math.sqrt(v);
  }
  const forecast = Math.round(expectedAttendance * safe(rate));
  let buffer = 0;
  let bufferRule: "variability" | "variability-capped" | "limited-fixed" | "zero" = "zero";
  if (forecast > 0) {
    if (sufficient && stdDev != null) {
      const b = Math.ceil(expectedAttendance * stdDev);
      const cap = Math.ceil(forecast * MAX_BUFFER_SHARE);
      buffer = Math.min(b, cap);
      bufferRule = b > cap ? "variability-capped" : "variability";
    } else {
      buffer = Math.ceil(forecast * LIMITED_BUFFER_SHARE);
      bufferRule = "limited-fixed";
    }
  }
  return {
    status: sufficient ? "sufficient" : "limited",
    totalRecords: prior.length,
    exclusions,
    used: window.length,
    expectedAttendance,
    rate: safe(rate),
    medianRate: med,
    unweightedRate: raw.reduce((a, b) => a + b, 0) / raw.length,
    stdDev,
    clamped,
    overPrepared: window.filter((r) => r.preparedQuantity != null && r.consumedQuantity! > r.preparedQuantity).length,
    forecast,
    buffer,
    bufferRule,
    preparation: forecast + buffer,
    oldest: window[window.length - 1]!.serviceDate,
    newest: window[0]!.serviceDate,
    samples: window.map((r, i) => ({
      id: r.id,
      serviceDate: r.serviceDate,
      menuName: r.menuName,
      rate: rates[i]!,
      weight: weights[i]!,
    })),
  };
}

/** Human-readable explanation built only from the computed result. */
export function explainForecast(r: ForecastResult, meal: string): string[] {
  if (r.status === "none")
    return [`Not enough historical data yet. No usable past ${meal} services were found.`];
  const lines: string[] = [];
  lines.push(
    `${r.status === "limited" ? "Limited historical data. " : ""}Based on ${r.used} comparable ${meal} service${r.used === 1 ? "" : "s"} (${r.oldest} to ${r.newest}).`,
  );
  lines.push(
    `Recency-weighted consumption was ${r.rate.toFixed(3)} meals per attendee (simple average ${r.unweightedRate.toFixed(3)}); recent services count more, halving in weight every ${HALF_LIFE} services.`,
  );
  if (r.clamped)
    lines.push(`${r.clamped} unusual service${r.clamped === 1 ? " was" : "s were"} limited to the typical range so ${r.clamped === 1 ? "it does" : "they do"} not dominate the result.`);
  lines.push(`${r.expectedAttendance.toLocaleString()} expected attendees × ${r.rate.toFixed(3)} = ${r.forecast.toLocaleString()} meals (rounded).`);
  if (r.bufferRule === "variability")
    lines.push(`Buffer of ${r.buffer} meals = one standard deviation of past demand (${r.stdDev!.toFixed(3)} per attendee × ${r.expectedAttendance}, rounded up).`);
  else if (r.bufferRule === "variability-capped")
    lines.push(`Past demand varied widely, so the buffer is capped at ${MAX_BUFFER_SHARE * 100}% of forecast: ${r.buffer} meals.`);
  else if (r.bufferRule === "limited-fixed")
    lines.push(`Variability can't be measured reliably from fewer than ${MIN_HISTORY} services, so a fixed ${LIMITED_BUFFER_SHARE * 100}% buffer is used: ${r.buffer} meals.`);
  else lines.push("No buffer is added because forecast demand is zero.");
  const ex = r.exclusions;
  if (ex.noAttendance) lines.push(`${ex.noAttendance} record${ex.noAttendance === 1 ? " was" : "s were"} excluded because actual attendance was missing or zero.`);
  if (ex.noConsumption) lines.push(`${ex.noConsumption} record${ex.noConsumption === 1 ? " was" : "s were"} excluded because consumption was missing.`);
  if (ex.beyondWindow) lines.push(`${ex.beyondWindow} older record${ex.beyondWindow === 1 ? " is" : "s are"} outside the ${WINDOW}-service window.`);
  if (r.overPrepared) lines.push(`${r.overPrepared} service${r.overPrepared === 1 ? "" : "s"} recorded more consumed than prepared; used as recorded.`);
  return lines;
}
