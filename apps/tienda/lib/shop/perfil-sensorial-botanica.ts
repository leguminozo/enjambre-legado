import type { AnalisisPublico } from '@/lib/shop/analisis-lote';

export interface BotanicalReference {
  slug: string;
  nombreComun: string;
  nombreCientifico: string;
  referenciaLiteratura: string;
  fuenteUrl?: string;
  resumenBotanico: string;
  // 8 Ejes Canónicos: [Madurez Enzimática, Complejidad Botánica, Dulzor, Textura, Tensión Ácida, Densidad Metabólica, Sinergia Cafeínica, Vector Territorial]
  ejes: [number, number, number, number, number, number, number, number];
}

const MONOGRAFIAS_CANONICAS: Record<string, Omit<BotanicalReference, 'slug'>> = {
  ulmo: {
    nombreComun: 'Ulmo',
    nombreCientifico: 'Eucryphia cordifolia (Cav.)',
    referenciaLiteratura: 'Montenegro, G. et al. (2008) · Donoso, C. (2006)',
    fuenteUrl: '/ciencia/ulmo',
    resumenBotanico:
      'Árbol estructurante del dosel valdiviano y de Chiloé. Miel ámbar extra clara con alta actividad enzimática diastásica en crudo y notas de flor blanca y vainilla silvestre.',
    ejes: [9.0, 8.8, 7.2, 8.5, 3.5, 8.8, 7.2, 9.5],
  },
  tiaca: {
    nombreComun: 'Tiaca',
    nombreCientifico: 'Caldcluvia paniculata (Cav.)',
    referenciaLiteratura: 'Montenegro, G. (2008) · Donoso, C. (2006)',
    fuenteUrl: '/ciencia/tiaca',
    resumenBotanico:
      'Especie nodriza de quebradas húmedas y cursos de agua australes. Perfil marcadamente herbáceo y balsámico con acidez cítrica natural y retrogusto mineral.',
    ejes: [7.8, 9.2, 5.6, 6.8, 7.5, 8.2, 8.5, 9.4],
  },
  tepu: {
    nombreComun: 'Tepú',
    nombreCientifico: 'Tepualia stipularis (Griseb.)',
    referenciaLiteratura: 'Villagrán, C. (1991) · SAG Registro Melífero',
    fuenteUrl: '/ciencia/tepu',
    resumenBotanico:
      'Corazón de los tepuales pantanosos y turberas de Chiloé. Miel ámbar rojiza oscura de altísima densidad mineral con notas de turba, bosque húmedo y azúcar morena.',
    ejes: [8.6, 9.5, 6.2, 9.2, 4.2, 9.4, 8.0, 9.8],
  },
  meli: {
    nombreComun: 'Melí',
    nombreCientifico: 'Amomyrtus meli (Legrand et Kausel)',
    referenciaLiteratura: 'Hechenleitner, P. et al. (2005) · UACh',
    fuenteUrl: '/ciencia/meli',
    resumenBotanico:
      'Árbol mirtáceo endémico aromático de Chiloé. Miel dorada con marcado carácter terpénico balsámico, aceites esenciales nobles y especias de bosque.',
    ejes: [8.0, 9.0, 6.5, 7.8, 5.8, 8.6, 8.2, 9.6],
  },
  quillay: {
    nombreComun: 'Quillay',
    nombreCientifico: 'Quillaja saponaria (Molina)',
    referenciaLiteratura: 'Rodríguez, R. et al. (2018) · Codex Alimentarius CXS 12-1981',
    fuenteUrl: '/ciencia/quillay',
    resumenBotanico:
      'Árbol de transición templada y esclerófila. Miel ámbar densa, floral intensa con notas tostadas y sutil amargor noble natural.',
    ejes: [8.2, 8.4, 7.0, 8.2, 4.8, 8.4, 8.0, 8.2],
  },
  avellano: {
    nombreComun: 'Avellano Chileno',
    nombreCientifico: 'Gevuina avellana (Molina)',
    referenciaLiteratura: 'Donoso, C. (2006) · Ensayos Palinológicos INIA / UACh',
    fuenteUrl: '/ciencia/avellano',
    resumenBotanico:
      'Inflorescencias en racimo del bosque siempreverde. Miel amaderada con notas a fruto seco tostado y textura sedosa de rápida cristalización fina.',
    ejes: [8.0, 8.6, 6.8, 8.4, 4.0, 8.5, 8.4, 9.0],
  },
  arrayan_tepa: {
    nombreComun: 'Dosel Siempreverde (Tepa y Arrayán)',
    nombreCientifico: 'Laureliopsis philippiana · Luma apiculata',
    referenciaLiteratura: 'Villagrán, C. (2002) · Universidad Austral de Chile',
    fuenteUrl: '/ciencia/arrayan-tepa',
    resumenBotanico:
      'Asociación de dosel y sotobosque húmedo austral. Resinas balsámicas alcanforadas, notas de bosque profundo y propóleos bioactivos puros.',
    ejes: [8.4, 9.2, 6.0, 7.6, 6.2, 8.8, 8.4, 9.5],
  },
  bosque_nativo: {
    nombreComun: 'Bosque Nativo Templado Lluvioso',
    nombreCientifico: 'Flora Melífera Nativa de Chiloé',
    referenciaLiteratura: 'Análisis Melisopalinológico Multifloral · INIA / SAG',
    fuenteUrl: '/ciencia',
    resumenBotanico:
      'Miel multifloral de bosque lluvioso templado sin intervención agroquímica. Equilibrio armónico de floraciones sucesivas con alta riqueza polínica.',
    ejes: [8.2, 9.0, 6.6, 8.0, 5.0, 8.5, 7.8, 9.2],
  },
};

