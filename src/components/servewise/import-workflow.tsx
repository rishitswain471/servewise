import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Loader2, RefreshCw, Trash2, Upload, XCircle } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { RawRow, ValidatedRow } from "@/lib/import-rules";
import { commitImport, listImports, removeImport, validateImport, type ImportBatch } from "@/lib/records.functions";
import { parseWorkbook } from "@/lib/workbook";

export const invalidateOperationalData = (qc: ReturnType<typeof useQueryClient>) =>
  Promise.all(
    ["service-records", "service-summary", "service-today", "import-batches"].map((k) =>
      qc.invalidateQueries({ queryKey: [k] }),
    ),
  );

const localToday = () => new Date().toLocaleDateString("en-CA");
const fmtDateTime = (s: string) =>
  new Date(s).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

type Review = {
  fileName: string;
  raw: RawRow[];
  rows: ValidatedRow[];
  summary: { total: number; valid: number; warnings: number; errors: number };
};
type Stage =
  | { kind: "select"; errors?: string[] }
  | { kind: "busy"; label: string }
  | { kind: "review"; review: Review };

export function ImportDialog({
  open,
  replacing,
  onClose,
}: {
  open: boolean;
  replacing: ImportBatch | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-5xl flex-col gap-4 overflow-hidden">
        {open ? <ImportFlow replacing={replacing} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function ImportFlow({ replacing, onClose }: { replacing: ImportBatch | null; onClose: () => void }) {
  const [stage, setStage] = useState<Stage>({ kind: "select" });
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [acceptWarnings, setAcceptWarnings] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();
  const validate = useServerFn(validateImport);
  const commit = useServerFn(commitImport);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setCommitError(null);
    setAcceptWarnings(false);
    setIssuesOnly(false);
    setStage({ kind: "busy", label: "Reading workbook..." });
    try {
      const parsed = await parseWorkbook(file);
      if (!parsed.ok) return setStage({ kind: "select", errors: parsed.errors });
      setStage({ kind: "busy", label: `Checking ${parsed.rows.length.toLocaleString()} rows...` });
      const res = await validate({
        data: { fileName: file.name, today: localToday(), replaceBatchId: replacing?.id ?? null, rows: parsed.rows },
      });
      if (!res.ok) return setStage({ kind: "select", errors: [res.error] });
      setStage({ kind: "review", review: { fileName: file.name, raw: parsed.rows, rows: res.rows, summary: res.summary } });
    } catch {
      setStage({ kind: "select", errors: ["Unable to check this workbook. Check your connection and try again."] });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const mutation = useMutation({
    mutationFn: (r: Review) =>
      commit({
        data: {
          fileName: r.fileName,
          today: localToday(),
          replaceBatchId: replacing?.id ?? null,
          rows: r.raw,
          acceptWarnings,
        },
      }),
    onSuccess: async (res) => {
      if (!res.ok) return setCommitError(res.error);
      await invalidateOperationalData(qc);
      toast.success(`${res.count.toLocaleString()} records imported.`);
      onClose();
    },
    onError: () => setCommitError("The import failed. Nothing was saved. Please try again."),
  });

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      className="sr-only"
      aria-label="Choose Excel workbook"
      onChange={(e) => handleFile(e.target.files?.[0])}
    />
  );

  const title = replacing ? "Replace import" : "Import operational data";

  if (stage.kind !== "review") {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {replacing
              ? `Upload a corrected workbook to replace ${replacing.fileName}. The current records stay until the new file passes every check and you confirm.`
              : "Upload a completed ServeWise template. Nothing is saved until you review and confirm."}
          </DialogDescription>
        </DialogHeader>
        {picker}
        {stage.kind === "busy" ? (
          <div className="flex items-center gap-3 rounded-md border bg-muted/40 p-6 text-sm" aria-live="polite">
            <Loader2 className="h-4 w-4 animate-spin text-primary" /> {stage.label}
          </div>
        ) : (
          <div className="grid gap-4">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFile(e.dataTransfer.files[0]);
              }}
              className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border bg-card p-8 text-center transition-colors hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <FileSpreadsheet className="h-8 w-8 text-primary" />
              <span className="font-medium">Choose an Excel workbook</span>
              <span className="text-xs text-muted-foreground">.xlsx up to 5 MB · or drop it here</span>
            </button>
            {stage.errors?.length ? (
              <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">This workbook can't be imported.</p>
                <ul className="mt-1 list-disc pl-5">
                  {stage.errors.slice(0, 8).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                {replacing ? <p className="mt-2">Your current imported records are unchanged.</p> : null}
              </div>
            ) : null}
          </div>
        )}
      </>
    );
  }

  const { review } = stage;
  const { summary } = review;
  const visible = issuesOnly ? review.rows.filter((r) => r.status !== "valid") : review.rows;
  const blocked = summary.errors > 0;
  const needsAck = summary.warnings > 0 && !acceptWarnings;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription className="truncate">{review.fileName}</DialogDescription>
      </DialogHeader>
      {picker}

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Records detected" value={summary.total} />
        <Stat label="Valid" value={summary.valid} tone="success" />
        <Stat label="Warnings" value={summary.warnings} tone="warning" />
        <Stat label="Errors" value={summary.errors} tone="error" />
      </dl>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant={issuesOnly ? "default" : "outline"} onClick={() => setIssuesOnly(true)} aria-pressed={issuesOnly}>
          Show only issues
        </Button>
        <Button size="sm" variant={!issuesOnly ? "default" : "outline"} onClick={() => setIssuesOnly(false)} aria-pressed={!issuesOnly}>
          Show all
        </Button>
        <span className="text-xs text-muted-foreground">
          Showing {visible.length.toLocaleString()} of {summary.total.toLocaleString()}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-md border">
        {visible.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No issues found.</p>
        ) : (
          <>
            <Table className="hidden md:table">
              <TableHeader className="sticky top-0 bg-card">
                <TableRow>
                  <TableHead className="w-14">Row</TableHead>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Meal</TableHead>
                  <TableHead>Menu</TableHead>
                  <TableHead className="text-right">Exp.</TableHead>
                  <TableHead className="text-right">Act.</TableHead>
                  <TableHead className="text-right">Prep.</TableHead>
                  <TableHead className="text-right">Cons.</TableHead>
                  <TableHead>Issue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={r.row} className={cn(r.status === "error" && "bg-destructive/5")}>
                    <TableCell className="tabular-nums text-muted-foreground">{r.row}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="whitespace-nowrap">{r.display.service_date || "—"}</TableCell>
                    <TableCell>{r.display.meal || "—"}</TableCell>
                    <TableCell className="max-w-44 truncate">{r.display.menu || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.display.expected_attendance || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.display.actual_attendance || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.display.prepared_quantity || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.display.consumed_quantity || "—"}</TableCell>
                    <TableCell className="min-w-56 text-xs"><Issues row={r} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <ul className="divide-y md:hidden">
              {visible.map((r) => (
                <li key={r.row} className="grid gap-1.5 p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">Row {r.row}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="truncate font-medium">
                    {r.display.service_date || "No date"} · {r.display.meal || "No meal"} · {r.display.menu || "No menu"}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Expected {r.display.expected_attendance || "—"} · Actual {r.display.actual_attendance || "—"} · Prepared{" "}
                    {r.display.prepared_quantity || "—"} · Consumed {r.display.consumed_quantity || "—"}
                  </p>
                  <div className="text-xs"><Issues row={r} /></div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="grid gap-3 border-t pt-3">
        {blocked ? (
          <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
            Fix all errors before importing. Correct the rows in Excel, save, and upload again.
            {replacing ? " Your current imported records are unchanged." : ""}
          </p>
        ) : (
          <div className="grid gap-2 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Ready to import · no blocking errors found.
            </p>
            {replacing ? (
              <p className="text-muted-foreground">
                Confirming removes the {replacing.currentCount.toLocaleString()} records from {replacing.fileName} and adds{" "}
                {summary.total.toLocaleString()} new records. Manually added records are not affected.
              </p>
            ) : null}
            {summary.warnings ? (
              <label className="flex items-start gap-2">
                <Checkbox checked={acceptWarnings} onCheckedChange={(v) => setAcceptWarnings(v === true)} className="mt-0.5" />
                <span>
                  {summary.warnings} {summary.warnings === 1 ? "warning remains" : "warnings remain"}. I've reviewed{" "}
                  {summary.warnings === 1 ? "it" : "them"} and the values are correct.
                </span>
              </label>
            ) : null}
          </div>
        )}
        {commitError ? <p role="alert" className="text-sm text-destructive">{commitError}</p> : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>Cancel import</Button>
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={mutation.isPending}>
            <Upload className="h-4 w-4" /> Upload another file
          </Button>
          <Button disabled={blocked || needsAck || mutation.isPending} onClick={() => mutation.mutate(review)}>
            {mutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Importing...</>
            ) : summary.warnings ? (
              "Confirm import with warnings"
            ) : replacing ? (
              "Confirm replacement"
            ) : (
              "Confirm import"
            )}
          </Button>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" | "error" }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-lg font-semibold tabular-nums",
          tone === "error" && value > 0 && "text-destructive",
          tone === "warning" && value > 0 && "text-warning-foreground",
          tone === "success" && "text-primary",
        )}
      >
        {value.toLocaleString()}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: ValidatedRow["status"] }) {
  if (status === "error") return <Badge variant="destructive">Error</Badge>;
  if (status === "warning")
    return <Badge className="border-warning/40 bg-warning/20 text-warning-foreground hover:bg-warning/20">Warning</Badge>;
  return <Badge variant="outline" className="text-primary">Valid</Badge>;
}

function Issues({ row }: { row: ValidatedRow }) {
  if (!row.issues.length) return <span className="text-muted-foreground">—</span>;
  return (
    <ul className="grid gap-0.5">
      {row.issues.map((i) => (
        <li key={i.message} className={cn("flex gap-1.5", i.severity === "error" ? "text-destructive" : "text-warning-foreground")}>
          {i.severity === "warning" ? <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> : null}
          {i.message}
        </li>
      ))}
    </ul>
  );
}

export function ImportsPanel({ onReplace }: { onReplace: (b: ImportBatch) => void }) {
  const fetchImports = useServerFn(listImports);
  const q = useQuery({ queryKey: ["import-batches"], queryFn: () => fetchImports() });
  const [removing, setRemoving] = useState<ImportBatch | null>(null);
  const qc = useQueryClient();
  const remove = useServerFn(removeImport);
  const mutation = useMutation({
    mutationFn: (id: string) => remove({ data: { batchId: id } }),
    onSuccess: async (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await invalidateOperationalData(qc);
      toast.success(`Import removed · ${res.removed.toLocaleString()} records deleted.`);
      setRemoving(null);
    },
    onError: () => toast.error("Unable to remove this import."),
  });

  if (q.isPending || q.isError || q.data.length === 0) {
    return q.isError ? (
      <p className="flex items-center gap-2 text-sm text-destructive">
        Unable to load imports.
        <Button variant="outline" size="sm" onClick={() => q.refetch()}>Retry</Button>
      </p>
    ) : null;
  }

  return (
    <section aria-label="Imports" className="rounded-md border bg-card">
      <h2 className="border-b px-4 py-2.5 text-sm font-semibold">{q.data.length === 1 ? "Current import" : "Current imports"}</h2>
      <ul className="divide-y">
        {q.data.map((b) => (
          <li key={b.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <FileSpreadsheet className="h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{b.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  Imported {fmtDateTime(b.importedAt)} · {b.currentCount.toLocaleString()} records
                  {b.currentCount !== b.importedCount ? ` (${b.importedCount.toLocaleString()} imported)` : ""}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => onReplace(b)}>
                <RefreshCw className="h-3.5 w-3.5" /> Replace import
              </Button>
              <Button size="sm" variant="outline" onClick={() => setRemoving(b)}>
                <Trash2 className="h-3.5 w-3.5" /> Remove import
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <AlertDialog open={removing !== null} onOpenChange={(o) => !o && !mutation.isPending && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this import?</AlertDialogTitle>
            <AlertDialogDescription>
              {removing
                ? `Removing ${removing.fileName} will remove ${removing.currentCount.toLocaleString()} operational ${removing.currentCount === 1 ? "record" : "records"} created by this import, including any you've edited since. Manually added records will not be affected.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={mutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (removing) mutation.mutate(removing.id);
              }}
            >
              {mutation.isPending ? "Removing..." : "Remove import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
