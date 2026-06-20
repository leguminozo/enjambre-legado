import { createHash } from 'crypto';
import pdfParse from 'pdf-parse';
import { detectarProveedor } from '@enjambre/contable';
import {
  FISCAL_DOCUMENT_MIME_TYPES,
  type FiscalDocumentMimeType,
} from './types';

export const MAX_FISCAL_DOCUMENT_BYTES = 10 * 1024 * 1024;

const IMAGE_MIME_TYPES = new Set<FiscalDocumentMimeType>([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

export function computeDocumentSha256(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex');
}

export function isSupportedFiscalMimeType(mime: string): mime is FiscalDocumentMimeType {
  return (FISCAL_DOCUMENT_MIME_TYPES as readonly string[]).includes(mime);
}

export function extensionForMimeType(mime: FiscalDocumentMimeType): string {
  switch (mime) {
    case 'application/pdf':
      return 'pdf';
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/webp':
      return 'webp';
    default:
      return 'bin';
  }
}

export function buildFiscalStoragePath(
  empresaId: string,
  sha256: string,
  mimeType: FiscalDocumentMimeType,
): string {
  const ext = extensionForMimeType(mimeType);
  return `${empresaId}/${sha256}.${ext}`;
}

async function extractTextFromImage(buffer: Buffer): Promise<string | null> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    const { data } = await worker.recognize(buffer);
    const text = data.text?.trim();
    return text && text.length > 0 ? text : null;
  } finally {
    await worker.terminate();
  }
}

export async function extractTextFromDocument(
  mimeType: FiscalDocumentMimeType,
  buffer: Buffer,
): Promise<string | null> {
  if (mimeType === 'application/pdf') {
    const parsed = await pdfParse(buffer);
    const text = parsed.text?.trim();
    return text && text.length > 0 ? text : null;
  }

  if (IMAGE_MIME_TYPES.has(mimeType)) {
    return extractTextFromImage(buffer);
  }

  return null;
}

export function detectProveedorFromText(text: string | null | undefined): string | null {
  if (!text?.trim()) return null;
  return detectarProveedor(text)?.id ?? null;
}