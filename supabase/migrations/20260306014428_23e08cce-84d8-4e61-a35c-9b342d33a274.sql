
-- Extend companies table with strategic fields
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS facturacion_anual numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS patrimonio_neto numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clasificacion_empresarial text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sectores_actividad text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capacidad_tecnica text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS capacidad_economica text DEFAULT NULL;

-- Company certifications
CREATE TABLE public.company_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  organismo_emisor text,
  fecha_obtencion date,
  fecha_vencimiento date,
  puntuable boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company certifications"
  ON public.company_certifications FOR SELECT
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can manage company certifications"
  ON public.company_certifications FOR INSERT
  TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company certifications"
  ON public.company_certifications FOR UPDATE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company certifications"
  ON public.company_certifications FOR DELETE
  TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Company experience (obras ejecutadas)
CREATE TABLE public.company_experience (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  cliente text,
  sector text,
  importe numeric,
  fecha_inicio date,
  fecha_fin date,
  descripcion text,
  resultado text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_experience ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company experience"
  ON public.company_experience FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can manage company experience"
  ON public.company_experience FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company experience"
  ON public.company_experience FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company experience"
  ON public.company_experience FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Company team members
CREATE TABLE public.company_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  cargo text,
  titulacion text,
  experiencia_anos integer DEFAULT 0,
  certificaciones text[],
  sector_especialidad text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.company_team ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company team"
  ON public.company_team FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can manage company team"
  ON public.company_team FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company team"
  ON public.company_team FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can delete company team"
  ON public.company_team FOR DELETE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

-- Extend tenders with sector and guarantee fields
ALTER TABLE public.tenders
  ADD COLUMN IF NOT EXISTS sector text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS garantia_provisional numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS garantia_definitiva numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS clasificacion_requerida text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS valor_estimado numeric DEFAULT NULL;

-- Tender administrative requirements
CREATE TABLE public.tender_requirements_admin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  obligatorio boolean DEFAULT true,
  normativa_aplicable text,
  riesgo_exclusion text DEFAULT 'medio',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_requirements_admin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tender admin reqs"
  ON public.tender_requirements_admin FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Service can manage tender admin reqs"
  ON public.tender_requirements_admin FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

-- Tender technical requirements
CREATE TABLE public.tender_requirements_tech (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  descripcion text NOT NULL,
  experiencia_minima text,
  equipo_minimo text,
  medios_minimos text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_requirements_tech ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tender tech reqs"
  ON public.tender_requirements_tech FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Service can manage tender tech reqs"
  ON public.tender_requirements_tech FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

-- Tender award criteria
CREATE TABLE public.tender_criteria (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'automatico',
  descripcion text NOT NULL,
  ponderacion numeric DEFAULT 0,
  formula text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_criteria ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tender criteria"
  ON public.tender_criteria FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Service can manage tender criteria"
  ON public.tender_criteria FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

-- Tender risks
CREATE TABLE public.tender_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'tecnico',
  descripcion text NOT NULL,
  nivel text NOT NULL DEFAULT 'medio',
  mitigacion text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tender risks"
  ON public.tender_risks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Service can manage tender risks"
  ON public.tender_risks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

-- Tender strategy
CREATE TABLE public.tender_strategy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  estrategia_economica text,
  estrategia_tecnica text,
  mejoras_propuestas text,
  narrativa_recomendada text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_strategy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tender strategy"
  ON public.tender_strategy FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

CREATE POLICY "Service can manage tender strategy"
  ON public.tender_strategy FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM tenders t WHERE t.id = tender_id AND t.company_id = get_user_company_id(auth.uid())));

-- Matching empresa-pliego
CREATE TABLE public.tender_matching (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  cumplimiento text DEFAULT 'parcial',
  iat_score numeric DEFAULT 0,
  ire_score numeric DEFAULT 0,
  pea_score numeric DEFAULT 0,
  riesgo text DEFAULT 'medio',
  observaciones text,
  acciones_recomendadas text,
  fortalezas text[],
  brechas text[],
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tender_matching ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tender matching"
  ON public.tender_matching FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Service can manage tender matching"
  ON public.tender_matching FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

-- Technical memory documents
CREATE TABLE public.technical_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id uuid NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  content text,
  sector text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.technical_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view company memories"
  ON public.technical_memories FOR SELECT TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can create company memories"
  ON public.technical_memories FOR INSERT TO authenticated
  WITH CHECK (company_id = get_user_company_id(auth.uid()));

CREATE POLICY "Users can update company memories"
  ON public.technical_memories FOR UPDATE TO authenticated
  USING (company_id = get_user_company_id(auth.uid()));
