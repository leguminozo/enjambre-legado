import { describe, it, expect } from 'vitest';
import {
  buildFiscalStoragePath,
  computeDocumentSha256,
  extensionForMimeType,
  isSupportedFiscalMimeType,
} from '../document-ingestion';

describe('document-ingestion', () => {
  it('computeDocumentSha256 is deterministic', () => {
    const buf = Buffer.from('test-pdf-content');
    const a = computeDocumentSha256(buf);
    const b = computeDocumentSha256(buf);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });

  it('buildFiscalStoragePath uses empresa and sha256', () => {
    const path = buildFiscalStoragePath('emp-uuid', 'abc123', 'application/pdf');
    expect(path).toBe('emp-uuid/abc123.pdf');
  });

  it('isSupportedFiscalMimeType accepts PDF', () => {
    expect(isSupportedFiscalMimeType('application/pdf')).toBe(true);
    expect(isSupportedFiscalMimeType('text/plain')).toBe(false);
  });

  it('extensionForMimeType maps mime types', () => {
    expect(extensionForMimeType('image/jpeg')).toBe('jpg');
    expect(extensionForMimeType('image/png')).toBe('png');
  });
});