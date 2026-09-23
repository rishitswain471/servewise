import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { orgNameSchema, updateOrganizationSettings, type OrgType } from "@/lib/org.functions";

export function OrganizationSettingsForm({
  organizationId, name: initialName, type: initialType, isAdmin,
}: { organizationId: string; name: string; type: OrgType; isAdmin: boolean }) {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState<OrgType>(initialType);
  useEffect(() => { setName(initialName); setType(initialType); }, [initialName, initialType]);
  const save = useServerFn(updateOrganizationSettings);
  const router = useRouter();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const parsed = orgNameSchema.safeParse(name);
  const nameError = parsed.success ? null : parsed.error.issues[0]?.message ?? "Invalid name";
  const dirty = name.trim() !== initialName || type !== initialType;

  const m = useMutation({
    mutationFn: () => save({ data: { organizationId, name: name.trim(), type } }),
    onSuccess: async (r) => {
      if (!r.ok) { toast.error(r.error); return; }
      toast.success("Organization settings saved");
      qc.invalidateQueries();
      await router.invalidate();
      if (type !== initialType) navigate({ to: type === "ngo" ? "/ngo" : "/dashboard", replace: true });
    },
    onError: () => toast.error("We couldn't save the organization settings. Please try again."),
  });

  return (
    <Card className="shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Organization</CardTitle>
        <CardDescription>
          Organization type can only change before any records, forecasts, surplus, offers or recipient profile exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid max-w-2xl gap-4 sm:grid-cols-2"
          onSubmit={(e) => { e.preventDefault(); if (!nameError && dirty) m.mutate(); }}>
          <div className="grid gap-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input id="org-name" value={name} maxLength={120} disabled={!isAdmin}
              aria-invalid={!!nameError} onChange={(e) => setName(e.target.value)} />
            {nameError ? <p className="text-xs text-destructive">{nameError}</p> : null}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="org-type">Organization Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as OrgType)} disabled={!isAdmin}>
              <SelectTrigger id="org-type"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="ngo">NGO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!isAdmin || !!nameError || !dirty || m.isPending}>
              {m.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
