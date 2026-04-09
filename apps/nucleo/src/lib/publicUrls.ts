/** URLs públicas del ecosistema (tienda, campo). Configurar en Vercel como VITE_PUBLIC_URL_* */

export function getUrlTienda(): string {
    const v = import.meta.env.VITE_PUBLIC_URL_TIENDA;
    return typeof v === 'string' ? v.trim() : '';
}

export function getUrlCampo(): string {
    const v = import.meta.env.VITE_PUBLIC_URL_CAMPO;
    return typeof v === 'string' ? v.trim() : '';
}
