DROP POLICY "Members view their organizations" ON public.organizations;
DROP POLICY "Admins update their organizations" ON public.organizations;
DROP POLICY "Members view memberships of their organizations" ON public.organization_members;
DROP POLICY "Admins update memberships" ON public.organization_members;
DROP POLICY "Admins remove memberships" ON public.organization_members;
DROP FUNCTION public.is_org_member(uuid, uuid);
DROP FUNCTION public.has_org_role(uuid, uuid, public.org_role);

CREATE FUNCTION public.is_org_member(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = auth.uid())
$$;
CREATE FUNCTION public.is_org_admin(_org uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE organization_id = _org AND user_id = auth.uid() AND role = 'admin')
$$;
REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_org_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;

CREATE POLICY "Members view their organizations" ON public.organizations
  FOR SELECT TO authenticated USING (public.is_org_member(id));
CREATE POLICY "Admins update their organizations" ON public.organizations
  FOR UPDATE TO authenticated USING (public.is_org_admin(id)) WITH CHECK (public.is_org_admin(id));
CREATE POLICY "Members view memberships of their organizations" ON public.organization_members
  FOR SELECT TO authenticated USING (public.is_org_member(organization_id));
CREATE POLICY "Admins update memberships" ON public.organization_members
  FOR UPDATE TO authenticated USING (public.is_org_admin(organization_id)) WITH CHECK (public.is_org_admin(organization_id));
CREATE POLICY "Admins remove memberships" ON public.organization_members
  FOR DELETE TO authenticated USING (public.is_org_admin(organization_id));