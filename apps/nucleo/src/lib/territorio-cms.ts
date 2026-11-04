import { createClient } from '@supabase/supabase-js';

function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}

export type CensoFase = 'convocatoria' | 'validacion' | 'cerrado_consulta';

export interface TerritorioHeaderContent {
  show_carta: boolean;
  carta_label: string;
  carta_href: string;
  show_mapa: boolean;
  mapa_label: string;
  mapa_href: string;
  show_municipios: boolean;
  municipios_label: string;
  municipios_href: string;
  show_theme_toggle: boolean;
  show_login: boolean;
  login_label: string;
  login_href: string;
  show_signup: boolean;
  signup_label: string;
  signup_href: string;
}

export const DEFAULT_TERRITORIO_HEADER: TerritorioHeaderContent = {
  show_carta: false,
  carta_label: 'Carta Territorial',
  carta_href: '/carta',
  show_mapa: true,
  mapa_label: 'Mapa',
  mapa_href: '/mapa-chiloe',
  show_municipios: false,
  municipios_label: 'Municipios',
  municipios_href: '/municipalidades',
  show_theme_toggle: false,
  show_login: true,
  login_label: 'Entrar',
  login_href: '/login',
  show_signup: true,
  signup_label: 'Inscribirse',
  signup_href: '/login?mode=signup',
};

export interface TerritorioHeroContent {
  eyebrow: string;
  title_line1: string;
  title_line2: string;
  title_italic: string;
  description: string;
  nota_comunitaria: string;
  carta_link_text: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
  badge_info: string;
  login_prompt: string;
  login_link_text: string;
  seo_title?: string;
  seo_description?: string;
  // Gobernanza y fases del censo territorial
  censo_fase?: CensoFase;
  fecha_cierre?: string;
  meta_colmenas?: number;
  aviso_fase?: string;
}

export const DEFAULT_TERRITORIO_HERO: TerritorioHeroContent = {
  eyebrow: 'Censo apícola · Chiloé · 2026–2027',
  title_line1: 'Tu zona de pecoreo',
  title_line2: 'ya tiene defensa.',
  title_italic: 'Falta que esté en el mapa.',
  description:
    'Inscribe tus apiarios sin costo. El mapa visibiliza áreas de pecoreo para defender tu espacio y coordinar distancias, resguardando siempre tu coordenada exacta.',
  nota_comunitaria: 'Iniciativa comunitaria nacida en Queilén para ordenar el territorio. Lee la',
  carta_link_text: 'Carta Territorial (v0.3.2)',
  cta_primary_label: 'Inscribirme sin costo',
  cta_primary_href: '/login?mode=signup',
  cta_secondary_label: 'Abrir mapa completo',
  cta_secondary_href: '/mapa-chiloe',
  badge_info: 'Zonas de ~1 km · sin nombres ni contactos',
  login_prompt: '¿Ya tienes cuenta?',
  login_link_text: 'Entrar',
  seo_title: 'Registro Apícola de Chiloé — Mapa y Defensa Territorial',
  seo_description:
    'Inscribe tus apiarios en el registro territorial de Chiloé. Es gratuito. El mapa publica zonas aproximadas de pecoreo sin revelar tus coordenadas exactas.',
  censo_fase: 'convocatoria',
  fecha_cierre: '2026-10-31',
  meta_colmenas: 500,
  aviso_fase: 'Inscripción abierta y coordinada con comités apícolas comunales de Chiloé.',
};

export interface TerritorioHerramientasContent {
  badge: string;
  title: string;
  description: string;
  tab1_title: string;
  tab1_desc: string;
  tab2_title: string;
  tab2_desc: string;
  tab3_title: string;
  tab3_desc: string;
  feat1_title: string;
  feat1_desc: string;
  feat2_title: string;
  feat2_desc: string;
  feat3_title: string;
  feat3_desc: string;
  cta_title: string;
  cta_description: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
}

