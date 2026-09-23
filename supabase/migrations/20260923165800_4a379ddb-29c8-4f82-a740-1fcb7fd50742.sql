CREATE TYPE public.org_type AS ENUM ('kitchen', 'recipient');
ALTER TABLE public.organizations ADD COLUMN org_type public.org_type NOT NULL DEFAULT 'kitchen';

DROP FUNCTION public.create_organization(text);
CREATE FUNCTION public.create_organization(_name text, _type public.org_type)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.organizations (name, org_type, created_by) VALUES (btrim(_name), _type, _uid) RETURNING id INTO _id;
  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (_id, _uid, 'admin');
  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public.create_organization(text, public.org_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(text, public.org_type) TO authenticated;