DROP INDEX public.recipient_offers_one_active;
CREATE UNIQUE INDEX recipient_offers_one_active ON public.recipient_offers (surplus_batch_id, recipient_org_id) WHERE status NOT IN ('declined','completed');
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
  IF EXISTS (SELECT 1 FROM public.recipient_offers WHERE surplus_batch_id = b.id AND recipient_org_id = _recipient AND status NOT IN ('declined','completed')) THEN
    RAISE EXCEPTION 'duplicate_offer' USING ERRCODE = '23505'; END IF;
  SELECT name INTO _kname FROM public.organizations WHERE id = b.organization_id;
  INSERT INTO public.recipient_offers (surplus_batch_id, kitchen_org_id, recipient_org_id, kitchen_name, recipient_name, menu_name, service_date, meal_period, quantity, pickup_date, pickup_from, pickup_until, handling_info)
  VALUES (b.id, b.organization_id, _recipient, _kname, r.display_name, b.menu_name, b.service_date, b.meal_period, _quantity, _pickup_date, _from, _until,
    format('%s at %s °C; screened after %s min holding. %s', CASE WHEN v.storage_mode = 'hot' THEN 'Hot-held' ELSE 'Cold-held' END, v.temperature_c, v.holding_minutes, v.handling_notes))
  RETURNING id INTO _id;
  PERFORM public.refresh_batch_status(b.id);
  RETURN _id;
END $$;
REVOKE EXECUTE ON FUNCTION public.create_recipient_offer(uuid,uuid,int,date,time,time) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_recipient_offer(uuid,uuid,int,date,time,time) TO authenticated;