import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ClipboardList,
  Download,
  FileUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  ImportDialog,
  ImportsPanel,
  invalidateOperationalData,
} from "@/components/servewise/import-workflow";
import { EmptyState, LoadingState } from "@/components/servewise/page";
import { Badge } from "@/components/ui/badge";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createServiceRecord,
  deleteServiceRecord,
  listServiceRecords,
  mealPeriods,
  recordInputSchema,
  updateServiceRecord,
  type MealPeriod,
  type RecordFilters,
  type ImportBatch,
  type ServiceRecord,
} from "@/lib/records.functions";
import { downloadTemplate } from "@/lib/workbook";

export const mealLabel: Record<MealPeriod, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString());
export const fmtDate = (d: string) =>
  new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
const diff = (r: ServiceRecord) =>
  r.preparedQuantity !== null && r.consumedQuantity !== null
    ? r.preparedQuantity - r.consumedQuantity
    : null;

export function ServiceRecordsWorkspace() {
  const [filters, setFilters] = useState<RecordFilters>({ page: 0 });
  const [editing, setEditing] = useState<ServiceRecord | "new" | null>(null);
  const [deleting, setDeleting] = useState<ServiceRecord | null>(null);
  const [importing, setImporting] = useState<{ replacing: ImportBatch | null } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const onDownload = async () => {
    setDownloading(true);
    try {
      await downloadTemplate();
    } catch {
      toast.error("Unable to create the template. Please try again.");
    } finally {
      setDownloading(false);
    }
  };
  const list = useServerFn(listServiceRecords);
  const query = useQuery({
    queryKey: ["service-records", filters],
    queryFn: () => list({ data: filters }),
    placeholderData: keepPreviousData,
  });
  const hasFilters = Boolean(filters.from || filters.to || filters.meal || filters.menu);
  const setFilter = (patch: Partial<RecordFilters>) =>
    setFilters((f) => ({ ...f, ...patch, page: 0 }));

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">Plan</p>
          <h1 className="mt-2 text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
            Menu & Consumption
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Record each meal service — menu, attendance, prepared and consumed quantities — and
            correct entries when needed.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onDownload} disabled={downloading}>
            {downloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}{" "}
            Download template
          </Button>
          <Button variant="outline" onClick={() => setImporting({ replacing: null })}>
            <FileUp className="h-4 w-4" /> Import Excel
          </Button>
          <Button onClick={() => setEditing("new")}>
            <Plus className="h-4 w-4" /> Add record
          </Button>
        </div>
      </header>

      <ImportsPanel onReplace={(b) => setImporting({ replacing: b })} />

      <section aria-label="Filters" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="grid gap-1.5">
          <Label htmlFor="f-from">From</Label>
          <Input
            id="f-from"
            type="date"
            value={filters.from ?? ""}
            onChange={(e) => setFilter({ from: e.target.value || undefined })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-to">To</Label>
          <Input
            id="f-to"
            type="date"
            value={filters.to ?? ""}
            onChange={(e) => setFilter({ to: e.target.value || undefined })}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-meal">Meal</Label>
          <Select
            value={filters.meal ?? "all"}
            onValueChange={(v) => setFilter({ meal: v === "all" ? undefined : (v as MealPeriod) })}
          >
            <SelectTrigger id="f-meal">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All meals</SelectItem>
              {mealPeriods.map((m) => (
                <SelectItem key={m} value={m}>
                  {mealLabel[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="f-menu">Menu</Label>
          <Input
            id="f-menu"
            placeholder="Filter by menu"
            value={filters.menu ?? ""}
            maxLength={100}
            onChange={(e) => setFilter({ menu: e.target.value || undefined })}
          />
        </div>
      </section>

      {query.isPending ? (
        <div aria-live="polite">
          <p className="mb-3 text-sm text-muted-foreground">Loading operational data...</p>
          <LoadingState />
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <p className="text-sm font-medium">Unable to load operational data.</p>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            Retry
          </Button>
        </div>
      ) : query.data.records.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={ClipboardList}
            title="No matching records"
            description="Try a different date range, meal or menu."
          />
        ) : (
          <div className="grid gap-3">
            <EmptyState
              icon={ClipboardList}
              title="No operational data yet."
              description="Add a meal service, or import your history from the ServeWise Excel template."
            />
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" onClick={() => setImporting({ replacing: null })}>
                <FileUp className="h-4 w-4" /> Import Excel
              </Button>
              <Button variant="outline" onClick={() => setEditing("new")}>
                <Plus className="h-4 w-4" /> Add record
              </Button>
            </div>
          </div>
        )
      ) : (
        <RecordList
          data={query.data}
          onEdit={setEditing}
          onDelete={setDeleting}
          onPage={(page) => setFilters((f) => ({ ...f, page }))}
        />
      )}

      <RecordDialog record={editing} onClose={() => setEditing(null)} />
      <DeleteDialog record={deleting} onClose={() => setDeleting(null)} />
      <ImportDialog
        open={importing !== null}
        replacing={importing?.replacing ?? null}
        onClose={() => setImporting(null)}
      />
    </div>
  );
}

function RecordList({
  data,
  onEdit,
  onDelete,
  onPage,
}: {
  data: { records: ServiceRecord[]; total: number; page: number; pageSize: number };
  onEdit: (r: ServiceRecord) => void;
  onDelete: (r: ServiceRecord) => void;
  onPage: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return (
    <section aria-label="Service records" className="flex flex-col gap-3">
      <div className="hidden overflow-hidden rounded-md border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Meal</TableHead>
              <TableHead>Menu</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead className="text-right">Actual</TableHead>
              <TableHead className="text-right">Prepared</TableHead>
              <TableHead className="text-right">Consumed</TableHead>
              <TableHead className="text-right">Difference</TableHead>
              <TableHead className="w-24">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.records.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="whitespace-nowrap">{fmtDate(r.serviceDate)}</TableCell>
                <TableCell>{mealLabel[r.mealPeriod]}</TableCell>
                <TableCell className="max-w-56">
                  <p className="truncate font-medium">{r.menuName}</p>
                  {r.notes ? (
                    <p className="truncate text-xs text-muted-foreground">{r.notes}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <SourceBadge record={r} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmt(r.expectedAttendance)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{fmt(r.actualAttendance)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(r.preparedQuantity)}</TableCell>
                <TableCell className="text-right tabular-nums">{fmt(r.consumedQuantity)}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {fmt(diff(r))}
                </TableCell>
                <TableCell>
                  <RowActions record={r} onEdit={onEdit} onDelete={onDelete} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ul className="grid gap-3 md:hidden">
        {data.records.map((r) => (
          <li key={r.id} className="min-w-0 rounded-md border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {fmtDate(r.serviceDate)} · {mealLabel[r.mealPeriod]} <SourceBadge record={r} />
                </div>
                <p className="mt-1 truncate font-medium">{r.menuName}</p>
              </div>
              <RowActions record={r} onEdit={onEdit} onDelete={onDelete} />
            </div>
            <dl className="mt-3 grid grid-cols-[repeat(2,minmax(0,1fr))] gap-x-4 gap-y-2 text-sm">
              {[
                ["Expected", r.expectedAttendance],
                ["Actual", r.actualAttendance],
                ["Prepared", r.preparedQuantity],
                ["Consumed", r.consumedQuantity],
              ].map(([k, v]) => (
                <div key={k as string} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="tabular-nums">{fmt(v as number | null)}</dd>
                </div>
              ))}
            </dl>
            {r.notes ? <p className="mt-3 text-xs text-muted-foreground">{r.notes}</p> : null}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {data.total.toLocaleString()} {data.total === 1 ? "record" : "records"}
        </span>
        {pages > 1 ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page === 0}
              onClick={() => onPage(data.page - 1)}
            >
              Previous
            </Button>
            <span>
              Page {data.page + 1} of {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page + 1 >= pages}
              onClick={() => onPage(data.page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function SourceBadge({ record }: { record: ServiceRecord }) {
  return (
    <Badge variant="outline" className="font-normal text-muted-foreground">
      {record.importBatchId ? "Imported" : "Manual"}
    </Badge>
  );
}

function RowActions({
  record,
  onEdit,
  onDelete,
}: {
  record: ServiceRecord;
  onEdit: (r: ServiceRecord) => void;
  onDelete: (r: ServiceRecord) => void;
}) {
  const label = `${mealLabel[record.mealPeriod]} ${fmtDate(record.serviceDate)}`;
  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Edit ${label}`}
        onClick={() => onEdit(record)}
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Delete ${label}`}
        onClick={() => onDelete(record)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

type FormState = Record<
  | "serviceDate"
  | "mealPeriod"
  | "menuName"
  | "expectedAttendance"
  | "actualAttendance"
  | "preparedQuantity"
  | "consumedQuantity"
  | "notes",
  string
>;

const today = () => new Date().toLocaleDateString("en-CA");
const toForm = (r: ServiceRecord | null): FormState => ({
  serviceDate: r?.serviceDate ?? today(),
  mealPeriod: r?.mealPeriod ?? "",
  menuName: r?.menuName ?? "",
  expectedAttendance: r?.expectedAttendance?.toString() ?? "",
  actualAttendance: r?.actualAttendance?.toString() ?? "",
  preparedQuantity: r?.preparedQuantity?.toString() ?? "",
  consumedQuantity: r?.consumedQuantity?.toString() ?? "",
  notes: r?.notes ?? "",
});
const num = (v: string) => (v.trim() === "" ? null : Number(v));

function RecordDialog({
  record,
  onClose,
}: {
  record: ServiceRecord | "new" | null;
  onClose: () => void;
}) {
  const open = record !== null;
  const existing = record && record !== "new" ? record : null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        {open ? (
          <RecordForm key={existing?.id ?? "new"} existing={existing} onClose={onClose} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RecordForm({
  existing,
  onClose,
}: {
  existing: ServiceRecord | null;
  onClose: () => void;
}) {
  const [form, setForm] = useState<FormState>(() => toForm(existing));
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const qc = useQueryClient();
  const create = useServerFn(createServiceRecord);
  const update = useServerFn(updateServiceRecord);

  const mutation = useMutation({
    mutationFn: async (values: ReturnType<typeof recordInputSchema.parse>) =>
      existing ? update({ data: { id: existing.id, values } }) : create({ data: values }),
    onSuccess: async (res) => {
      if (!res.ok) {
        setFormError(res.error);
        return;
      }
      await invalidateOperationalData(qc);
      toast.success("Record saved.");
      onClose();
    },
    onError: () => setFormError("Unable to save this record. Please try again."),
  });

  const set = (k: keyof FormState) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const prepared = num(form.preparedQuantity);
  const consumed = num(form.consumedQuantity);
  const consumedOver = prepared !== null && consumed !== null && consumed > prepared;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const parsed = recordInputSchema.safeParse({
      serviceDate: form.serviceDate,
      mealPeriod: form.mealPeriod || undefined,
      menuName: form.menuName,
      expectedAttendance: num(form.expectedAttendance),
      actualAttendance: num(form.actualAttendance),
      preparedQuantity: prepared,
      consumedQuantity: consumed,
      notes: form.notes.trim() || null,
    });
    if (!parsed.success) {
      const next: typeof errors = {};
      for (const issue of parsed.error.issues) {
        const k = issue.path[0] as keyof FormState;
        next[k] ??= issue.message;
      }
      return setErrors(next);
    }
    if (parsed.data.serviceDate > today())
      return setErrors({ serviceDate: "Service date can't be in the future." });
    setErrors({});
    mutation.mutate(parsed.data);
  };

  const numField = (k: keyof FormState, label: string) => (
    <div className="grid gap-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input
        id={k}
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        value={form[k]}
        onChange={(e) => set(k)(e.target.value)}
        aria-invalid={!!errors[k]}
      />
      {errors[k] ? <p className="text-xs text-destructive">{errors[k]}</p> : null}
    </div>
  );

  return (
    <form onSubmit={submit} noValidate className="grid gap-5">
      <DialogHeader>
        <DialogTitle>{existing ? "Edit service record" : "Add record"}</DialogTitle>
        <DialogDescription>
          {existing
            ? `Last updated ${new Date(existing.updatedAt).toLocaleString()}.`
            : "Record what happened at a meal service."}
        </DialogDescription>
      </DialogHeader>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-semibold">Service information</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="serviceDate">Date</Label>
            <Input
              id="serviceDate"
              type="date"
              max={today()}
              value={form.serviceDate}
              onChange={(e) => set("serviceDate")(e.target.value)}
              aria-invalid={!!errors.serviceDate}
            />
            {errors.serviceDate ? (
              <p className="text-xs text-destructive">{errors.serviceDate}</p>
            ) : null}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="mealPeriod">Meal</Label>
            <Select value={form.mealPeriod} onValueChange={set("mealPeriod")}>
              <SelectTrigger id="mealPeriod" aria-invalid={!!errors.mealPeriod}>
                <SelectValue placeholder="Choose meal" />
              </SelectTrigger>
              <SelectContent>
                {mealPeriods.map((m) => (
                  <SelectItem key={m} value={m}>
                    {mealLabel[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.mealPeriod ? (
              <p className="text-xs text-destructive">{errors.mealPeriod}</p>
            ) : null}
          </div>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="menuName">Menu</Label>
          <Input
            id="menuName"
            maxLength={200}
            placeholder="e.g. Rice, dal, mixed vegetables"
            value={form.menuName}
            onChange={(e) => set("menuName")(e.target.value)}
            aria-invalid={!!errors.menuName}
          />
          {errors.menuName ? <p className="text-xs text-destructive">{errors.menuName}</p> : null}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-semibold">Attendance</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {numField("expectedAttendance", "Expected attendance *")}
          {numField("actualAttendance", "Actual attendance")}
        </div>
      </fieldset>

      <fieldset className="grid gap-3">
        <legend className="mb-2 text-sm font-semibold">Consumption (meals)</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {numField("preparedQuantity", "Prepared *")}
          {numField("consumedQuantity", "Consumed *")}
        </div>
        {consumedOver ? (
          <p className="flex items-start gap-2 rounded-md border border-warning/40 bg-warning/15 p-2.5 text-xs text-warning-foreground">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Consumed is higher than prepared. Check both values before saving.
          </p>
        ) : null}
      </fieldset>

      <div className="grid gap-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          maxLength={1000}
          rows={3}
          placeholder="e.g. Holiday, college event, special menu"
          value={form.notes}
          onChange={(e) => set("notes")(e.target.value)}
        />
        {errors.notes ? <p className="text-xs text-destructive">{errors.notes}</p> : null}
      </div>

      {formError ? (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Saving..." : "Save record"}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteDialog({ record, onClose }: { record: ServiceRecord | null; onClose: () => void }) {
  const qc = useQueryClient();
  const remove = useServerFn(deleteServiceRecord);
  const mutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async (res) => {
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      await invalidateOperationalData(qc);
      toast.success("Record deleted.");
      onClose();
    },
    onError: () => toast.error("Unable to delete this record."),
  });
  return (
    <AlertDialog open={record !== null} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this record?</AlertDialogTitle>
          <AlertDialogDescription>
            {record
              ? `${mealLabel[record.mealPeriod]} on ${fmtDate(record.serviceDate)} — ${record.menuName}. `
              : ""}
            This permanently removes it from your kitchen's history
            {record?.importBatchId ? ", including from its import" : ""}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (record) mutation.mutate(record.id);
            }}
            disabled={mutation.isPending}
          >
            Delete record
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
