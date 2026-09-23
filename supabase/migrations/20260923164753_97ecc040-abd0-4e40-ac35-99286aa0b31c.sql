REVOKE ALL ON FUNCTION public.is_org_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_org_role(uuid, uuid, public.org_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, uuid, public.org_role) TO authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;