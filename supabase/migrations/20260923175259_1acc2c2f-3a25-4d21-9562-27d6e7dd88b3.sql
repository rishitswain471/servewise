CREATE TYPE public.meal_period AS ENUM ('breakfast','lunch','dinner');

CREATE OR REPLACE FUNCTION public.is_kitchen_admin(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members m
    JOIN public.organizations o ON o.id = m.organization_id
    WHERE m.organization_id = _org AND m.user_id = auth.uid()
      AND m.role = 'admin' AND o.org_type = 'kitchen')
$$;
REVOKE EXECUTE ON FUNCTION public.is_kitchen_admin(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_kitchen_admin(uuid) TO authenticated;

CREATE TABLE public.service_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  meal_period public.meal_period NOT NULL,
  menu_name text NOT NULL CHECK (char_length(btrim(menu_name)) BETWEEN 1 AND 200),
  expected_attendance integer CHECK (expected_attendance >= 0 AND expected_attendance <= 1000000),
  actual_attendance integer CHECK (actual_attendance >= 0 AND actual_attendance <= 1000000),
  prepared_quantity integer CHECK (prepared_quantity >= 0 AND prepared_quantity <= 1000000),
  consumed_quantity integer CHECK (consumed_quantity >= 0 AND consumed_quantity <= 1000000),
  notes text CHECK (notes IS NULL OR char_length(notes) <= 1000),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT service_records_unique_service UNIQUE (organization_id, service_date, meal_period)
);
CREATE INDEX service_records_org_date_idx ON public.service_records (organization_id, service_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_records TO authenticated;
GRANT ALL ON public.service_records TO service_role;
ALTER TABLE public.service_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kitchen admins view records" ON public.service_records FOR SELECT TO authenticated USING (public.is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins add records" ON public.service_records FOR INSERT TO authenticated WITH CHECK (public.is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins correct records" ON public.service_records FOR UPDATE TO authenticated USING (public.is_kitchen_admin(organization_id)) WITH CHECK (public.is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins delete records" ON public.service_records FOR DELETE TO authenticated USING (public.is_kitchen_admin(organization_id));

CREATE OR REPLACE FUNCTION public.guard_service_record()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.organization_id IS DISTINCT FROM OLD.organization_id OR NEW.created_by IS DISTINCT FROM OLD.created_by
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'service_record_owner_immutable' USING ERRCODE = '42501';
    END IF;
    NEW.updated_at = now();
  ELSE
    NEW.created_by = auth.uid();
  END IF;
  IF NEW.service_date > current_date + 1 THEN
    RAISE EXCEPTION 'service_date_in_future' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER service_records_guard BEFORE INSERT OR UPDATE ON public.service_records FOR EACH ROW EXECUTE FUNCTION public.guard_service_record();