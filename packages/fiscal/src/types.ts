export const SII_JOB_STATUSES = [
  'pending',
  'processing',
  'completed',
  'failed',
  'dead_letter',
] as const;

export type SiiJobStatus = (typeof SII_JOB_STATUSES)[number];

export type SiiDocumentJobSourceType = 'gasto_extranjero' | 'venta' | 'manual';

export type SiiDocumentJob = {
  id: string;
  empresa_id: string;
  source_type: SiiDocumentJobSourceType;
  source_id: string;
  tipo_dte: number;
  idempotency_key: string;
  status: SiiJobStatus;
  attempts: number;
  last_error: string | null;
  payload: Record<string, unknown>;
  scheduled_at: string;
  completed_at: string | null;
};

export const FISCAL_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

export type FiscalDocumentMimeType = (typeof FISCAL_DOCUMENT_MIME_TYPES)[number];

export type FiscalDocument = {
  id: string;
  empresa_id: string;
  storage_path: string;
  mime_type: FiscalDocumentMimeType;
  sha256: string;
  extracted_text: string | null;
  proveedor_detectado: string | null;
  gasto_extranjero_id: string | null;
  created_at: string;
};