-- Allow users to view companies they're linked to via user_companies
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;

CREATE POLICY "Users can view own company"
  ON public.companies
  FOR SELECT
  TO public
  USING (
    id = get_user_company_id(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.company_id = companies.id
      AND uc.user_id = auth.uid()
    )
  );

-- Also allow admins to update any of their linked companies
DROP POLICY IF EXISTS "Admins can update own company" ON public.companies;

CREATE POLICY "Admins can update own company"
  ON public.companies
  FOR UPDATE
  TO public
  USING (
    (id = get_user_company_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
    OR EXISTS (
      SELECT 1 FROM public.user_companies uc
      WHERE uc.company_id = companies.id
      AND uc.user_id = auth.uid()
      AND uc.role = 'owner'
    )
  );