export const DEFAULT_TERRITORIO_HERRAMIENTAS: TerritorioHerramientasContent = {
  badge: 'Herramientas gratuitas para el apicultor',
  title: 'Tecnología de precisión y soberanía territorial',
  description:
    'Todo apicultor que inscribe sus apiarios accede a la plataforma de manejo territorial sin costo: visualización espacial de pecoreo, cuaderno de campo y trazabilidad de origen.',
  tab1_title: 'Colección y Apiario Digital',
  tab1_desc:
    'Registra cada cajón con su arquitectura real: cámaras de cría, alzas melarias, estado sanitario y peso estimado. La vista de tu patio se construye desde tus notas de inspección, sin sensores invasivos ni hardware costoso.',
  tab2_title: 'Cuaderno de Campo Digital',
  tab2_desc:
    'Cumple la obligación del cuaderno de manejo sanitario (Res. SAG N° 4.590/2025) sin papeles sueltos que se deterioran en el bosque. Dictado por voz en terreno sin quitarte los guantes, con exportación oficial foliada en PDF.',
  tab3_title: 'Capas Territoriales',
  tab3_desc: 'Defensa comunitaria con radio difuso de pecoreo de ~1 km y alertas sanitarias.',
  feat1_title: 'Capa de distanciamiento legal',
  feat1_desc:
    'Calcula automáticamente los perímetros mínimos fijados por la Ley 21.489 cuando un colmenar trashumante ingresa a tu comuna.',
  feat2_title: 'Alertas fitosanitarias',
  feat2_desc:
    'Canal confidencial con hasta 48 horas de anticipación ante fumigaciones agrícolas vecinas (Res. SAG N° 7.068/2024).',
  feat3_title: 'Asistente declaración SAG octubre',
  feat3_desc:
    'Pre-llena tu declaración anual de existencias con los datos del registro. Cómputo en un clic, sin cálculos manuales de última hora.',
  cta_title: 'Accede a todas las herramientas inscribiéndote gratis',
  cta_description:
    'Cuaderno digital, fichas de colmenas y mapa de pecoreo disponibles desde el primer inicio de sesión.',
  cta_primary_label: 'Inscribirme y usar herramientas',
  cta_primary_href: '/login?mode=signup',
  cta_secondary_label: '',
  cta_secondary_href: '',
};

export interface TerritorioPrivacidadContent {
  badge: string;
  title: string;
  description: string;
  map_link_text: string;
  card1_badge: string;
  card1_title: string;
  card1_desc: string;
  card2_badge: string;
  card2_title: string;
  card2_desc: string;
}

export const DEFAULT_TERRITORIO_PRIVACIDAD: TerritorioPrivacidadContent = {
  badge: 'Privacidad y soberanía de datos',
  title: 'Tu ubicación exacta no se publica.',
  description:
    'El mapa público muestra zonas aproximadas de pecoreo, sin RUT, nombres ni contactos. Tus coordenadas exactas y tus registros de manejo permanecen privados.',
  map_link_text: 'Ver mapa público →',
  card1_badge: 'Mapa público abierto',
  card1_title: 'Zona ~1 km',
  card1_desc:
    'Radio aproximado de pecoreo (~1 km). La visualización cartográfica no asocia identidades, contactos ni coordenadas de precisión.',
  card2_badge: 'Cuaderno de manejo privado',
  card2_title: 'Información de control privado',
  card2_desc:
    'Coordenadas GPS de precisión, bitácora de sanidad, registros fenológicos y documentación técnica para el SAG.',
};

export interface TerritorioBeneficiosContent {
  badge: string;
  title: string;
  item1_number: string;
  item1_title: string;
  item1_description: string;
  item2_number: string;
  item2_title: string;
  item2_description: string;
  item3_number: string;
  item3_title: string;
  item3_description: string;
}

export const DEFAULT_TERRITORIO_BENEFICIOS: TerritorioBeneficiosContent = {
  badge: 'Beneficios del censo',
  title: 'Por qué inscribirse en el registro',
  item1_number: '01',
  item1_title: 'Defender tu zona de pecoreo',
  item1_description:
    'Si alguien se instala cerca sin avisar, puedes enterarte a tiempo. La ley fija distancias; el mapa ayuda a hacerlas valer.',
  item2_number: '02',
  item2_title: 'Que tu miel pueda contarse',
  item2_description:
    'En la época de recolección mielera, el pasaporte QR conecta el frasco con el territorio. Proveniencia viva desde el origen.',
  item3_number: '03',
  item3_title: 'Anticiparte a las fumigaciones',
  item3_description:
    'Canal confidencial para recibir avisos de aplicación de plaguicidas agrícolas con hasta 48 horas de anticipación (Res. SAG N° 7.068/2024). Tiempo real para cerrar piqueras o preparar la trashumancia.',
};

