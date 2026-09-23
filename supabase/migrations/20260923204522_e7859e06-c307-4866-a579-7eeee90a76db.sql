CREATE TABLE public.impact_assumptions (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  financial_per_meal numeric NOT NULL DEFAULT 50 CHECK (financial_per_meal >= 0 AND financial_per_meal <= 100000),
  co2e_kg_per_meal numeric NOT NULL DEFAULT 0.5 CHECK (co2e_kg_per_meal >= 0 AND co2e_kg_per_meal <= 1000),
  social_per_meal numeric NOT NULL DEFAULT 1 CHECK (social_per_meal >= 0 AND social_per_meal <= 1000),
  updated_by uuid DEFAULT auth.uid(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.impact_assumptions TO authenticated;
GRANT ALL ON public.impact_assumptions TO service_role;
ALTER TABLE public.impact_assumptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen admins view assumptions" ON public.impact_assumptions FOR SELECT TO authenticated USING (public.is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins add assumptions" ON public.impact_assumptions FOR INSERT TO authenticated WITH CHECK (public.is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins update assumptions" ON public.impact_assumptions FOR UPDATE TO authenticated USING (public.is_kitchen_admin(organization_id)) WITH CHECK (public.is_kitchen_admin(organization_id));
CREATE TRIGGER impact_assumptions_touch BEFORE UPDATE ON public.impact_assumptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();