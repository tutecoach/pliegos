
-- Create storage bucket for tender documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('tender-documents', 'tender-documents', false, 20971520, ARRAY['application/pdf']);

-- RLS policies for storage
CREATE POLICY "Users can upload tender docs" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'tender-documents' AND
  EXISTS (
    SELECT 1 FROM public.tenders t
    WHERE t.id::text = (storage.foldername(name))[1]
    AND t.company_id = public.get_user_company_id(auth.uid())
  )
);

CREATE POLICY "Users can view tender docs" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'tender-documents' AND
  EXISTS (
    SELECT 1 FROM public.tenders t
    WHERE t.id::text = (storage.foldername(name))[1]
    AND t.company_id = public.get_user_company_id(auth.uid())
  )
);