export interface TerritorioPasosContent {
  badge: string;
  title: string;
  description: string;
  step1_number: string;
  step1_title: string;
  step1_description: string;
  step2_number: string;
  step2_title: string;
  step2_description: string;
  step3_number: string;
  step3_title: string;
  step3_description: string;
}

export const DEFAULT_TERRITORIO_PASOS: TerritorioPasosContent = {
  badge: 'Paso a paso',
  title: 'Cómo se hace',
  description:
    'Tres pasos simples. Si prefieres asistencia personalizada, acompañamos el proceso de inscripción presencialmente.',
  step1_number: '1',
  step1_title: 'Creas tu cuenta',
  step1_description:
    'En menos de cinco minutos, sin costo. También puedes inscribirte en una reunión comunitaria, en INDAP, en la feria o directamente en tu apiario con asistencia presencial.',
  step2_number: '2',
  step2_title: 'Declaras tus apiarios',
  step2_description:
    'Tu zona queda representada en el mapa de la red. Las coordenadas exactas permanecen bajo tu control.',
  step3_number: '3',
  step3_title: 'Utilizas lo que necesites',
  step3_description:
    'Alertas sanitarias, asistencia para preparar tu declaración de octubre ante el SAG y el pasaporte digital al momento de vender. El registro formal ante el SAG lo realizas tú.',
};

export interface TerritorioOrigenContent {
  badge: string;
  title: string;
  description: string;
  image_url?: string;
}

export const DEFAULT_TERRITORIO_ORIGEN: TerritorioOrigenContent = {
  badge: 'Identidad territorial',
  title: 'Hecho en Chiloé',
  description:
    'Nació en una apicultura real de Pureo y Queilén, más de veinte años con bosque nativo. La misma herramienta con la que ordenamos apiarios es la que abrimos a toda la isla. La opera Trama SpA. El registro base es y seguirá siendo gratuito para todo apicultor del archipiélago — un bien común, no un servicio.',
  image_url: '/assets/territorio/origen-bosque-chiloe.webp',
};

export interface TerritorioCartaContent {
  badge: string;
  version: string;
  title: string;
  description: string;
  pilar1_value: string;
  pilar1_title: string;
  pilar1_description: string;
  pilar2_badge: string;
  pilar2_title: string;
  pilar2_description: string;
  pilar3_badge: string;
  pilar3_title: string;
  pilar3_description: string;
  cta_title: string;
  cta_description: string;
  cta_label: string;
  cta_href: string;
}

export const DEFAULT_TERRITORIO_CARTA: TerritorioCartaContent = {
  badge: 'Propuesta comunitaria',
  version: 'v0.3.2',
  title: 'La Carta Constitutiva Apícola Territorial',
  description:
    'Una propuesta de acuerdo comunitario nacida desde el trabajo apícola en Queilén y abierta a la deliberación de todo el archipiélago. Define el suelo base de protección, soberanía de datos y convivencia territorial, en estricta consonancia con la Ley N° 21.489 y las resoluciones del SAG.',
  pilar1_value: '$0',
  pilar1_title: 'Suelo Base Gratuito',
  pilar1_description:
    'Registro universal desde 1 colmena, visualización de pecoreo y asistencia para la Declaración Anual de Existencias de Octubre del SAG. 100% libre de costo para siempre.',
  pilar2_badge: 'Ley 19.628 y 21.719',
  pilar2_title: 'Privacidad & Anti-Abigeato',
  pilar2_description:
    'Tus coordenadas GPS exactas están protegidas (Ley 19.628 y 21.719). En el mapa público solo se proyecta un radio difuso de ~1 km para resguardar tu zona de pecoreo sin exponer la ubicación exacta.',
  pilar3_badge: 'Res. SAG N° 7.068 y 7.067',
  pilar3_title: 'Prevención Fitosanitaria',
  pilar3_description:
    'Canal confidencial para recibir avisos de fumigación agrícola con 48h de anticipación (Res. SAG N° 7.068/2024) y ordenar la trashumancia (Res. SAG N° 7.067/2024).',
  cta_title: 'Lee la Carta Constitutiva completa para la asamblea territorial',
  cta_description: 'Documento de trabajo para apicultores residentes, trashumantes, propietarios y municipios.',
  cta_label: 'Leer Carta Territorial',
  cta_href: '/carta',
};

