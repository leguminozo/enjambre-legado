-- Migration 64: RLS fix — authenticated puede encolar sii_document_jobs

DROP POLICY IF EXISTS "sii_document_jobs_empresa_insert" ON public.sii_document_jobs;
CREATE POLICY "sii_document_jobs_empresa_insert" ON public.sii_document_jobs
  FOR INSERT TO authenticated
  WITH CHECK (has_empresa_access(empresa_id));