
-- Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cif TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles table (separate from profiles per security guidelines)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper to get company_id for current user
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.profiles WHERE user_id = _user_id
$$;

-- Projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_projects_company ON public.projects(company_id);
CREATE INDEX idx_projects_created ON public.projects(created_at);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Tenders table
CREATE TABLE public.tenders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  contracting_entity TEXT,
  contract_amount NUMERIC,
  duration TEXT,
  submission_deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_tenders_company ON public.tenders(company_id);
CREATE INDEX idx_tenders_project ON public.tenders(project_id);
CREATE INDEX idx_tenders_created ON public.tenders(created_at);
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;

-- Tender documents
CREATE TABLE public.tender_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tender_docs_tender ON public.tender_documents(tender_id);
ALTER TABLE public.tender_documents ENABLE ROW LEVEL SECURITY;

-- Analysis reports
CREATE TABLE public.analysis_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'processing',
  report_data JSONB,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_reports_tender ON public.analysis_reports(tender_id);
CREATE INDEX idx_reports_company ON public.analysis_reports(company_id);
ALTER TABLE public.analysis_reports ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_created ON public.audit_logs(created_at);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenders_updated_at BEFORE UPDATE ON public.tenders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.analysis_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + admin role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Companies
CREATE POLICY "Users can view own company" ON public.companies
  FOR SELECT USING (id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Admins can update own company" ON public.companies
  FOR UPDATE USING (id = public.get_user_company_id(auth.uid()) AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert companies" ON public.companies
  FOR INSERT WITH CHECK (true);

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "System can insert profiles" ON public.profiles
  FOR INSERT WITH CHECK (true);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (true);

-- Projects
CREATE POLICY "Users can view company projects" ON public.projects
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) AND deleted_at IS NULL);
CREATE POLICY "Users can create company projects" ON public.projects
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company projects" ON public.projects
  FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));

-- Tenders
CREATE POLICY "Users can view company tenders" ON public.tenders
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()) AND deleted_at IS NULL);
CREATE POLICY "Users can create company tenders" ON public.tenders
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can update company tenders" ON public.tenders
  FOR UPDATE USING (company_id = public.get_user_company_id(auth.uid()));

-- Tender documents
CREATE POLICY "Users can view company tender docs" ON public.tender_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.company_id = public.get_user_company_id(auth.uid()))
  );
CREATE POLICY "Users can upload company tender docs" ON public.tender_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.tenders t WHERE t.id = tender_id AND t.company_id = public.get_user_company_id(auth.uid()))
  );

-- Analysis reports
CREATE POLICY "Users can view company reports" ON public.analysis_reports
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "Users can create company reports" ON public.analysis_reports
  FOR INSERT WITH CHECK (company_id = public.get_user_company_id(auth.uid()));

-- Audit logs
CREATE POLICY "Users can view company audit logs" ON public.audit_logs
  FOR SELECT USING (company_id = public.get_user_company_id(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);