export interface TerritorioCensoContent {
  badge: string;
  title: string;
  description: string;
  cta_primary_label: string;
  cta_primary_href: string;
  cta_secondary_label: string;
  cta_secondary_href: string;
}

export const DEFAULT_TERRITORIO_CENSO: TerritorioCensoContent = {
  badge: 'Inscripción abierta',
  title: 'El censo cierra el 31 de octubre',
  description:
    'Tu zona de pecoreo comienza a existir en el mapa cuando la inscribes. Si lo prefieres, contamos con asistencia presencial para completar el proceso.',
  cta_primary_label: 'Inscribirme sin costo',
  cta_primary_href: '/login?mode=signup',
  cta_secondary_label: 'Ya tengo cuenta',
  cta_secondary_href: '/login',
};

export interface TerritorioInstitucionalContent {
  text: string;
  cta1_label: string;
  cta1_href: string;
  cta2_label: string;
  cta2_href: string;
}

export const DEFAULT_TERRITORIO_INSTITUCIONAL: TerritorioInstitucionalContent = {
  text:
    '¿Representas a un municipio? La Ley 21.489 deja a la comuna mal parada si no tiene mapa local. Esto es un piloto de 90 días — no un recambio del SIPEC.',
  cta1_label: 'Ver propuesta institucional',
  cta1_href: '/municipalidades',
  cta2_label: 'Kit de trabajo municipal',
  cta2_href: '/municipalidades/kit',
};

export interface TerritorioFaqItem {
  pregunta: string;
  respuesta: string;
}

export interface TerritorioFaqSettings {
  badge: string;
  title: string;
  link1_label: string;
  link1_href: string;
  link2_label: string;
  link2_href: string;
}

export const DEFAULT_TERRITORIO_FAQ_SETTINGS: TerritorioFaqSettings = {
  badge: 'Resolución de dudas',
  title: 'Preguntas frecuentes',
  link1_label: '',
  link1_href: '',
  link2_label: 'Carta territorial',
  link2_href: '/carta',
};

export const DEFAULT_TERRITORIO_FAQS: TerritorioFaqItem[] = [
  {
    pregunta: '¿De verdad es gratuito?',
    respuesta:
      'Sí. Registrar tus apiarios, proyectar tu radio de pecoreo y acceder a las herramientas no tiene costo. La red territorial se sostiene como bien común abierto para proteger la apicultura insular.',
  },
  {
    pregunta: '¿Esto reemplaza al SAG o al SIPEC?',
    respuesta:
      'No. El registro formal ante el SAG lo realiza cada apicultor según exige la Ley 21.489. La plataforma asiste preparando los datos de existencias para facilitar tu declaración de octubre y articula la defensa territorial entre vecinos.',
  },
  {
    pregunta: '¿Hace falta un predio de tantas hectáreas?',
    respuesta:
      'No. La ley reconoce apiarios desde 1 colmena. Ya sea que tengas colmenas en tu patio, en un retazo familiar o en comodato, tu presencia apícola cuenta y tiene derecho a resguardo.',
  },
  {
    pregunta: '¿Quién puede ver mis apiarios?',
    respuesta:
      'Nadie ve tus coordenadas exactas. En el mapa público abierto solo se proyecta un círculo difuso de ~1 km de radio que señala la presencia de abejas sin nombre, RUT ni teléfono.',
  },
  {
    pregunta: 'No me manejo con la computadora',
    respuesta:
      'Acompañamos la inscripción presencialmente en terreno, en reuniones comunitarias o en ferias locales. También puedes solicitar apoyo directo de un vecino de la red.',
  },
  {
    pregunta: '¿Y si soy trashumante?',
    respuesta:
      'El mapa te permite declarar asentamientos temporales con fechas estimadas de permanencia para coordinar distancias y recibir alertas tempranas sin conflictos territoriales.',
  },
];

export type TerritorioSectionId =
  | 'territorio_hero'
  | 'territorio_privacidad'
  | 'territorio_beneficios'
  | 'territorio_pasos'
  | 'territorio_herramientas'
  | 'territorio_origen'
  | 'territorio_carta'
  | 'territorio_institucional'
  | 'territorio_faq'
  | 'territorio_censo';

