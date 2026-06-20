import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildFiscalStoragePath,
  computeDocumentSha256,
  detectProveedorFromText,
  extractTextFromDocument,
  isSupportedFiscalMimeType,
  MAX_FISCAL_DOCUMENT_BYTES,
} from './document-ingestion';
import type { FiscalDocument } from './types';

export type IngestFiscalDocumentInput = {
  buffer: Buffer;
  mimeType: string;
  fileName?: string;
};

export type IngestFiscalDocumentResult =
  | {
      ok: true;
      document: FiscalDocument;
      alreadyExists: boolean;
      extractedText: string | null;
    }
  | { ok: false; code: string; message: string };

export async function ingestFiscalDocument(
  supabase: SupabaseClient,
  empresaId: string,
  input: IngestFiscalDocumentInput,
): Promise<IngestFiscalDocumentResult> {
  if (!isSupportedFiscalMimeType(input.mimeType)) {
    return {
      ok: false,
      code: 'unsupported_mime',
      message: 'Tipo de archivo no soportado. Usa PDF, PNG, JPG o WebP.',
    };
  }

  if (input.buffer.byteLength > MAX_FISCAL_DOCUMENT_BYTES) {
    return {
      ok: false,
      code: 'file_too_large',
      message: 'El archivo supera el límite de 10 MB.',
    };
  }

  const mimeType = input.mimeType;
  const sha256 = computeDocumentSha256(input.buffer);

  const { data: existing } = await supabase
    .from('fiscal_documents')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('sha256', sha256)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      document: existing as FiscalDocument,
      alreadyExists: true,
      extractedText: existing.extracted_text,
    };
  }

  const storagePath = buildFiscalStoragePath(empresaId, sha256, mimeType);

  const { error: uploadError } = await supabase.storage
    .from('sii-documents')
    .upload(storagePath, input.buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    return {
      ok: false,
      code: 'upload_failed',
      message: uploadError.message,
    };
  }

  let extractedText: string | null = null;
  try {
    extractedText = await extractTextFromDocument(mimeType, input.buffer);
  } catch {
    extractedText = null;
  }

  const proveedorDetectado = detectProveedorFromText(extractedText);

  const { data: inserted, error: insertError } = await supabase
    .from('fiscal_documents')
    .insert({
      empresa_id: empresaId,
      storage_path: storagePath,
      mime_type: mimeType,
      sha256,
      extracted_text: extractedText,
      proveedor_detectado: proveedorDetectado,
    })
    .select('*')
    .single();

  if (insertError || !inserted) {
    await supabase.storage.from('sii-documents').remove([storagePath]);
    return {
      ok: false,
      code: 'document_create_failed',
      message: insertError?.message ?? 'No se pudo registrar el documento',
    };
  }

  return {
    ok: true,
    document: inserted as FiscalDocument,
    alreadyExists: false,
    extractedText,
  };
}

export async function loadFiscalDocumentText(
  supabase: SupabaseClient,
  empresaId: string,
  fiscalDocumentId: string,
): Promise<
  | { ok: true; document: FiscalDocument; text: string }
  | { ok: false; code: string; message: string }
> {
  const { data, error } = await supabase
    .from('fiscal_documents')
    .select('*')
    .eq('id', fiscalDocumentId)
    .eq('empresa_id', empresaId)
    .single();

  if (error || !data) {
    return { ok: false, code: 'document_not_found', message: 'Documento fiscal no encontrado' };
  }

  const document = data as FiscalDocument;
  const text = document.extracted_text?.trim();

  if (!text || text.length < 10) {
    return {
      ok: false,
      code: 'document_text_missing',
      message: 'El documento no tiene texto extraído suficiente para procesar',
    };
  }

  return { ok: true, document, text };
}