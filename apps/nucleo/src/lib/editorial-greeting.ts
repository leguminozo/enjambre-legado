'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';

export type DayTimePeriod = 'madrugada' | 'manana' | 'tarde' | 'atardecer' | 'noche';

export interface EditorialQuote {
  quote: string;
  context: string;
  source?: string;
}

export interface SeasonInfo {
  monthIndex: number; // 0-11
  monthName: string;
  seasonName: string;
  floraDestacada: string[];
  fenologiaTip: string;
  quotes: EditorialQuote[];
}

/** Períodos del día adaptados al ritmo de luz y pecoreo del archipiélago */
export function getDayTimePeriod(hour: number): DayTimePeriod {
  if (hour >= 5 && hour < 8) return 'madrugada';
  if (hour >= 8 && hour < 13) return 'manana';
  if (hour >= 13 && hour < 19) return 'tarde';
  if (hour >= 19 && hour < 22) return 'atardecer';
  return 'noche';
}

export function getGreetingByPeriod(period: DayTimePeriod, name?: string): string {
  const cleanName = name ? name.trim().split(/\s+/)[0] : '';
  const suffix = cleanName ? `, ${cleanName}` : '';

  switch (period) {
    case 'madrugada':
      return `¡Buen amanecer${suffix}!`;
    case 'manana':
      return `¡Buenos días${suffix}!`;
    case 'tarde':
      return `¡Buenas tardes${suffix}!`;
    case 'atardecer':
      return `¡Cae la tarde${suffix}!`;
    case 'noche':
      return `¡Buenas noches${suffix}!`;
  }
}

/** Frases poéticas contextuales por momento del día (Luz, Cielo y Ritmo de la Colmena) */
export const DAY_PERIOD_QUOTES: Record<DayTimePeriod, EditorialQuote[]> = {
  madrugada: [
    {
      quote: 'El rocío despierta las copas del bosque valdiviano; el apiario aguarda la primera luz.',
      context: 'Alborada en el archipiélago',
    },
    {
      quote: 'La bruma marina se disipa sobre los canales de Chiloé mientras la colmena despereza sus alas.',
      context: 'Silencio y rocío',
    },
    {
      quote: 'Un rayo de luz despunta sobre el follaje: la naturaleza prepara su secreto para el pecoreo.',
      context: 'Primer aliento del día',
    },
    {
      quote: 'El bosque te espera en quietud antes del primer zumbido.',
      context: 'Amanecer chilote',
    },
  ],
  manana: [
    {
      quote: 'El bosque te espera; un rayo de luz está germinando néctar.',
      context: 'Pecoreo matinal',
    },
    {
      quote: 'Las obreras inician su danza en la piquera y trazan senderos invisibles sobre el dosel nativo.',
      context: 'Vuelo de pecoreo',
    },
    {
      quote: 'Suben las temperaturas y las corolas del monte abren sus reservas más puras.',
      context: 'Apertura floral',
    },
    {
      quote: 'Cada gota de néctar recolectada esta mañana es memoria viva del bosque austral.',
      context: 'Alquimia matutina',
    },
    {
      quote: 'Luz limpia sobre Chiloé: el polen multicolor entra sin descanso a la cámara de cría.',
      context: 'Nutrición del apiario',
    },
  ],
  tarde: [
    {
      quote: 'El calor de la tarde libera los aromas esenciales del bosque milenario.',
      context: 'Cenit del pecoreo',
    },
    {
      quote: 'Pecoreo en plenitud: néctar fresco entrando a raudales por las piqueras soleadas.',
      context: 'Horas de recolección',
    },
    {
      quote: 'El zumbido colectivo late al unísono con el viento que cruza los cerros y fiordos.',
      context: 'Voz del enjambre',
    },
    {
      quote: 'Horas doradas de vuelo: las recolectoras aprovechan la ventana térmica del archipiélago.',
      context: 'Ventana de vuelo',
    },
  ],
  atardecer: [
    {
      quote: 'Al caer la tarde, el retorno a la colmena calma el horizonte del apiario.',
      context: 'Regreso al nido',
    },
    {
      quote: 'Las abejas ventilan el néctar en las alzas; el aroma a cera tibia y propóleo inunda el aire.',
      context: 'Evaporación y miel',
    },
    {
      quote: 'El sol se oculta tras la cordillera de Piuchén tiñendo de oro las copas de los árboles nativos.',
      context: 'Crepúsculo en Chiloé',
    },
    {
      quote: 'Cesan los vuelos y comienza la íntima alquimia nocturna dentro del panal.',
      context: 'Reposo en el patio',
    },
  ],
  noche: [
    {
      quote: 'Las estrellas observan el archipiélago mientras la colmena madura su miel en silencio.',
      context: 'Noche austral',
    },
    {
      quote: 'El racimo mantiene el calor vital en la cámara de cría protegiendo a su reina.',
      context: 'Calor de la colonia',
    },
    {
      quote: 'El bosque descansa bajo la luna de Chiloé; la miel sella los aromas del día.',
      context: 'Quietud nocturna',
    },
    {
      quote: 'En la oscuridad del nido, miles de alas baten en sutil armonía templando el hogar.',
      context: 'Vibración del enjambre',
    },
  ],
};