export type TerritorioCustomBlockType =
  | 'alerta'
  | 'testimonio'
  | 'cta'
  | 'video'
  | 'metricas'
  | 'texto';

export interface TerritorioCustomBlockData {
  tipo: TerritorioCustomBlockType;
  titulo: string;
  subtitulo?: string;
  cuerpo?: string;
  badge?: string;
  alerta_nivel?: 'info' | 'alerta' | 'urgente';
  autor_nombre?: string;
  autor_comuna?: string;
  autor_detalle?: string;
  autor_foto_url?: string;
  video_url?: string;
  cta_label?: string;
  cta_href?: string;
  metrica_1_valor?: string;
  metrica_1_etiqueta?: string;
  metrica_2_valor?: string;
  metrica_2_etiqueta?: string;
  metrica_3_valor?: string;
  metrica_3_etiqueta?: string;
}

export interface TerritorioSectionConfig {
  id: string;
  enabled: boolean;
  order: number;
  type?: 'system' | 'custom';
  customData?: TerritorioCustomBlockData;
}

export interface TerritorioLayoutSettings {
  sections: TerritorioSectionConfig[];
}

export const DEFAULT_TERRITORIO_SECTIONS: TerritorioSectionConfig[] = [
  { id: 'territorio_hero', type: 'system', enabled: true, order: 0 },
  { id: 'territorio_privacidad', type: 'system', enabled: true, order: 1 },
  { id: 'territorio_beneficios', type: 'system', enabled: true, order: 2 },
  { id: 'territorio_pasos', type: 'system', enabled: true, order: 3 },
  { id: 'territorio_herramientas', type: 'system', enabled: true, order: 4 },
  { id: 'territorio_origen', type: 'system', enabled: true, order: 5 },
  { id: 'territorio_carta', type: 'system', enabled: true, order: 6 },
  { id: 'territorio_institucional', type: 'system', enabled: true, order: 7 },
  { id: 'territorio_faq', type: 'system', enabled: true, order: 8 },
  { id: 'territorio_censo', type: 'system', enabled: true, order: 9 },
];

export const DEFAULT_TERRITORIO_LAYOUT: TerritorioLayoutSettings = {
  sections: DEFAULT_TERRITORIO_SECTIONS,
};

export const TERRITORIO_SECTION_LABELS: Record<string, string> = {
  territorio_hero: 'Cabecera (Hero)',
  territorio_privacidad: 'Privacidad & Pecoreo',
  territorio_beneficios: 'Por qué Inscribirse',
  territorio_pasos: 'Paso a Paso',
  territorio_herramientas: 'Herramientas Apícolas',
  territorio_origen: 'Origen e Identidad',
  territorio_carta: 'Carta Territorial',
  territorio_institucional: 'Puerta Institucional (Municipios)',
  territorio_faq: 'Preguntas Frecuentes',
  territorio_censo: 'Cierre del Censo',
};

export const TERRITORIO_SECTION_HINTS: Record<string, string> = {
  territorio_hero: 'Titular principal, bajada, llamados a la acción y defensa territorial',
  territorio_privacidad: 'Demostración gráfica de zona difusa (~1 km) vs coordenada exacta protegida',
  territorio_beneficios: 'Defensa de zona de pecoreo, trazabilidad y amparo territorial',
  territorio_pasos: 'Guía clara en tres pasos para la incorporación al registro',
  territorio_herramientas: 'Apiario digital 3D, cuaderno de campo y capas territoriales',
  territorio_origen: 'Fotografía viva del bosque de Chiloé y vínculo territorial',
  territorio_carta: 'Pilares constitutivos de la carta territorial nacida en Queilén',
  territorio_institucional: 'Información y herramientas para municipios y organismos públicos',
  territorio_faq: 'Preguntas frecuentes sobre privacidad, costos y uso del registro',
  territorio_censo: 'Conteo regresivo oficial y llamado final a la inscripción',
};

