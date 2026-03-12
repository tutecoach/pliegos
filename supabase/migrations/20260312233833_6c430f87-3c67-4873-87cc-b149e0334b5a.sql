
-- Allow users to delete their company's tender documents
CREATE POLICY "Users can delete company tender docs"
  ON public.tender_documents
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM tenders t
      WHERE t.id = tender_documents.tender_id
      AND t.company_id = get_user_company_id(auth.uid())
    )
  );