/** Temporada Anual Completa de 12 Meses en Chiloé (Hemisferio Sur) */
export const CHILOE_SEASONS: SeasonInfo[] = [
  {
    monthIndex: 0,
    monthName: 'Enero',
    seasonName: 'Verano · Gran Mielada',
    floraDestacada: ['Ulmo', 'Tiaca', 'Luma'],
    fenologiaTip: 'Floración cumbre del Ulmo y Tiaca; máximo flujo de néctar en la cordillera de la Costa.',
    quotes: [
      {
        quote: 'Enero en Chiloé: el Ulmo tiñe de blanco los cerros y la gran mielada estival desborda las alzas.',
        context: 'Floración del Ulmo',
      },
      {
        quote: 'Néctar cristalino y espeso entrando a las colmenas bajo el sol de verano.',
        context: 'Apogeo estival',
      },
      {
        quote: 'Días largos de luz y pecoreo vigoroso a lo largo de todo el archipiélago.',
        context: 'Luz de enero',
      },
    ],
  },
  {
    monthIndex: 1,
    monthName: 'Febrero',
    seasonName: 'Verano · Maduración de Recolección',
    floraDestacada: ['Ulmo tardío', 'Arrayán', 'Chilco'],
    fenologiaTip: 'Maduración y sellado de cuadros melarios. Tiempo de catar humedad y preparar la recolección.',
    quotes: [
      {
        quote: 'Febrero en el apiario: las alzas melarias maduran bajo el aire templado y marino de Chiloé.',
        context: 'Maduración de miel',
      },
      {
        quote: 'El bosque entrega su mayor tributo antes del declinar de las últimas flores estivales.',
        context: 'Recolección madura',
      },
      {
        quote: 'Operculado perfecto: la colmena guarda el néctar con precisión milenaria.',
        context: 'Panales sellados',
      },
    ],
  },
  {
    monthIndex: 2,
    monthName: 'Marzo',
    seasonName: 'Otoño · Recolección y Sanidad',
    floraDestacada: ['Flores de otoño', 'Quila', 'Chupalla'],
    fenologiaTip: 'Extracción de miel otoñal, gratitud con el bosque nativo y monitoreo sanitario de Varroa.',
    quotes: [
      {
        quote: 'Marzo: tiempo de recolección otoñal, agradecimiento al bosque nativo y resguardo de la salud del patio.',
        context: 'Recolección y gratitud',
      },
      {
        quote: 'Cierre de la mielada de Ulmo: las abejas concentran sus reservas y reducen postura.',
        context: 'Otoño en el patio',
      },
      {
        quote: 'Monitoreo sanitario y nutrición: cuidar la colmena ahora es garantizar la primavera.',
        context: 'Sanidad apícola',
      },
    ],
  },
  {
    monthIndex: 3,
    monthName: 'Abril',
    seasonName: 'Otoño · Preparación de Invernada',
    floraDestacada: ['Matorral nativo', 'Polen tardío'],
    fenologiaTip: 'Reducción de piqueras contra el frío y chequeo exhaustivo de reservas de miel para el invierno.',
    quotes: [
      {
        quote: 'Abril en el sur: las lluvias otoñales anuncian el repliegue y letargo del archipiélago.',
        context: 'Lluvias otoñales',
      },
      {
        quote: 'Reducción de piqueras y abrigo en las cámaras: el calor se custodia celosamente.',
        context: 'Preparación de invierno',
      },
      {
        quote: 'El bosque se repliega y la colmena se organiza en torno a su reina.',
        context: 'Nido protegido',
      },
    ],
  },
  {
    monthIndex: 4,
    monthName: 'Mayo',
    seasonName: 'Otoño tardío · El Bolo Invernal',
    floraDestacada: ['Lamas y líquenes', 'Reposo vegetal'],
    fenologiaTip: 'Formación del racimo invernal; mantención de techos, pisos y material en taller.',
    quotes: [
      {
        quote: 'Mayo: los temporales del Pacífico llegan a Chiloé; resguardo total en los apiarios.',
        context: 'Temporales del sur',
      },
      {
        quote: 'Formación del racimo invernal: las abejas generan calor vital protegiendo a la reina en el centro.',
        context: 'Bolo invernal',
      },
      {
        quote: 'Tiempo de taller y madera: desinfectar alzas, alambrar marcos y soñar la próxima floración.',
        context: 'Taller del apicultor',
      },
    ],
  },
  {
    monthIndex: 5,
    monthName: 'Junio',
    seasonName: 'Invierno · Solsticio Austral',
    floraDestacada: ['Descanso invernal', 'Musgos del bosque'],
    fenologiaTip: 'El solsticio de invierno marca el día más corto del año y el renacer del ciclo biocultural.',
    quotes: [
      {
        quote: 'Junio: solsticio de invierno; el día más corto abre el nuevo ciclo biocultural en Chiloé.',
        context: 'Solsticio austral',
      },
      {
        quote: 'Silencio y quietud en el apiario: las reservas de miel cuidan a la colonia del frío austral.',
        context: 'Letargo invernal',
      },
      {
        quote: 'Bajo la lluvia chilota, el bosque nativo descansa y regenera su savia.',
        context: 'Regeneración silenciosa',
      },
    ],
  },
  {
    monthIndex: 6,
    monthName: 'Julio',
    seasonName: 'Invierno · Año Fenológico GDD',
    floraDestacada: ['Brote sutil', 'Yemas de invierno'],
    fenologiaTip: 'Inicio de acumulación de Grados Día Desarrollo (GDD) en el hemisferio sur; chequeo de peso de colmenas.',
    quotes: [
      {
        quote: 'Julio: se inicia la cuenta térmica de GDD (Grados Día Desarrollo) en el hemisferio sur.',
        context: 'Origen fenológico GDD',
      },
      {
        quote: 'Mitad del invierno: chequeo de peso y reservas de miel para asegurar la llegada a primavera.',
        context: 'Custodia de reservas',
      },
      {
        quote: 'La tierra húmeda de Chiloé prepara en silencio sus primeros brotes nativos.',
        context: 'Tierra viva',
      },
    ],
  },
  {
    monthIndex: 7,
    monthName: 'Agosto',
    seasonName: 'Fin de Invierno · Primer Despertar',
    floraDestacada: ['Avellano', 'Chupalla temprana', 'Lamas'],
    fenologiaTip: 'Primeros vuelos de limpieza en días soleados; la reina reanuda suavemente la postura de cría.',
    quotes: [
      {
        quote: 'Agosto: las primeras lamas y brotes tempranos anuncian el fin del letargo invernal.',
        context: 'Primer despertar',
      },
      {
        quote: 'Vuelos de limpieza en los días despejados entre chubascos: la colmena siente el cambio de luz.',
        context: 'Vuelo de limpieza',
      },
      {
        quote: 'Estimulación sutil y chequeo de postura: la reina reanuda su ciclo reproductivo.',
        context: 'Reactivación de postura',
      },
    ],
  },
  {
    monthIndex: 8,
    monthName: 'Septiembre',
    seasonName: 'Primavera temprana · Notro y Tiaca',
    floraDestacada: ['Notro', 'Tiaca incipiente', 'Canelo temprano'],
    fenologiaTip: 'Explosión de polen nutricional con los Notros en flor; rápida expansión del nido de cría.',
    quotes: [
      {
        quote: 'Septiembre: florece el Notro de fuego y la Tiaca temprana; explosión de polen en Chiloé.',
        context: 'Floración del Notro',
      },
      {
        quote: 'Entrada de polen fresco multicolor: nutrición esencial para el nacimiento de las nuevas obreras.',
        context: 'Polen primaveral',
      },
      {
        quote: 'Renace la energía en los apiarios a lo largo de islas, fiordos y cordilleras.',
        context: 'Primavera en la red',
      },
    ],
  },
  {
    monthIndex: 9,
    monthName: 'Octubre',
    seasonName: 'Primavera · Canelo y Arrayán',
    floraDestacada: ['Canelo', 'Arrayán', 'Tiaca plena'],
    fenologiaTip: 'Momento de multiplicación de núcleos, recambio de cera y proyección del oráculo de floración.',
    quotes: [
      {
        quote: 'Octubre en Chiloé: Canelo y Arrayán despiertan; tiempo de núcleos y cuadros de cera nueva.',
        context: 'Canelo y Arrayán',
      },
      {
        quote: 'Cámara de cría en expansión vigorosa: chequeo de espacio, ventilación y sanidad.',
        context: 'Multiplicación primaveral',
      },
      {
        quote: 'El oráculo fenológico calcula los grados día acumulados hacia la gran floración.',
        context: 'Cálculo del oráculo',
      },
    ],
  },
  {
    monthIndex: 10,
    monthName: 'Noviembre',
    seasonName: 'Primavera plena · Flor del Tepú',
    floraDestacada: ['Tepú', 'Luma', 'Tineo'],
    fenologiaTip: 'Floración del Tepú en humedales y turberas; vigilancia de enjambrazón y postura de primeras alzas.',
    quotes: [
      {
        quote: 'Noviembre: florece el Tepú en las zonas húmedas; vigilancia atenta del instinto de enjambrazón.',
        context: 'Floración del Tepú',
      },
      {
        quote: 'Colocación de alzas melarias: el bosque nativo inicia su flujo abundante de néctar primaveral.',
        context: 'Alzas de postura',
      },
      {
        quote: 'Vuelos de reconocimiento y trashumancia hacia los mejores manchones florales del archipiélago.',
        context: 'Ruta de pecoreo',
      },
    ],
  },
  {
    monthIndex: 11,
    monthName: 'Diciembre',
    seasonName: 'Verano temprano · La Antesala del Ulmo',
    floraDestacada: ['Botones de Ulmo', 'Tineo', 'Patagua', 'Luma'],
    fenologiaTip: 'Solsticio de verano; días largos de pecoreo ininterrumpido mientras los botones de Ulmo se hinchan.',
    quotes: [
      {
        quote: 'Diciembre: solsticio de verano; días luminosos de vuelo sin descanso sobre el archipiélago.',
        context: 'Solsticio estival',
      },
      {
        quote: 'Los botones de Ulmo se hinchan en la cordillera costera anunciando la mayor mielada del año.',
        context: 'Antesala del Ulmo',
      },
      {
        quote: 'Pecoreo intenso en Luma y Arrayán mientras se afinan las alzas de producción melaria.',
        context: 'Luma y Arrayán',
      },
    ],
  },
];