export function parseTerritorioLayout(raw: unknown): TerritorioLayoutSettings {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_TERRITORIO_LAYOUT;
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.sections)) {
    return DEFAULT_TERRITORIO_LAYOUT;
  }
  const systemIds = new Set<string>(
    DEFAULT_TERRITORIO_SECTIONS.map((s) => s.id),
  );
  const foundSystemIds = new Set<string>();
  const parsedSections: TerritorioSectionConfig[] = [];

  for (const item of obj.sections) {
    if (item && typeof item === 'object') {
      const rawItem = item as Record<string, unknown>;
      const id = String(rawItem.id ?? '');
      if (!id) continue;

      if (systemIds.has(id) && !foundSystemIds.has(id)) {
        foundSystemIds.add(id);
        parsedSections.push({
          id,
          type: 'system',
          enabled: rawItem.enabled !== false,
          order: typeof rawItem.order === 'number'
            ? rawItem.order
            : parsedSections.length,
        });
      } else if (id.startsWith('custom_') || rawItem.type === 'custom') {
        const rawCustom = rawItem.customData;
        const customData: TerritorioCustomBlockData =
          rawCustom && typeof rawCustom === 'object'
            ? (rawCustom as TerritorioCustomBlockData)
            : {
                tipo: 'alerta',
                titulo: 'Bloque Territorial',
                cuerpo: '',
              };

        parsedSections.push({
          id,
          type: 'custom',
          enabled: rawItem.enabled !== false,
          order: typeof rawItem.order === 'number'
            ? rawItem.order
            : parsedSections.length,
          customData,
        });
      }
    }
  }

  // Garantizar que todos los bloques del sistema estén presentes
  for (const def of DEFAULT_TERRITORIO_SECTIONS) {
    if (!foundSystemIds.has(def.id)) {
      parsedSections.push({
        id: def.id,
        type: 'system',
        enabled: def.enabled,
        order: parsedSections.length,
      });
    }
  }

  parsedSections.sort((a, b) => a.order - b.order);

  return {
    sections: parsedSections.map((s, i) => ({ ...s, order: i })),
  };
}

export interface TerritorioCmsData {
  header: TerritorioHeaderContent;
  layout: TerritorioLayoutSettings;
  hero: TerritorioHeroContent;
  herramientas: TerritorioHerramientasContent;
  privacidad: TerritorioPrivacidadContent;
  beneficios: TerritorioBeneficiosContent;
  pasos: TerritorioPasosContent;
  origen: TerritorioOrigenContent;
  carta: TerritorioCartaContent;
  censo: TerritorioCensoContent;
  institucional: TerritorioInstitucionalContent;
  faqSettings: TerritorioFaqSettings;
  faqs: TerritorioFaqItem[];
}

