
CREATE OR REPLACE FUNCTION public.is_ngo_admin(_org uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m JOIN public.organizations o ON o.id = m.organization_id
    WHERE m.organization_id = _org AND m.user_id = auth.uid() AND m.role = 'admin' AND o.org_type = 'ngo') $$;
CREATE OR REPLACE FUNCTION public.is_any_kitchen_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members m JOIN public.organizations o ON o.id = m.organization_id
    WHERE m.user_id = auth.uid() AND m.role = 'admin' AND o.org_type = 'kitchen') $$;

-- Safety policy (configurable, not regulatory)
CREATE TABLE public.safety_policies (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  max_holding_minutes integer NOT NULL DEFAULT 120 CHECK (max_holding_minutes BETWEEN 1 AND 1440),
  min_hot_holding_c numeric(5,1) NOT NULL DEFAULT 63 CHECK (min_hot_holding_c BETWEEN 0 AND 100),
  max_cold_holding_c numeric(5,1) NOT NULL DEFAULT 5 CHECK (max_cold_holding_c BETWEEN -30 AND 20),
  updated_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.safety_policies TO authenticated;
GRANT ALL ON public.safety_policies TO service_role;
ALTER TABLE public.safety_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen admins view policy" ON public.safety_policies FOR SELECT TO authenticated USING (is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins add policy" ON public.safety_policies FOR INSERT TO authenticated WITH CHECK (is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins update policy" ON public.safety_policies FOR UPDATE TO authenticated USING (is_kitchen_admin(organization_id)) WITH CHECK (is_kitchen_admin(organization_id));
CREATE TRIGGER safety_policies_touch BEFORE UPDATE ON public.safety_policies FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE public.safety_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  surplus_batch_id uuid NOT NULL UNIQUE REFERENCES public.surplus_batches(id),
  holding_minutes integer NOT NULL,
  storage_mode text NOT NULL CHECK (storage_mode IN ('hot','cold')),
  temperature_c numeric(5,1) NOT NULL,
  handling_notes text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('eligible','blocked')),
  basis jsonb NOT NULL,
  policy_snapshot jsonb NOT NULL,
  reviewed_by uuid NOT NULL,
  reviewer_email text,
  reviewed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.safety_verifications TO authenticated;
GRANT ALL ON public.safety_verifications TO service_role;
ALTER TABLE public.safety_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen admins view verifications" ON public.safety_verifications FOR SELECT TO authenticated USING (is_kitchen_admin(organization_id));

CREATE TABLE public.recipient_profiles (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  service_area text NOT NULL CHECK (length(btrim(service_area)) BETWEEN 1 AND 200),
  accepted_food_types text[] NOT NULL DEFAULT '{prepared_meals}',
  capacity_meals integer NOT NULL CHECK (capacity_meals BETWEEN 0 AND 100000),
  pickup_from time NOT NULL,
  pickup_until time NOT NULL,
  pickup_contact text NOT NULL CHECK (length(btrim(pickup_contact)) BETWEEN 1 AND 200),
  pickup_notes text CHECK (pickup_notes IS NULL OR length(pickup_notes) <= 500),
  accepting_offers boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pickup_until > pickup_from)
);
GRANT SELECT ON public.recipient_profiles TO authenticated;
GRANT ALL ON public.recipient_profiles TO service_role;
ALTER TABLE public.recipient_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen admins and owners view recipient profiles" ON public.recipient_profiles FOR SELECT TO authenticated
  USING (is_any_kitchen_admin() OR is_org_member(organization_id));
