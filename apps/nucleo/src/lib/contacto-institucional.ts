/**
 * Canal B2G real (tienda / privacidad / ops).
 * No placeholders: estos son los datos publicados de La Obrera y el Zángano.
 */
export const CONTACTO_INSTITUCIONAL = {
  proveedor: 'La Obrera y el Zángano',
  email: 'contacto@obrerayzangano.com',
  whatsappE164: '56940831358',
  whatsappDisplay: '+56 9 408 31 358',
} as const;

export function whatsappPresentacionUrl(prefill?: string): string {
  const text =
    prefill ??
    'Hola, escribo por el Registro Municipal de Actividad Apícola de Chiloé. Quisiera agendar una presentación técnica.';
  return `https://wa.me/${CONTACTO_INSTITUCIONAL.whatsappE164}?text=${encodeURIComponent(text)}`;
}

export function mailtoPresentacionUrl(): string {
  const subject = 'Presentación técnica — Registro Municipal Apícola';
  const body =
    'Nombre:\nCargo:\nMunicipalidad o servicio:\nComuna:\nTeléfono:\n\nMensaje:';
  return `mailto:${CONTACTO_INSTITUCIONAL.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
