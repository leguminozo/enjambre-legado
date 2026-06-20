-- Migration 63: Soberanía fiscal — cola SII, documentos fuente, extensión gastos_extranjeros

CREATE TABLE IF NOT EXISTS public.sii_document_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('gasto_extranjero', 'venta', 'manual')),
  source_id UUID NOT NULL,
  tipo_dte INT NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
  attempts INT NOT NULL DEFAULT 0,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_sii_document_jobs_pending
  ON public.sii_document_jobs (scheduled_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_sii_document_jobs_empresa
  ON public.sii_document_jobs (empresa_id, status);

ALTER TABLE public.sii_document_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sii_document_jobs_empresa_read" ON public.sii_document_jobs;
CREATE POLICY "sii_document_jobs_empresa_read" ON public.sii_document_jobs
  FOR SELECT USING (has_empresa_access(empresa_id));

DROP POLICY IF EXISTS "sii_document_jobs_service_write" ON public.sii_document_jobs;
CREATE POLICY "sii_document_jobs_service_write" ON public.sii_document_jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.fiscal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  extracted_text TEXT,
  proveedor_detectado TEXT,
  gasto_extranjero_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_id, sha256)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_documents_empresa
  ON public.fiscal_documents (empresa_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fiscal_documents_gasto
  ON public.fiscal_documents (gasto_extranjero_id)
  WHERE gasto_extranjero_id IS NOT NULL;

ALTER TABLE public.fiscal_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fiscal_documents_empresa_access" ON public.fiscal_documents;
CREATE POLICY "fiscal_documents_empresa_access" ON public.fiscal_documents
  FOR ALL USING (has_empresa_access(empresa_id));

ALTER TABLE public.gastos_extranjeros
  ADD COLUMN IF NOT EXISTS fiscal_document_id UUID REFERENCES public.fiscal_documents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS rcv_registro_id UUID REFERENCES public.rcv_registros(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_gastos_extranjeros_idempotency
  ON public.gastos_extranjeros (empresa_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_gastos_extranjeros_idempotency_unique
  ON public.gastos_extranjeros (empresa_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND estado <> 'rechazado_sii';

ALTER TABLE public.fiscal_documents
  ADD CONSTRAINT fiscal_documents_gasto_extranjero_id_fkey
  FOREIGN KEY (gasto_extranjero_id) REFERENCES public.gastos_extranjeros(id) ON DELETE SET NULL;

-- Storage bucket para PDFs, imágenes y XML DTE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sii-documents',
  'sii-documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'application/xml', 'text/xml']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "sii_documents_upload" ON storage.objects;
CREATE POLICY "sii_documents_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'sii-documents'
    AND public.has_empresa_access((storage.foldername(name))[1]::UUID)
  );

DROP POLICY IF EXISTS "sii_documents_read" ON storage.objects;
CREATE POLICY "sii_documents_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'sii-documents'
    AND public.has_empresa_access((storage.foldername(name))[1]::UUID)
  );

DROP POLICY IF EXISTS "sii_documents_delete" ON storage.objects;
CREATE POLICY "sii_documents_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'sii-documents'
    AND public.has_empresa_access((storage.foldername(name))[1]::UUID)
  );

DROP POLICY IF EXISTS "sii_documents_service_all" ON storage.objects;
CREATE POLICY "sii_documents_service_all" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'sii-documents')
  WITH CHECK (bucket_id = 'sii-documents');