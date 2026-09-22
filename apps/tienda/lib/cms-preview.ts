/**
 * Puerta del preview de borradores (?cms_preview=...).
 *
 * El preview lee con anon key y draft_content viaja en la respuesta, así que
 * el flag histórico `cms_preview=1` dejaba leer ediciones no publicadas a
 * cualquiera. Ahora se exige un token compartido entre Núcleo y Tienda.
 */

function getPreviewToken(): string {
  return process.env.CMS_PREVIEW_TOKEN?.trim() ?? '';
}

export function isAuthorizedPreviewValue(value: string | null | undefined): boolean {
  if (!value) return false;
  const token = getPreviewToken();
  if (token) return value === token;
  // Sin token configurado: solo desarrollo local acepta el histórico `1`.
  return process.env.NODE_ENV !== 'production' && value === '1';
}
