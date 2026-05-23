export function getUrlTienda(): string {
  const v = process.env.NEXT_PUBLIC_URL_TIENDA;
  return typeof v === 'string' ? v.trim() : '';
}

export function getUrlCampo(): string {
  const v = process.env.NEXT_PUBLIC_URL_CAMPO;
  return typeof v === 'string' ? v.trim() : '';
}
