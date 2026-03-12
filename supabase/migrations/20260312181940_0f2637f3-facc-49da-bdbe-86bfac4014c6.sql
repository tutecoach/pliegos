-- Add plan tier enum
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'plan_tier' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.plan_tier AS ENUM ('starter', 'professional', 'enterprise');
  END IF;
END
$$;

-- Add plan tier to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS plan_tier public.plan_tier NOT NULL DEFAULT 'starter';

-- Prevent self-upgrades of plan tier
CREATE OR REPLACE FUNCTION public.enforce_plan_tier_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.plan_tier IS DISTINCT FROM OLD.plan_tier THEN
    IF auth.role() <> 'service_role' AND (auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin')) THEN
      RAISE EXCEPTION 'Only admins can change plan tier';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_plan_tier_update_trigger ON public.profiles;
CREATE TRIGGER enforce_plan_tier_update_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_plan_tier_update();

-- Plans catalog (without prices)
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tier public.plan_tier NOT NULL UNIQUE,
  display_name text NOT NULL,
  description text NOT NULL,
  features text[] NOT NULL DEFAULT '{}'::text[],
  excluded_features text[] NOT NULL DEFAULT '{}'::text[],
  highlighted boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON public.subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Public can view published subscription plans" ON public.subscription_plans;
CREATE POLICY "Public can view published subscription plans"
ON public.subscription_plans
FOR SELECT
TO public
USING (is_published = true);

DROP POLICY IF EXISTS "Admins can view all subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can view all subscription plans"
ON public.subscription_plans
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can insert subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can insert subscription plans"
ON public.subscription_plans
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can update subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can update subscription plans"
ON public.subscription_plans
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can delete subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can delete subscription plans"
ON public.subscription_plans
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Seed plans (no prices shown)
INSERT INTO public.subscription_plans (
  tier, display_name, description, features, excluded_features, highlighted, is_published, sort_order
)
VALUES
(
  'starter',
  'Starter',
  'Para empresas que inician en licitaciones',
  ARRAY[
    '3 análisis de pliegos/mes',
    'Extracción estructurada del PDF',
    'Clasificación sectorial automática',
    'Informe básico con requisitos y riesgos',
    'Checklist documental',
    '1 usuario',
    'Soporte por email'
  ],
  ARRAY[
    'Simulador de scoring avanzado',
    'Generador de memoria técnica',
    'Matching empresa vs pliego'
  ],
  false,
  true,
  1
),
(
  'professional',
  'Professional',
  'Para empresas con volumen de licitaciones',
  ARRAY[
    'Análisis ilimitados',
    '4 capas de análisis profundo',
    'Scoring predictivo (IAT + IRE + PEA)',
    'Simulación económica interactiva',
    'Generador de memoria técnica sectorial',
    'Matching empresa vs pliego',
    'Estrategia competitiva completa',
    '5 usuarios',
    'Soporte prioritario'
  ],
  ARRAY[]::text[],
  true,
  true,
  2
),
(
  'enterprise',
  'Enterprise',
  'Para grandes constructoras y UTEs',
  ARRAY[
    'Todo en Professional',
    'Multi-empresa',
    'Usuarios ilimitados',
    'Reportes avanzados y exportación',
    'API de integración',
    'Integraciones ERP',
    'Gestor de cuenta dedicado',
    'SLA garantizado'
  ],
  ARRAY[]::text[],
  false,
  true,
  3
)
ON CONFLICT (tier)
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  excluded_features = EXCLUDED.excluded_features,
  highlighted = EXCLUDED.highlighted,
  sort_order = EXCLUDED.sort_order;

-- Promote existing admins to Professional by default
UPDATE public.profiles p
SET plan_tier = 'professional'
WHERE EXISTS (
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = p.user_id
    AND ur.role = 'admin'
);