/** Citas editoriales por subrol territorial */
export const SUBROLE_QUOTES: Record<string, EditorialQuote[]> = {
  api_residente: [
    {
      quote: 'Guardián del apiario fijo: tu vínculo con el bosque cercano custodia la pureza de cada colmena.',
      context: 'Rol · Apicultor Residente',
    },
    {
      quote: 'Observar la fenología del patio es leer el pulso vivo de tu comuna en Chiloé.',
      context: 'Rol · Apicultor Residente',
    },
    {
      quote: 'Colmenas arraigadas: la miel de monte refleja el microclima íntimo de tu rincón insular.',
      context: 'Rol · Apicultor Residente',
    },
  ],
  api_trashumante: [
    {
      quote: 'Rutas de floración: mover colmenas es acompañar el florecer del archipiélago con respeto y resguardo.',
      context: 'Rol · Trashumancia Apícola',
    },
    {
      quote: 'Cada acuerdo de predio y movimiento seguro protege la salud comunitaria de las abejas.',
      context: 'Rol · Trashumancia Apícola',
    },
  ],
  api_mixto: [
    {
      quote: 'Equilibrio territorial: convivir entre el apiario de base y las ventanas de trashumancia costera.',
      context: 'Rol · Apicultor Mixto',
    },
    {
      quote: 'Puente entre valles y fiordos: alternar pasturas nativas enriquece la diversidad floral del enjambre.',
      context: 'Rol · Apicultor Mixto',
    },
    {
      quote: 'Manejo versátil: cuidar las colmenas fijas y acompañar la floración en las islas lejanas.',
      context: 'Rol · Apicultor Mixto',
    },
  ],
  agri_fitosanitario: [
    {
      quote: 'Alianza con el bosque: avisar tus aplicaciones resguarda los apiarios y potencia tus cultivos.',
      context: 'Rol · Alerta Fitosanitaria',
    },
    {
      quote: 'El radio de 3 km protege el pecoreo y construye convivencia en los campos de Chiloé.',
      context: 'Rol · Buenas Prácticas Agrícolas',
    },
  ],
  agri_aplicador: [
    {
      quote: 'Coordinación responsable: emitir alertas tempranas salva vidas de abejas y asegura recolecciones limpias.',
      context: 'Rol · Aplicador Agrícola',
    },
  ],
  prop_facilitador: [
    {
      quote: 'Predio protector: abrir tu campo a colmenas regenera el suelo, las flores y la miel de Chiloé.',
      context: 'Rol · Propietario Facilitador',
    },
    {
      quote: 'Suelo regenerativo: la presencia de la abeja nativa y melífera fecunda la semilla de los bosques antiguos.',
      context: 'Rol · Propietario Facilitador',
    },
    {
      quote: 'Custodios de la flora: mantener corredores biológicos en tus predios sostiene el vuelo comunal.',
      context: 'Rol · Propietario Facilitador',
    },
  ],
  tecnico_inspector: [
    {
      quote: 'Sanidad territorial: monitorear el censo y las alertas fortalece la bioseguridad del archipiélago.',
      context: 'Rol · Técnico e Inspector',
    },
    {
      quote: 'Escudo fitosanitario: cada apiario georreferenciado fortalece la trazabilidad sanitaria de Chiloé.',
      context: 'Rol · Técnico e Inspector',
    },
    {
      quote: 'Vigilancia activa: acompañar al apicultor en terreno garantiza la bioseguridad del archipiélago.',
      context: 'Rol · Técnico e Inspector',
    },
  ],
  institucion_publica: [
    {
      quote: 'Gobernanza biocultural: proteger la abeja y el bosque nativo es asegurar el patrimonio de Chiloé.',
      context: 'Rol · Institución Pública',
    },
    {
      quote: 'Patrimonio biocultural: la apicultura regenerativa es pilar de sustentabilidad para las diez comunas.',
      context: 'Rol · Institución Pública',
    },
  ],
  comercial_acopio: [
    {
      quote: 'Origen y pureza: visibilizar la miel trazable de Chiloé honra el trabajo de cada apicultor.',
      context: 'Rol · Acopio y Comercialización',
    },
    {
      quote: 'Autenticidad botánica: certificar la miel monofloral de bosque valdiviano proyecta Chiloé al mundo.',
      context: 'Rol · Acopio y Comercialización',
    },
  ],
  apicultor: [
    {
      quote: 'El cuaderno de campo y la bitácora registran la memoria viva de tu patio apícola.',
      context: 'Rol · Apicultor de Patio',
    },
    {
      quote: 'Inspección respetuosa: leer los cuadros con calma revela la salud y armonía de la reina.',
      context: 'Rol · Apicultor de Patio',
    },
    {
      quote: 'Pecoreo y cera nueva: el trabajo silencioso de miles de alas transforma el néctar en legado.',
      context: 'Rol · Apicultor de Patio',
    },
  ],
};

