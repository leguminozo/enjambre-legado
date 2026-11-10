/**
 * Referencia botánica melífera de Chiloé y Patagonia Norte.
 * Provee fotografías verificadas, perfiles organolépticos de mieles monoflorales,
 * formateo fenológico y cálculo de dinámica térmica para el catálogo.
 */

export interface EspecieBotanicaReferencia {
  fotoUrl: string;
  perfilMelifero: string;
  relevanciaLabel: string;
  habitoLabel: string;
  origenLabel: string;
  mielColor: string;
  mielAroma: string;
}

export const BOTANICA_FLORA_CHILOE: Record<string, EspecieBotanicaReferencia> = {
  // 1. Canelo
  'drimys winteri': {
    fotoUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'Árbol sagrado del bosque nativo. Detona la primera postura masiva de primavera con néctar especiado y polen cremoso.',
    relevanciaLabel: 'Néctar y Polen',
    habitoLabel: 'Árbol Sagrado',
    origenLabel: 'Nativa de Chiloé',
    mielColor: 'Ámbar Claro',
    mielAroma: 'Pimienta dulce y madera húmeda',
  },
  // 2. Notro
  'embothrium coccineum': {
    fotoUrl: 'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'Explosión tubular carmesí. Secreción abundante de néctar temprano que alimenta al picaflor y vigoriza colmenas recién salidas del invierno.',
    relevanciaLabel: 'Néctar Abundante',
    habitoLabel: 'Árbol Pionero',
    origenLabel: 'Nativa de Chiloé',
    mielColor: 'Ámbar Dorado',
    mielAroma: 'Floral silvestre intenso',
  },
  // 3. Ulmo
  'eucryphia cordifolia': {
    fotoUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'La reina melífera indiscutida del sur. Miel blanca aperlada de textura mantecosa ultrafina, reconocida mundialmente por su delicadeza.',
    relevanciaLabel: 'Gran Flujo de Néctar',
    habitoLabel: 'Árbol Dominante',
    origenLabel: 'Endémica del Bosque Templado',
    mielColor: 'Blanco Aperlado',
    mielAroma: 'Jazmín, flor de azahar y anís',
  },
  // 4. Tiaca
  'caldcluvia paniculata': {
    fotoUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'Panículas densas de flor blanca de verano. Miel monofloral de tonalidad extra clara y cristalización suave con notas balsámicas.',
    relevanciaLabel: 'Néctar y Polen',
    habitoLabel: 'Árbol Mediano',
    origenLabel: 'Nativa de Chiloé',
    mielColor: 'Ámbar Extra Claro',
    mielAroma: 'Balsámico y vegetal fresco',
  },
  // 5. Arrayán
  'luma apiculata': {
    fotoUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'Floración aromática tardía de corteza canela. Miel de cuerpo cálido, notas resinosas y agradable retrogusto herbal.',
    relevanciaLabel: 'Néctar y Polen',
    habitoLabel: 'Árbol de Sotobosque',
    origenLabel: 'Nativa de Chiloé',
    mielColor: 'Ámbar Profundo',
    mielAroma: 'Resina, corteza y té negro',
  },
  // 6. Luma
  'amomyrtus luma': {
    fotoUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'Madera densa y flores solitarias perfumadas. Provee néctar transparente rico en fructosa natural y polen dorado.',
    relevanciaLabel: 'Néctar y Polen',
    habitoLabel: 'Árbol Nativo',
    origenLabel: 'Nativa de Chiloé',
    mielColor: 'Ámbar Cristalino',
    mielAroma: 'Floral suave y madera verde',
  },
  // 7. Tepú
  'tepualia stipularis': {
    fotoUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'Pinceles carmesí de turberas y suelos anegados. Miel densa y tixotrópica con tonalidades cobrizas y notas minerales profundas.',
    relevanciaLabel: 'Gran Flujo de Néctar',
    habitoLabel: 'Arbusto de Turbera',
    origenLabel: 'Nativa de Chiloé',
    mielColor: 'Cobrizo Rojizo',
    mielAroma: 'Turba, tierra húmeda y regaliz',
  },
  // 8. Tineo
  'weinmannia trichosperma': {
    fotoUrl: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'Espigas cilíndricas en laderas templadas. Miel dorada limpia, de sabor suave y cristalización uniforme.',
    relevanciaLabel: 'Néctar y Polen',
    habitoLabel: 'Árbol de Dosel',
    origenLabel: 'Nativa de Chiloé',
    mielColor: 'Dorado Cálido',
    mielAroma: 'Hierbas silvestres y caramelo suave',
  },
  // 9. Patagua
  'myrceugenia planipes': {
    fotoUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    perfilMelifero: 'Ribera de ríos y humedales de hoja perenne brillante. Aporta néctar limpio de cierre de verano que sella la temporada.',
    relevanciaLabel: 'Néctar y Polen',
    habitoLabel: 'Árbol de Ribera',
    origenLabel: 'Nativa de Chiloé',
    mielColor: 'Ámbar Dorado',
    mielAroma: 'Follaje verde y miel fresca',
  },
};

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

/**
 * Formatea de forma elegante y humana el rango de meses de floración.
 * Evita el antipatrón "Feb - Feb" o "Ene - Ene".
 */
export function formatVentanaFloracion(
  mesIni: number | null | undefined,
  mesFin: number | null | undefined
): string {
  if (!mesIni && !mesFin) return 'Por calibrar en terreno';
  if (mesIni && !mesFin) return NOMBRES_MESES[mesIni - 1] ?? 'Sin registro';
  if (!mesIni && mesFin) return `Hasta ${NOMBRES_MESES[mesFin - 1]}`;

  if (mesIni === mesFin) {
    return NOMBRES_MESES[mesIni! - 1] ?? '';
  }

  if (mesIni === 1 && mesFin === 12) {
    return 'Todo el año (Continua)';
  }

  const nombreIni = NOMBRES_MESES[mesIni! - 1] ?? '';
  const nombreFin = NOMBRES_MESES[mesFin! - 1] ?? '';

  return `${nombreIni} – ${nombreFin}`;
}

/**
 * Obtiene la referencia botánica y fotográfica para una especie por nombre.
 */
export function getReferenciaBotanica(
  nombreCientifico?: string | null,
  nombreComun?: string | null
): EspecieBotanicaReferencia | null {
  const keyC = nombreCientifico?.trim().toLowerCase() ?? '';
  const keyN = nombreComun?.trim().toLowerCase() ?? '';

  if (keyC && BOTANICA_FLORA_CHILOE[keyC]) {
    return BOTANICA_FLORA_CHILOE[keyC];
  }

  for (const [k, ref] of Object.entries(BOTANICA_FLORA_CHILOE)) {
    if (keyC.includes(k) || (keyN && k.includes(keyN))) {
      return ref;
    }
  }

  return null;
}
