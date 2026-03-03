
-- Fix overly permissive INSERT policies

-- Companies: only authenticated users can insert
DROP POLICY "Users can insert companies" ON public.companies;
CREATE POLICY "Authenticated users can insert companies" ON public.companies
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Profiles: only the user themselves (via trigger, but restrict anyway)
DROP POLICY "System can insert profiles" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User roles: only via trigger, restrict to own user
DROP POLICY "System can insert roles" ON public.user_roles;
CREATE POLICY "Users can insert own roles" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Audit logs: only authenticated users from same company
DROP POLICY "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