/**
 * Identifica la especie botánica a partir de los metadatos reales del producto y lote.
 */
export function resolveBotanicalReference(params: {
  productName: string;
  productSlug?: string;
  productTags?: string[];
  origenApicola?: string | null;
  nombreLote?: string | null;
  analisisLote?: AnalisisPublico | null;
}): BotanicalReference | null {
  const { productName, productSlug = '', productTags = [], origenApicola = '', nombreLote = '', analisisLote } = params;

  const haystack = [
    productName,
    productSlug,
    ...productTags,
    origenApicola ?? '',
    nombreLote ?? '',
  ]
    .join(' ')
    .toLowerCase();

  let matchedKey: string | null = null;

  if (haystack.includes('ulmo')) {
    matchedKey = 'ulmo';
  } else if (haystack.includes('tiaca')) {
    matchedKey = 'tiaca';
  } else if (haystack.includes('tepu') || haystack.includes('tepú')) {
    matchedKey = 'tepu';
  } else if (haystack.includes('meli') || haystack.includes('melí')) {
    matchedKey = 'meli';
  } else if (haystack.includes('quillay')) {
    matchedKey = 'quillay';
  } else if (haystack.includes('avellano') || haystack.includes('avellana')) {
    matchedKey = 'avellano';
  } else if (haystack.includes('tepa') || haystack.includes('arrayan') || haystack.includes('arrayán')) {
    matchedKey = 'arrayan_tepa';
  } else if (
    haystack.includes('miel') ||
    haystack.includes('bosque') ||
    haystack.includes('chiloé') ||
    haystack.includes('chiloe') ||
    haystack.includes('pureo')
  ) {
    matchedKey = 'bosque_nativo';
  }

  if (!matchedKey || !MONOGRAFIAS_CANONICAS[matchedKey]) {
    return null;
  }

  const base = MONOGRAFIAS_CANONICAS[matchedKey];
  const ejes = [...base.ejes] as [number, number, number, number, number, number, number, number];

  // Si existe análisis físico-químico formal del lote, se triangulan los ejes reales
  if (analisisLote) {
    if (analisisLote.diastasa != null && Number.isFinite(analisisLote.diastasa)) {
      // Actividad diastásica Codex mínima es 8 DN. >16 DN es madurez enzimática excepcional
      const diastasaNorm = Math.min(10, Math.max(3, Number(((analisisLote.diastasa / 18) * 8.5).toFixed(1))));
      ejes[0] = diastasaNorm;
    }
    if (analisisLote.humedad_pct != null && Number.isFinite(analisisLote.humedad_pct)) {
      // Menor humedad = mayor densidad y textura mantecosa en miel cruda (<18%)
      const texturaNorm = Math.min(10, Math.max(3, Number((((21 - analisisLote.humedad_pct) / 4) * 8.5).toFixed(1))));
      ejes[3] = texturaNorm;
    }
    if (analisisLote.conductividad_ms != null && Number.isFinite(analisisLote.conductividad_ms)) {
      // Conductividad eléctrica refleja riqueza mineral y vector territorial del bosque
      const conductividadNorm = Math.min(10, Math.max(5, Number((analisisLote.conductividad_ms * 9).toFixed(1))));
      ejes[7] = conductividadNorm;
    }
  }

  return {
    slug: matchedKey,
    ...base,
    ejes,
  };
}
