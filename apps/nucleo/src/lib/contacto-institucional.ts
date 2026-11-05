/**
 * Canal B2G del Registro Territorial Apícola de Chiloé.
 * Operador: Trama SpA (RUT 78.500.141-9), constituida el 26-08-2026 en Queilén.
 *
 * Datos legales del operador: se publican solo en Términos de uso (sección
 * «operador») y en las superficies institucionales no listadas. No van en el
 * footer ni en la landing pública.
 *
 * El correo y WhatsApp son el buzón operativo actual. No son la razón social.
 * La EIRL apícola (marca de miel) es otra persona jurídica: no es el proveedor
 * municipal. Solo se nombra cuando hay que distinguir productos.
 */
export const CONTACTO_INSTITUCIONAL = {
  proveedor: 'Trama SpA',
  razonSocial: 'Trama SpA',
  tipoSociedad: 'Sociedad por Acciones (SpA)',
  rut: '78.500.141-9',
  constituida: '26-08-2026',
  inicioActividadesSii: '06-09-2026',
  categoriaTributaria: 'Primera Categoría (Afecta a IVA)',
  regimenTributario: 'Régimen Pro Pyme Transparente (Art. 14 letra D N° 8 LIR)',
  codigoActividadSii: '620200',
  giroSii: 'Actividades de consultoría de informática y de gestión de instalaciones informáticas',
  glosaDescriptiva: 'Desarrollo de plataformas y análisis de datos territoriales',
  comuna: 'Queilén',
  domicilioLegal: 'Pureo Km 8.560 (Lote D), Comuna de Queilén, Provincia de Chiloé, Región de Los Lagos, Chile',
  representante: 'Gabriel Román Cuevas Miranda',
  rolPublico: 'Coordinador de infraestructura territorial',
  email: 'contacto@obrerayzangano.cl',
  whatsappE164: '56940831358',
  whatsappDisplay: '+56 9 408 31 358',
  chileProveedores: 'en-tramite',
} as const;

/** Línea corta para fichas, pies y TDR. */
export function lineaProveedor(): string {
  return `${CONTACTO_INSTITUCIONAL.proveedor} · RUT ${CONTACTO_INSTITUCIONAL.rut}`;
}

/**
 * Distinción jurídica: solo términos, privacidad u otras superficies
 * donde el operador debe quedar identificado frente a la tienda de miel.
 */
export function notaDistincionProductiva(): string {
  return 'La comercialización de miel corresponde a una actividad productiva distinta, con persona jurídica propia. Trama SpA es el operador de software e infraestructura territorial; no es esa EIRL.';
}

export function whatsappPresentacionUrl(prefill?: string): string {
  const text =
    prefill ??
    'Hola, escribo por el piloto de 90 días del Registro Municipal de Actividad Apícola (Trama SpA). Quisiera agendar una presentación técnica con DIDECO.';
  return `https://wa.me/${CONTACTO_INSTITUCIONAL.whatsappE164}?text=${encodeURIComponent(text)}`;
}

export function mailtoPresentacionUrl(): string {
  const subject = 'Piloto 90 días — Registro comunal apícola';
  const body =
    'Nombre:\nCargo:\nMunicipalidad o servicio:\nComuna:\nTeléfono:\n\nMensaje:';
  return `mailto:${CONTACTO_INSTITUCIONAL.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
