ALTER TABLE public.service_records ADD COLUMN service_completed_at timestamptz;

CREATE TABLE public.surplus_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_record_id uuid NOT NULL UNIQUE REFERENCES public.service_records(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  meal_period meal_period NOT NULL,
  menu_name text NOT NULL,
  prepared_quantity integer NOT NULL CHECK (prepared_quantity >= 0),
  consumed_quantity integer NOT NULL CHECK (consumed_quantity >= 0),
  potential_surplus integer NOT NULL CHECK (potential_surplus > 0),
  status text NOT NULL DEFAULT 'pending_safety' CHECK (status IN ('pending_safety','withdrawn','safety_approved','safety_blocked','offered','accepted','pickup_scheduled','picked_up','received','closed')),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.surplus_batches TO authenticated;
GRANT ALL ON public.surplus_batches TO service_role;
ALTER TABLE public.surplus_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen admins view surplus batches" ON public.surplus_batches FOR SELECT TO authenticated USING (public.is_kitchen_admin(organization_id));
CREATE TRIGGER surplus_batches_touch BEFORE UPDATE ON public.surplus_batches FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Idempotent handoff: one batch per service; quantities always come from recorded actuals.
CREATE OR REPLACE FUNCTION public.send_to_surplus_rescue(_record uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.service_records; _id uuid; _s int;
BEGIN
  SELECT * INTO r FROM public.service_records WHERE id = _record;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT public.is_kitchen_admin(r.organization_id) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF r.prepared_quantity IS NULL OR r.consumed_quantity IS NULL THEN
    RAISE EXCEPTION 'actuals_missing' USING ERRCODE = '22023';
  END IF;
  _s := r.prepared_quantity - r.consumed_quantity;
  IF _s <= 0 THEN RAISE EXCEPTION 'no_surplus' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.surplus_batches (organization_id, service_record_id, service_date, meal_period, menu_name,
      prepared_quantity, consumed_quantity, potential_surplus, created_by)
    VALUES (r.organization_id, r.id, r.service_date, r.meal_period, r.menu_name, r.prepared_quantity, r.consumed_quantity, _s, auth.uid())
  ON CONFLICT (service_record_id) DO UPDATE SET
      menu_name = EXCLUDED.menu_name, prepared_quantity = EXCLUDED.prepared_quantity,
      consumed_quantity = EXCLUDED.consumed_quantity, potential_surplus = EXCLUDED.potential_surplus,
      status = 'pending_safety'
    WHERE surplus_batches.status IN ('pending_safety','withdrawn')
  RETURNING id INTO _id;
  IF _id IS NULL THEN SELECT id INTO _id FROM public.surplus_batches WHERE service_record_id = r.id; END IF;
  RETURN _id;
END; $$;
REVOKE EXECUTE ON FUNCTION public.send_to_surplus_rescue(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_to_surplus_rescue(uuid) TO authenticated;

-- Keep a pending batch in step with corrected actuals; protect batches that moved downstream.
CREATE OR REPLACE FUNCTION public.sync_surplus_batch()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.surplus_batches; _s int;
BEGIN
  SELECT * INTO b FROM public.surplus_batches WHERE service_record_id = NEW.id;
  IF NOT FOUND THEN RETURN NEW; END IF;
  IF NEW.prepared_quantity IS NOT DISTINCT FROM OLD.prepared_quantity
     AND NEW.consumed_quantity IS NOT DISTINCT FROM OLD.consumed_quantity
     AND NEW.menu_name = OLD.menu_name THEN RETURN NEW; END IF;
  IF b.status NOT IN ('pending_safety','withdrawn') THEN
    RAISE EXCEPTION 'surplus_batch_in_progress' USING ERRCODE = '42501';
  END IF;
  _s := COALESCE(NEW.prepared_quantity,0) - COALESCE(NEW.consumed_quantity,0);
  IF NEW.prepared_quantity IS NULL OR NEW.consumed_quantity IS NULL OR _s <= 0 THEN
    UPDATE public.surplus_batches SET status = 'withdrawn' WHERE id = b.id;
  ELSE
    UPDATE public.surplus_batches SET menu_name = NEW.menu_name, prepared_quantity = NEW.prepared_quantity,
      consumed_quantity = NEW.consumed_quantity, potential_surplus = _s WHERE id = b.id;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER service_records_sync_surplus AFTER UPDATE ON public.service_records FOR EACH ROW EXECUTE FUNCTION public.sync_surplus_batch();