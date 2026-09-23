CREATE TYPE public.org_role AS ENUM ('admin', 'member');

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 120),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX organizations_name_unique ON public.organizations (lower(btrim(name)));

CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role public.org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
CREATE INDEX organization_members_user_idx ON public.organization_members (user_id);

GRANT SELECT, UPDATE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
GRANT SELECT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(_org uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = _user)
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org uuid, _user uuid, _role public.org_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = _user AND role = _role)
$$;

CREATE POLICY "Members view their organizations" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id, auth.uid()));
CREATE POLICY "Admins update their organizations" ON public.organizations
  FOR UPDATE TO authenticated USING (public.has_org_role(id, auth.uid(), 'admin'))
  WITH CHECK (public.has_org_role(id, auth.uid(), 'admin'));

CREATE POLICY "Members view memberships of their organizations" ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id, auth.uid()));
CREATE POLICY "Admins update memberships" ON public.organization_members
  FOR UPDATE TO authenticated USING (public.has_org_role(organization_id, auth.uid(), 'admin'))
  WITH CHECK (public.has_org_role(organization_id, auth.uid(), 'admin'));
CREATE POLICY "Admins remove memberships" ON public.organization_members
  FOR DELETE TO authenticated USING (public.has_org_role(organization_id, auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER organizations_touch BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Creates an organization and makes the caller (from the verified session) its admin.
CREATE OR REPLACE FUNCTION public.create_organization(_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.organizations (name, created_by) VALUES (btrim(_name), _uid) RETURNING id INTO _id;
  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (_id, _uid, 'admin');
  RETURN _id;
END; $$;
REVOKE ALL ON FUNCTION public.create_organization(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_organization(text) TO authenticated;

INSERT INTO public.organizations (name) VALUES ('Demo Kitchen Group');