export async function getTerritorioCmsContent(options?: { draft?: boolean }): Promise<TerritorioCmsData> {
  const fallback: TerritorioCmsData = {
    header: DEFAULT_TERRITORIO_HEADER,
    layout: DEFAULT_TERRITORIO_LAYOUT,
    hero: DEFAULT_TERRITORIO_HERO,
    herramientas: DEFAULT_TERRITORIO_HERRAMIENTAS,
    privacidad: DEFAULT_TERRITORIO_PRIVACIDAD,
    beneficios: DEFAULT_TERRITORIO_BENEFICIOS,
    pasos: DEFAULT_TERRITORIO_PASOS,
    origen: DEFAULT_TERRITORIO_ORIGEN,
    carta: DEFAULT_TERRITORIO_CARTA,
    censo: DEFAULT_TERRITORIO_CENSO,
    institucional: DEFAULT_TERRITORIO_INSTITUCIONAL,
    faqSettings: DEFAULT_TERRITORIO_FAQ_SETTINGS,
    faqs: DEFAULT_TERRITORIO_FAQS,
  };

  try {
    const client = getSupabaseServerClient();
    if (!client) {
      return fallback;
    }

    const { data, error } = await client
      .from('site_content')
      .select('section_key, content, draft_content, item_order')
      .in('section_key', [
        'territorio_header',
        'territorio_layout',
        'territorio_hero',
        'territorio_herramientas',
        'territorio_privacidad',
        'territorio_beneficios',
        'territorio_pasos',
        'territorio_origen',
        'territorio_carta',
        'territorio_censo',
        'territorio_institucional',
        'territorio_faq_settings',
        'territorio_faq',
      ])
      .eq('is_active', true)
      .order('item_order', { ascending: true });

    if (error || !data || data.length === 0) {
      return fallback;
    }

    const byKey = new Map<string, { content: unknown; draft_content?: unknown }[]>();
    for (const row of data) {
      const list = byKey.get(row.section_key) ?? [];
      list.push({ content: row.content, draft_content: row.draft_content });
      byKey.set(row.section_key, list);
    }

    const getContent = (item?: { content: unknown; draft_content?: unknown }) => {
      if (!item) return undefined;
      if (options?.draft && item.draft_content != null) {
        return item.draft_content as Record<string, unknown>;
      }
      return item.content as Record<string, unknown>;
    };

    const headerRow = byKey.get('territorio_header')?.[0];
    const layoutRow = byKey.get('territorio_layout')?.[0];
    const heroRow = byKey.get('territorio_hero')?.[0];
    const herramientasRow = byKey.get('territorio_herramientas')?.[0];
    const privacidadRow = byKey.get('territorio_privacidad')?.[0];
    const beneficiosRow = byKey.get('territorio_beneficios')?.[0];
    const pasosRow = byKey.get('territorio_pasos')?.[0];
    const origenRow = byKey.get('territorio_origen')?.[0];
    const cartaRow = byKey.get('territorio_carta')?.[0];
    const censoRow = byKey.get('territorio_censo')?.[0];
    const institucionalRow = byKey.get('territorio_institucional')?.[0];
    const faqSettingsRow = byKey.get('territorio_faq_settings')?.[0];
    const faqRows = byKey.get('territorio_faq');

    const headerContent = getContent(headerRow);
    const heroContent = getContent(heroRow);
    const herramientasContent = getContent(herramientasRow);
    const privacidadContent = getContent(privacidadRow);
    const beneficiosContent = getContent(beneficiosRow);
    const pasosContent = getContent(pasosRow);
    const origenContent = getContent(origenRow);
    const cartaContent = getContent(cartaRow);
    const censoContent = getContent(censoRow);
    const institucionalContent = getContent(institucionalRow);
    const faqSettingsContent = getContent(faqSettingsRow);
    const layoutContent = getContent(layoutRow);

    const faqs: TerritorioFaqItem[] =
      faqRows && faqRows.length > 0
        ? faqRows.map((r) => {
            const c = (getContent(r) ?? {}) as Record<string, unknown>;
            return {
              pregunta: String(c.pregunta ?? ''),
              respuesta: String(c.respuesta ?? ''),
            };
          })
        : DEFAULT_TERRITORIO_FAQS;

    return {
      header: { ...DEFAULT_TERRITORIO_HEADER, ...(headerContent as Partial<TerritorioHeaderContent>) },
      layout: parseTerritorioLayout(layoutContent),
      hero: { ...DEFAULT_TERRITORIO_HERO, ...(heroContent as Partial<TerritorioHeroContent>) },
      herramientas: {
        ...DEFAULT_TERRITORIO_HERRAMIENTAS,
        ...(herramientasContent as Partial<TerritorioHerramientasContent>),
      },
      privacidad: {
        ...DEFAULT_TERRITORIO_PRIVACIDAD,
        ...(privacidadContent as Partial<TerritorioPrivacidadContent>),
      },
      beneficios: {
        ...DEFAULT_TERRITORIO_BENEFICIOS,
        ...(beneficiosContent as Partial<TerritorioBeneficiosContent>),
      },
      pasos: { ...DEFAULT_TERRITORIO_PASOS, ...(pasosContent as Partial<TerritorioPasosContent>) },
      origen: { ...DEFAULT_TERRITORIO_ORIGEN, ...(origenContent as Partial<TerritorioOrigenContent>) },
      carta: { ...DEFAULT_TERRITORIO_CARTA, ...(cartaContent as Partial<TerritorioCartaContent>) },
      censo: { ...DEFAULT_TERRITORIO_CENSO, ...(censoContent as Partial<TerritorioCensoContent>) },
      institucional: {
        ...DEFAULT_TERRITORIO_INSTITUCIONAL,
        ...(institucionalContent as Partial<TerritorioInstitucionalContent>),
      },
      faqSettings: {
        ...DEFAULT_TERRITORIO_FAQ_SETTINGS,
        ...(faqSettingsContent as Partial<TerritorioFaqSettings>),
      },
      faqs,
    };
  } catch {
    return fallback;
  }
}
