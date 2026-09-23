CREATE TABLE public.import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  file_name text NOT NULL CHECK (char_length(file_name) BETWEEN 1 AND 255),
  record_count integer NOT NULL CHECK (record_count >= 0),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','replaced','removed')),
  replaces_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL,
  created_by uuid DEFAULT auth.uid(),
  imported_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
GRANT SELECT ON public.import_batches TO authenticated;
GRANT ALL ON public.import_batches TO service_role;
ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen admins view imports" ON public.import_batches FOR SELECT TO authenticated
  USING (public.is_kitchen_admin(organization_id));
CREATE INDEX import_batches_org_idx ON public.import_batches (organization_id, status, imported_at DESC);

ALTER TABLE public.service_records
  ADD COLUMN import_batch_id uuid REFERENCES public.import_batches(id) ON DELETE SET NULL;
CREATE INDEX service_records_batch_idx ON public.service_records (import_batch_id) WHERE import_batch_id IS NOT NULL;

-- Batches are written only through these functions, which run as the caller (RLS applies to
-- service_records) but own the batch bookkeeping. Each call is one transaction: all or nothing.
CREATE OR REPLACE FUNCTION public.import_service_records(_org uuid, _file_name text, _rows jsonb, _replace uuid DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _id uuid; _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL OR NOT public.is_kitchen_admin(_org) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF jsonb_typeof(_rows) <> 'array' OR jsonb_array_length(_rows) = 0 OR jsonb_array_length(_rows) > 2000 THEN
    RAISE EXCEPTION 'invalid_rows' USING ERRCODE = '22023';
  END IF;
  IF _replace IS NOT NULL THEN
    UPDATE public.import_batches SET status = 'replaced', closed_at = now()
      WHERE id = _replace AND organization_id = _org AND status = 'active';
    IF NOT FOUND THEN RAISE EXCEPTION 'batch_not_found' USING ERRCODE = 'P0002'; END IF;
    DELETE FROM public.service_records WHERE import_batch_id = _replace AND organization_id = _org;
  END IF;
  INSERT INTO public.import_batches (organization_id, file_name, record_count, replaces_batch_id, created_by)
    VALUES (_org, btrim(_file_name), jsonb_array_length(_rows), _replace, _uid) RETURNING id INTO _id;
  INSERT INTO public.service_records (organization_id, service_date, meal_period, menu_name, expected_attendance,
      actual_attendance, prepared_quantity, consumed_quantity, notes, import_batch_id, created_by)
  SELECT _org, (r->>'serviceDate')::date, (r->>'mealPeriod')::meal_period, btrim(r->>'menuName'),
      (r->>'expectedAttendance')::int, (r->>'actualAttendance')::int, (r->>'preparedQuantity')::int,
      (r->>'consumedQuantity')::int, NULLIF(btrim(COALESCE(r->>'notes','')), ''), _id, _uid
  FROM jsonb_array_elements(_rows) r;
  RETURN _id;
END; $$;

CREATE OR REPLACE FUNCTION public.remove_import_batch(_org uuid, _batch uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _n integer;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_kitchen_admin(_org) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  UPDATE public.import_batches SET status = 'removed', closed_at = now()
    WHERE id = _batch AND organization_id = _org AND status = 'active';
  IF NOT FOUND THEN RAISE EXCEPTION 'batch_not_found' USING ERRCODE = 'P0002'; END IF;
  DELETE FROM public.service_records WHERE import_batch_id = _batch AND organization_id = _org;
  GET DIAGNOSTICS _n = ROW_COUNT;
  RETURN _n;
END; $$;

REVOKE ALL ON FUNCTION public.import_service_records(uuid, text, jsonb, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.remove_import_batch(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.import_service_records(uuid, text, jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_import_batch(uuid, uuid) TO authenticated;