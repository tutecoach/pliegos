
-- Equipment/machinery table for company infrastructure
CREATE TABLE public.company_equipment (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'maquinaria',
  nombre TEXT NOT NULL,
  descripcion TEXT,
  cantidad INTEGER DEFAULT 1,
  estado TEXT DEFAULT 'operativo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.company_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company equipment" ON public.company_equipment
  FOR SELECT TO authenticated USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can manage company equipment" ON public.company_equipment
  FOR INSERT TO authenticated WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company equipment" ON public.company_equipment
  FOR UPDATE TO authenticated USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company equipment" ON public.company_equipment
  FOR DELETE TO authenticated USING (company_id = get_user_company_id(auth.uid()));

-- Multi-company: junction table for Enterprise users
CREATE TABLE public.user_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own company links" ON public.user_companies
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can insert own company links" ON public.user_companies
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own company links" ON public.user_companies
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can delete own company links" ON public.user_companies
  FOR DELETE TO authenticated USING (user_id = auth.uid());