export interface EditorialGreetingResult {
  greeting: string;
  quote: EditorialQuote;
  period: DayTimePeriod;
  season: SeasonInfo;
  allSeasonQuotes: EditorialQuote[];
  cycleIndex: number;
  nextQuote: () => void;
}

/** Hook para obtener saludo y frases editoriales que rotan al refrescar o al pulsar avanzar */
export function useEditorialGreeting(opts?: {
  name?: string;
  role?: string | null;
  subrole?: string | null;
  date?: Date;
}): EditorialGreetingResult {
  const date = opts?.date ?? new Date();
  const hour = date.getHours();
  const month = date.getMonth(); // 0-11

  const period = useMemo(() => getDayTimePeriod(hour), [hour]);
  const greeting = useMemo(
    () => getGreetingByPeriod(period, opts?.name),
    [period, opts?.name],
  );
  const season = useMemo(() => CHILOE_SEASONS[month] ?? CHILOE_SEASONS[0], [month]);

  // Lista agregada de frases contextuales para esta fecha/hora/rol
  const quotePool = useMemo(() => {
    const pool: EditorialQuote[] = [];

    // 1. Frases del período horario (Mañana, Tarde, etc.)
    const timeQuotes = DAY_PERIOD_QUOTES[period] ?? [];
    pool.push(...timeQuotes);

    // 2. Frases del mes de Chiloé
    const seasonQuotes = season.quotes ?? [];
    pool.push(...seasonQuotes);

    // 3. Frases de subrol si existe
    const sub = opts?.subrole ?? opts?.role ?? '';
    if (sub && sub in SUBROLE_QUOTES) {
      pool.push(...SUBROLE_QUOTES[sub]!);
    }

    return pool.length > 0
      ? pool
      : [
          {
            quote: 'El bosque te espera; un rayo de luz está germinando néctar.',
            context: 'Chiloé Apícola',
          },
        ];
  }, [period, season, opts?.subrole, opts?.role]);

  // Índice inicial pseudo-aleatorio para renderizado
  const [cycleIndex, setCycleIndex] = useState<number>(() => {
    if (quotePool.length <= 1) return 0;
    return Math.floor(Math.random() * quotePool.length);
  });

  // Al montar o refrescar la página, rota automáticamente usando un historial circular sin repetir
  useEffect(() => {
    if (quotePool.length <= 1) return;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        let seen: number[] = [];
        try {
          const raw = window.sessionStorage.getItem('enj_seen_quote_indices');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) seen = parsed;
          }
        } catch {
          seen = [];
        }

        // Obtener índices que aún no han sido vistos en el ciclo actual
        const available: number[] = [];
        for (let i = 0; i < quotePool.length; i++) {
          if (!seen.includes(i)) available.push(i);
        }

        // Si ya se vieron todos los elementos del pool, reiniciamos el ciclo
        const candidates = available.length > 0 ? available : Array.from({ length: quotePool.length }, (_, i) => i);
        const nextIdx = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;

        const nextSeen = available.length > 0 ? [...seen, nextIdx] : [nextIdx];
        window.sessionStorage.setItem('enj_seen_quote_indices', JSON.stringify(nextSeen));
        setCycleIndex(nextIdx);
      } else {
        setCycleIndex(Math.floor(Math.random() * quotePool.length));
      }
    } catch {
      setCycleIndex(Math.floor(Math.random() * quotePool.length));
    }
  }, [quotePool.length]);

  const nextQuote = useCallback(() => {
    setCycleIndex((prev) => (prev + 1) % quotePool.length);
  }, [quotePool.length]);

  const currentQuote = quotePool[cycleIndex % quotePool.length] ?? quotePool[0]!;

  return {
    greeting,
    quote: currentQuote,
    period,
    season,
    allSeasonQuotes: quotePool,
    cycleIndex,
    nextQuote,
  };
}
