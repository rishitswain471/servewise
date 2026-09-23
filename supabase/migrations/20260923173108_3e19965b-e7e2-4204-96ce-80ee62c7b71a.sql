ALTER TYPE public.org_type RENAME VALUE 'recipient' TO 'ngo';

UPDATE public.organizations SET org_type = 'kitchen' WHERE name = 'Demo Kitchen Group' AND org_type <> 'kitchen';

CREATE OR REPLACE FUNCTION public.prevent_org_type_change()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.org_type IS DISTINCT FROM OLD.org_type THEN
    RAISE EXCEPTION 'organization_type_immutable' USING ERRCODE = '42501';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'organization_creator_immutable' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER organizations_type_immutable
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.prevent_org_type_change();