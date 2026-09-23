CREATE OR REPLACE FUNCTION public.prevent_org_type_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.org_type IS DISTINCT FROM OLD.org_type
     AND coalesce(current_setting('servewise.allow_type_change', true), '') <> 'on' THEN
    RAISE EXCEPTION 'organization_type_immutable' USING ERRCODE = '42501';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'organization_creator_immutable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.update_organization_settings(_org uuid, _name text, _type org_type)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cur org_type; n text := btrim(coalesce(_name, ''));
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_org_admin(_org) THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;
  IF length(n) < 2 OR length(n) > 120 THEN
    RAISE EXCEPTION 'invalid_name' USING ERRCODE = '23514';
  END IF;
  SELECT org_type INTO cur FROM organizations WHERE id = _org FOR UPDATE;
  IF cur IS NULL THEN RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501'; END IF;
  IF _type IS DISTINCT FROM cur THEN
    IF EXISTS (SELECT 1 FROM service_records WHERE organization_id = _org)
       OR EXISTS (SELECT 1 FROM demand_forecasts WHERE organization_id = _org)
       OR EXISTS (SELECT 1 FROM surplus_batches WHERE organization_id = _org)
       OR EXISTS (SELECT 1 FROM recipient_offers WHERE kitchen_org_id = _org OR recipient_org_id = _org)
       OR EXISTS (SELECT 1 FROM recipient_profiles WHERE organization_id = _org) THEN
      RAISE EXCEPTION 'type_locked' USING ERRCODE = '42501';
    END IF;
    PERFORM set_config('servewise.allow_type_change', 'on', true);
  END IF;
  UPDATE organizations SET name = n, org_type = _type, updated_at = now() WHERE id = _org;
  PERFORM set_config('servewise.allow_type_change', 'off', true);
END; $$;

REVOKE EXECUTE ON FUNCTION public.update_organization_settings(uuid, text, org_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_organization_settings(uuid, text, org_type) TO authenticated;