CREATE TRIGGER recipient_profiles_touch BEFORE UPDATE ON public.recipient_profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE public.recipient_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  surplus_batch_id uuid NOT NULL REFERENCES public.surplus_batches(id),
  kitchen_org_id uuid NOT NULL REFERENCES public.organizations(id),
  recipient_org_id uuid NOT NULL REFERENCES public.organizations(id),
  kitchen_name text NOT NULL,
  recipient_name text NOT NULL,
  menu_name text NOT NULL,
  service_date date NOT NULL,
  meal_period meal_period NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  pickup_date date NOT NULL,
  pickup_from time NOT NULL,
  pickup_until time NOT NULL,
  handling_info text NOT NULL,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','accepted','declined','pickup_scheduled','picked_up','completed')),
  responded_at timestamptz,
  pickup_scheduled_at timestamp,
  pickup_owner text,
  pickup_notes text,
  picked_up_at timestamptz,
  received_quantity integer CHECK (received_quantity IS NULL OR received_quantity >= 0),
  received_at timestamptz,
  completed_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pickup_until > pickup_from),
  CHECK (received_quantity IS NULL OR received_quantity <= quantity)
);
CREATE UNIQUE INDEX recipient_offers_one_active ON public.recipient_offers (surplus_batch_id, recipient_org_id) WHERE status <> 'declined';
GRANT SELECT ON public.recipient_offers TO authenticated;
GRANT ALL ON public.recipient_offers TO service_role;
ALTER TABLE public.recipient_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen admins view their offers" ON public.recipient_offers FOR SELECT TO authenticated USING (is_kitchen_admin(kitchen_org_id));
CREATE POLICY "Recipients view offers addressed to them" ON public.recipient_offers FOR SELECT TO authenticated USING (is_org_member(recipient_org_id));
CREATE TRIGGER recipient_offers_touch BEFORE UPDATE ON public.recipient_offers FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Batch status derived from its offers (only after safety approval)
CREATE OR REPLACE FUNCTION public.refresh_batch_status(_batch uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _active int; _done int;
BEGIN
  SELECT count(*) FILTER (WHERE status IN ('sent','accepted','pickup_scheduled','picked_up')),
         count(*) FILTER (WHERE status = 'completed') INTO _active, _done
    FROM public.recipient_offers WHERE surplus_batch_id = _batch;
  UPDATE public.surplus_batches SET status = CASE WHEN _active > 0 THEN 'offered' WHEN _done > 0 THEN 'completed' ELSE 'available_for_offer' END
    WHERE id = _batch AND status IN ('available_for_offer','offered','completed');
END $$;
REVOKE EXECUTE ON FUNCTION public.refresh_batch_status(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_safety_check(_batch uuid, _holding_minutes int, _storage_mode text, _temperature numeric, _notes text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.surplus_batches; p public.safety_policies; _basis jsonb := '[]'::jsonb; _ok boolean := true; _outcome text;
BEGIN
  SELECT * INTO b FROM public.surplus_batches WHERE id = _batch FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT public.is_kitchen_admin(b.organization_id) THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
  IF b.status <> 'pending_safety' THEN RAISE EXCEPTION 'not_pending' USING ERRCODE = '22023'; END IF;
  IF _holding_minutes IS NULL OR _holding_minutes < 0 OR _holding_minutes > 10080 OR _storage_mode NOT IN ('hot','cold')
     OR _temperature IS NULL OR _temperature < -50 OR _temperature > 150 OR length(COALESCE(_notes,'')) > 1000 THEN
    RAISE EXCEPTION 'invalid_input' USING ERRCODE = '22023'; END IF;
  SELECT * INTO p FROM public.safety_policies WHERE organization_id = b.organization_id;
  IF NOT FOUND THEN INSERT INTO public.safety_policies (organization_id) VALUES (b.organization_id) RETURNING * INTO p; END IF;
  IF _holding_minutes <= p.max_holding_minutes THEN
    _basis := _basis || jsonb_build_object('ok', true, 'text', format('Holding time %s min is within the configured limit of %s min', _holding_minutes, p.max_holding_minutes));
  ELSE _ok := false;
    _basis := _basis || jsonb_build_object('ok', false, 'text', format('Holding time %s min exceeds the configured limit of %s min', _holding_minutes, p.max_holding_minutes)); END IF;
  IF _storage_mode = 'hot' THEN
    IF _temperature >= p.min_hot_holding_c THEN _basis := _basis || jsonb_build_object('ok', true, 'text', format('Hot-held at %s °C, at or above the configured minimum of %s °C', _temperature, p.min_hot_holding_c));
    ELSE _ok := false; _basis := _basis || jsonb_build_object('ok', false, 'text', format('Hot-held at %s °C, below the configured minimum of %s °C', _temperature, p.min_hot_holding_c)); END IF;
  ELSE
    IF _temperature <= p.max_cold_holding_c THEN _basis := _basis || jsonb_build_object('ok', true, 'text', format('Cold-held at %s °C, at or below the configured maximum of %s °C', _temperature, p.max_cold_holding_c));
    ELSE _ok := false; _basis := _basis || jsonb_build_object('ok', false, 'text', format('Cold-held at %s °C, above the configured maximum of %s °C', _temperature, p.max_cold_holding_c)); END IF;
  END IF;
  IF length(btrim(COALESCE(_notes,''))) >= 3 THEN _basis := _basis || jsonb_build_object('ok', true, 'text', 'Handling and storage notes recorded');
  ELSE _ok := false; _basis := _basis || jsonb_build_object('ok', false, 'text', 'Handling and storage notes are missing'); END IF;
  _outcome := CASE WHEN _ok THEN 'eligible' ELSE 'blocked' END;
  INSERT INTO public.safety_verifications (organization_id, surplus_batch_id, holding_minutes, storage_mode, temperature_c, handling_notes, outcome, basis, policy_snapshot, reviewed_by, reviewer_email)
  VALUES (b.organization_id, b.id, _holding_minutes, _storage_mode, _temperature, btrim(COALESCE(_notes,'')), _outcome, _basis,
    jsonb_build_object('max_holding_minutes', p.max_holding_minutes, 'min_hot_holding_c', p.min_hot_holding_c, 'max_cold_holding_c', p.max_cold_holding_c),
    auth.uid(), auth.jwt()->>'email');
  UPDATE public.surplus_batches SET status = CASE WHEN _ok THEN 'available_for_offer' ELSE 'safety_blocked' END WHERE id = b.id;
  RETURN _outcome;
END $$;

CREATE OR REPLACE FUNCTION public.upsert_recipient_profile(_org uuid, _area text, _food_types text[], _capacity int, _from time, _until time, _contact text, _notes text, _accepting boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _name text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_ngo_admin(_org) THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
  SELECT name INTO _name FROM public.organizations WHERE id = _org;
  INSERT INTO public.recipient_profiles (organization_id, display_name, service_area, accepted_food_types, capacity_meals, pickup_from, pickup_until, pickup_contact, pickup_notes, accepting_offers)
  VALUES (_org, _name, btrim(_area), _food_types, _capacity, _from, _until, btrim(_contact), NULLIF(btrim(COALESCE(_notes,'')),''), _accepting)
  ON CONFLICT (organization_id) DO UPDATE SET display_name = EXCLUDED.display_name, service_area = EXCLUDED.service_area,
    accepted_food_types = EXCLUDED.accepted_food_types, capacity_meals = EXCLUDED.capacity_meals, pickup_from = EXCLUDED.pickup_from,
    pickup_until = EXCLUDED.pickup_until, pickup_contact = EXCLUDED.pickup_contact, pickup_notes = EXCLUDED.pickup_notes, accepting_offers = EXCLUDED.accepting_offers;
END $$;

CREATE OR REPLACE FUNCTION public.create_recipient_offer(_batch uuid, _recipient uuid, _quantity int, _pickup_date date, _from time, _until time)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE b public.surplus_batches; r public.recipient_profiles; v public.safety_verifications; _used int; _id uuid; _kname text;
BEGIN
  SELECT * INTO b FROM public.surplus_batches WHERE id = _batch FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL OR NOT public.is_kitchen_admin(b.organization_id) THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v FROM public.safety_verifications WHERE surplus_batch_id = b.id;
  IF b.status NOT IN ('available_for_offer','offered','completed') OR v.outcome IS DISTINCT FROM 'eligible' THEN RAISE EXCEPTION 'not_eligible' USING ERRCODE = '22023'; END IF;
  SELECT * INTO r FROM public.recipient_profiles rp WHERE rp.organization_id = _recipient
    AND EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = rp.organization_id AND o.org_type = 'ngo');
  IF NOT FOUND THEN RAISE EXCEPTION 'recipient_not_found' USING ERRCODE = 'P0002'; END IF;
  IF _pickup_date IS NULL OR _from IS NULL OR _until IS NULL OR _until <= _from THEN RAISE EXCEPTION 'invalid_window' USING ERRCODE = '22023'; END IF;
  IF NOT r.accepting_offers OR NOT ('prepared_meals' = ANY (r.accepted_food_types)) OR _quantity > r.capacity_meals
     OR NOT (_from < r.pickup_until AND r.pickup_from < _until) THEN RAISE EXCEPTION 'recipient_incompatible' USING ERRCODE = '22023'; END IF;
  SELECT COALESCE(sum(CASE WHEN status = 'completed' THEN COALESCE(received_quantity, quantity) ELSE quantity END),0) INTO _used
    FROM public.recipient_offers WHERE surplus_batch_id = b.id AND status <> 'declined';
  IF _quantity IS NULL OR _quantity <= 0 OR _quantity > b.potential_surplus - _used THEN RAISE EXCEPTION 'quantity_exceeds' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.recipient_offers WHERE surplus_batch_id = b.id AND recipient_org_id = _recipient AND status <> 'declined') THEN
    RAISE EXCEPTION 'duplicate_offer' USING ERRCODE = '23505'; END IF;
  SELECT name INTO _kname FROM public.organizations WHERE id = b.organization_id;
  INSERT INTO public.recipient_offers (surplus_batch_id, kitchen_org_id, recipient_org_id, kitchen_name, recipient_name, menu_name, service_date, meal_period, quantity, pickup_date, pickup_from, pickup_until, handling_info)
  VALUES (b.id, b.organization_id, _recipient, _kname, r.display_name, b.menu_name, b.service_date, b.meal_period, _quantity, _pickup_date, _from, _until,
    format('%s at %s °C; screened after %s min holding. %s', CASE WHEN v.storage_mode = 'hot' THEN 'Hot-held' ELSE 'Cold-held' END, v.temperature_c, v.holding_minutes, v.handling_notes))
  RETURNING id INTO _id;
  PERFORM public.refresh_batch_status(b.id);
  RETURN _id;
END $$;

-- NGO + kitchen actions on an offer. Each transition only from its exact previous state.
CREATE OR REPLACE FUNCTION public.advance_recipient_offer(_offer uuid, _action text, _when timestamp DEFAULT NULL, _owner text DEFAULT NULL, _notes text DEFAULT NULL, _received int DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE o public.recipient_offers; _ngo boolean; _kitchen boolean;
BEGIN
  SELECT * INTO o FROM public.recipient_offers WHERE id = _offer FOR UPDATE;
  IF NOT FOUND OR auth.uid() IS NULL THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
  _ngo := public.is_ngo_admin(o.recipient_org_id); _kitchen := public.is_kitchen_admin(o.kitchen_org_id);
  IF _action IN ('accept','decline') THEN
    IF NOT _ngo THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
    IF o.status <> 'sent' THEN RAISE EXCEPTION 'invalid_transition' USING ERRCODE = '22023'; END IF;
    UPDATE public.recipient_offers SET status = CASE WHEN _action = 'accept' THEN 'accepted' ELSE 'declined' END, responded_at = now() WHERE id = o.id;
  ELSIF _action = 'schedule' THEN
    IF NOT (_ngo OR _kitchen) THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
    IF o.status NOT IN ('accepted','pickup_scheduled') THEN RAISE EXCEPTION 'invalid_transition' USING ERRCODE = '22023'; END IF;
    IF _when IS NULL OR length(btrim(COALESCE(_owner,''))) = 0 OR length(_owner) > 200 OR length(COALESCE(_notes,'')) > 500 THEN RAISE EXCEPTION 'invalid_input' USING ERRCODE = '22023'; END IF;
    UPDATE public.recipient_offers SET status = 'pickup_scheduled', pickup_scheduled_at = _when, pickup_owner = btrim(_owner), pickup_notes = NULLIF(btrim(COALESCE(_notes,'')),'') WHERE id = o.id;
  ELSIF _action = 'picked_up' THEN
    IF NOT (_ngo OR _kitchen) THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
    IF o.status <> 'pickup_scheduled' THEN RAISE EXCEPTION 'invalid_transition' USING ERRCODE = '22023'; END IF;
    UPDATE public.recipient_offers SET status = 'picked_up', picked_up_at = now() WHERE id = o.id;
  ELSIF _action = 'receive' THEN
    IF NOT _ngo THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
    IF o.status <> 'picked_up' THEN RAISE EXCEPTION 'invalid_transition' USING ERRCODE = '22023'; END IF;
    IF _received IS NULL OR _received < 0 OR _received > o.quantity THEN RAISE EXCEPTION 'invalid_input' USING ERRCODE = '22023'; END IF;
    UPDATE public.recipient_offers SET status = 'completed', received_quantity = _received, received_at = now(), completed_at = now() WHERE id = o.id;
  ELSE RAISE EXCEPTION 'invalid_input' USING ERRCODE = '22023';
  END IF;
  PERFORM public.refresh_batch_status(o.surplus_batch_id);
  SELECT status INTO o.status FROM public.recipient_offers WHERE id = o.id;
  RETURN o.status;
END $$;
