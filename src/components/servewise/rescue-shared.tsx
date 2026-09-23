import type { StatusTone } from "@/components/servewise/page";

export const batchStatus: Record<string, { label: string; tone: StatusTone }> = {
  pending_safety: { label: "Pending safety verification", tone: "warning" },
  safety_blocked: { label: "Safety blocked", tone: "danger" },
  available_for_offer: { label: "Safety approved · Available for offer", tone: "info" },
  offered: { label: "Offered", tone: "info" },
  completed: { label: "Redistributed", tone: "success" },
};

export const offerStatus: Record<string, { label: string; tone: StatusTone }> = {
  sent: { label: "Offer sent · Awaiting response", tone: "warning" },
  accepted: { label: "Accepted · Pickup pending", tone: "info" },
  declined: { label: "Declined", tone: "neutral" },
  pickup_scheduled: { label: "Pickup scheduled", tone: "info" },
  picked_up: { label: "Picked up · Awaiting receipt", tone: "info" },
  completed: { label: "Received · Completed", tone: "success" },
};

export const hhmm = (t: string) => t.slice(0, 5);
export const fmtDateTime = (v: string | null) =>
  v ? new Date(v).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";
export const fmtLocal = (v: string | null) =>
  v ? new Date(v.replace(" ", "T")).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

export const foodTypeLabel: Record<string, string> = {
  prepared_meals: "Prepared meals",
  packaged_food: "Packaged food",
  produce: "Fresh produce",
};

export function parseWhole(v: string): number | null {
  if (!/^\d+$/.test(v.trim())) return null;
  const n = Number(v);
  return Number.isSafeInteger(n) ? n : null;
}
