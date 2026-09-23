CREATE TABLE public.demand_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_date date NOT NULL,
  meal_period meal_period NOT NULL,
  menu_name text NOT NULL CHECK (char_length(btrim(menu_name)) BETWEEN 1 AND 200),
  expected_attendance integer NOT NULL CHECK (expected_attendance BETWEEN 0 AND 1000000),
  forecast_demand integer NOT NULL CHECK (forecast_demand >= 0),
  recommended_preparation integer NOT NULL CHECK (recommended_preparation >= forecast_demand),
  buffer integer NOT NULL CHECK (buffer >= 0),
  consumption_rate numeric(8,4) NOT NULL CHECK (consumption_rate >= 0),
  history_count integer NOT NULL CHECK (history_count >= 0),
  history_status text NOT NULL CHECK (history_status IN ('limited','sufficient')),
  method_version text NOT NULL,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, service_date, meal_period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demand_forecasts TO authenticated;
GRANT ALL ON public.demand_forecasts TO service_role;
ALTER TABLE public.demand_forecasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Kitchen admins view forecasts" ON public.demand_forecasts FOR SELECT TO authenticated USING (public.is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins add forecasts" ON public.demand_forecasts FOR INSERT TO authenticated WITH CHECK (public.is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins update forecasts" ON public.demand_forecasts FOR UPDATE TO authenticated USING (public.is_kitchen_admin(organization_id)) WITH CHECK (public.is_kitchen_admin(organization_id));
CREATE POLICY "Kitchen admins delete forecasts" ON public.demand_forecasts FOR DELETE TO authenticated USING (public.is_kitchen_admin(organization_id));
CREATE TRIGGER demand_forecasts_touch BEFORE UPDATE ON public.demand_forecasts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();