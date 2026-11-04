import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  ShieldCheck,
  Leaf,
  Flower2,
  TreePine,
  FileText,
  BookOpen,
  Scale,
  Radar,
  ArrowRight,
  Compass,
  Sparkles,
} from 'lucide-react';
import { getLocale } from 'next-intl/server';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { getSiteContentBatch } from '@/lib/cms';
import { parseCienciaSettings, resolveLocalized, alignToClass, parseBotanicalMonographs } from '@/lib/shop/store-chrome';
import { claimsTrianguladas, DISCLAIMER_LEY_20606, getClaim } from '@enjambre/ciencia';
import {
  IMPACTO_METODOLOGIA_VERSION,
  IMPACTO_TERRITORIO,
  IMPACTO_COEFICIENTES,
  IMPACTO_FUENTES,
  IMPACTO_LIMITES,
  getMetodologiaPublica,
} from '@enjambre/impacto';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.cl';

export const metadata: Metadata = {
  title: 'La ciencia del bosque · La Obrera y el Zángano',
  description:
    'Triangulación botánica sin pesticidas, composición de la miel cruda viva, biblioteca de floraciones nativas y cálculo referencial de regeneración y CO₂.',
  alternates: { canonical: `${SITE_URL}/ciencia` },
  openGraph: {
    title: 'La ciencia del bosque · La Obrera y el Zángano',
    description:
      'Triangulación botánica sin pesticidas, composición de la miel cruda, floraciones nativas y cálculo de regeneración biofísica.',
    url: `${SITE_URL}/ciencia`,
    type: 'article',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La ciencia del bosque · La Obrera y el Zángano',
    description:
      'Triangulación botánica sin pesticidas, composición enzimática de la miel cruda, floraciones nativas y regeneración.',
  },
};

const FLORACIONES_NATIVAS = [
  {
    key: 'ulmo',
    nombre: 'Ulmo',
    nombreCientifico: 'Eucryphia cordifolia',
    temporada: 'Enero a Marzo (Pleno verano austral)',
    tagline: 'La flor reina del bosque valdiviano y chilote.',
    colorBadge: 'border-accent/40 bg-accent/10 text-accent-text',
    cata: ['Floral delicado', 'Notas de vainilla silvestre', 'Cristalización sedosa', 'Cuerpo ligero'],
    perfil:
      'Miel ámbar clara de aroma penetrante y dulce. Concentra una alta densidad de compuestos fenólicos y flavonoides bioactivos con potente actividad antimicrobiana peróxica natural.',
    aporteRegeneracion:
      'Árbol nodriza de hasta 40 metros. Su floración masiva suministra el flujo principal de néctar para la supervivencia estival de polinizadores nativos y colmenas.',
  },
  {
    key: 'tiaca',
    nombre: 'Tiaca',
    nombreCientifico: 'Caldcluvia paniculata',
    temporada: 'Febrero a Abril (Cierre de verano y preludio otoñal)',
    tagline: 'Complejidad balsámica de las quebradas húmedas.',
    colorBadge: 'border-primary/40 bg-primary/10 text-primary',
    cata: ['Herbáceo pronunciado', 'Ámbar medio', 'Cuerpo estructurado', 'Final mineral terroso'],
    perfil:
      'Miel de perfil profundo y balsámico, con una acidez equilibrada característica y un retrogusto largo. Cristalización media y alta persistencia en boca.',
    aporteRegeneracion:
      'Especie pionera clave en la protección de riberas y cuencas hídricas en Chiloé. Su floración tardía garantiza el sustento energético de la colmena previo al reposo invernal.',
  },
  {
    key: 'meli',
    nombre: 'Melí',
    nombreCientifico: 'Amomyrtus meli',
    temporada: 'Diciembre a Enero (Apertura estival)',
    tagline: 'Mirtácea endémica del bosque templado lluvioso y maderas aromáticas.',
    colorBadge: 'border-accent/40 bg-accent/10 text-accent-text',
    cata: ['Balsámico limpio', 'Notas de mirto y menta silvestre', 'Dulzura suave', 'Retrogusto fresco'],
    perfil:
      'Miel de tonalidad dorada y marcada ligereza floral. Su perfil terpénico proviene de los aceites esenciales de la flor del melí en el sotobosque maduro de Chiloé.',
    aporteRegeneracion:
      'Especie del estrato medio que favorece la retención de agua y la continuidad biológica de quebradas y turberas.',
  },
  {
    key: 'tepu',
    nombre: 'Tepú',
    nombreCientifico: 'Tepualia stipularis',
    temporada: 'Enero a Febrero (Verano en turberas)',
    tagline: 'El guardián de los tepuales anegados y suelos fósiles de Chiloé.',
    colorBadge: 'border-primary/40 bg-primary/10 text-primary',
    cata: ['Amaderado mineral', 'Matiz resinoso profundo', 'Ámbar cobrizo', 'Textura untuosa'],
    perfil:
      'Miel densa de color oscuro y retrogusto persistente. Destaca por su alta conductividad eléctrica natural y concentración mineral propia de los ecosistemas húmedos insulares.',
    aporteRegeneracion:
      'Forma masas boscosas densas sobre turba que resguardan los principales reservorios de agua dulce del archipiélago.',
  },
  {
    key: 'quillay',
    nombre: 'Quillay',
    nombreCientifico: 'Quillaja saponaria',
    temporada: 'Octubre a Diciembre (Primavera)',
    tagline: 'Variedad de referencia (bosque esclerófilo / Chile central) — no recolectada en Chiloé.',
    colorBadge: 'border-border bg-surface-sunken text-muted-foreground',
    cata: ['Floral intenso', 'Toques tostados', 'Amargor sutil', 'Aroma vegetal fresco'],
    perfil:
      'Miel ámbar dorada de viscosidad densa. Contiene saponinas y fitoquímicos naturales que confieren propiedades tensoactivas suaves y gran riqueza antioxidante.',
    aporteRegeneracion:
      'Árbol endémico del clima mediterráneo y bosque esclerófilo de Chile central. Se incluye como testigo comparativo de actividad antioxidante frente a las mieles del bosque templado valdiviano.',
  },
  {
    key: 'avellano',
    nombre: 'Avellano Chileno',
    nombreCientifico: 'Gevuina avellana',
    temporada: 'Octubre a Noviembre (Despertar primaveral)',
    tagline: 'Inflorescencias en racimo y nutrición densa.',
    colorBadge: 'border-accent/40 bg-accent/10 text-accent-text',
    cata: ['Amaderado', 'Notas a fruto seco', 'Cuerpo untuoso', 'Final suave'],
    perfil:
      'Miel sutil y escasa, frecuentemente integrada en las primeras mieles multiflorales de la primavera por su limitada ventana de floración.',
    aporteRegeneracion:
      'Aporta polen con un excepcional contenido de proteínas y lípidos esenciales, insustituible para alimentar la cría y fortalecer a la reina tras la invernada.',
  },
  {
    key: 'arrayan_tepa',
    nombre: 'Dosel Siempreverde (Tepa y Arrayán)',
    nombreCientifico: 'Laureliopsis philippiana · Luma apiculata',
    temporada: 'Diciembre a Febrero (Verano templado)',
    tagline: 'Resinas biocidas y arquitectura del bosque profundo.',
    colorBadge: 'border-border bg-surface-sunken text-muted-foreground',
    cata: ['Balsámico alcanforado', 'Especiado', 'Retrogusto fresco', 'Matiz resinoso'],
    perfil:
      'Aportan compuestos volátiles y resinas aromáticas que las abejas transforman en propóleos de pureza insular, esenciales para la desinfección interna de la colmena.',
    aporteRegeneracion:
      'Especies dominantes en el dosel y sotobosque de Chiloé que retienen la humedad ambiental y regulan el microclima térmico necesario para la polinización silvestre.',
  },
];

export default async function CienciaPage({
  searchParams,
}: {
  searchParams?: Promise<{ cms_preview?: string }>;
}) {
  const draft = (await searchParams)?.cms_preview === '1';
  const [m, batch, locale] = await Promise.all([
    getEcosystemMetrics(),
    getSiteContentBatch(['ciencia', 'ciencia_settings', 'origen_monografias'], { draft }),
    getLocale(),
  ]);
  const monographs = parseBotanicalMonographs(batch.origen_monografias?.map((r) => r.content));
  const colorBadges: Record<string, string> = {
    ulmo: 'border-accent/40 bg-accent/10 text-accent-text',
    tiaca: 'border-primary/40 bg-primary/10 text-primary',
    meli: 'border-accent/40 bg-accent/10 text-accent-text',
    tepu: 'border-primary/40 bg-primary/10 text-primary',
    quillay: 'border-success/40 bg-success/10 text-success-text',
    avellano: 'border-accent/40 bg-accent/10 text-accent-text',
    arrayan_tepa: 'border-border bg-surface-sunken text-muted-foreground',
  };
  const floracionesCards = monographs.map((mono) => {
    const f = FLORACIONES_NATIVAS.find((item) => item.key === mono.slug);
    return {
      key: mono.slug,
      nombre: resolveLocalized(mono.common_name, mono.common_name_en, locale) || mono.common_name,
      nombreCientifico: mono.scientific_name,
      temporada: resolveLocalized(mono.flowering_period, mono.flowering_period_en, locale) || f?.temporada || 'Estacional',
      tagline: resolveLocalized(mono.short_description, mono.short_description_en, locale) || f?.tagline || '',
      colorBadge: colorBadges[mono.slug] || f?.colorBadge || 'border-border bg-surface-sunken text-muted-foreground',
      cata: f?.cata ?? ['Flora nativa', 'Miel virgen', 'Origen bosque templado'],
      perfil: resolveLocalized(mono.sensory_profile, mono.sensory_profile_en, locale) || f?.perfil || '',
      aporteRegeneracion: resolveLocalized(mono.ecology, mono.ecology_en, locale) || f?.aporteRegeneracion || '',
    };
  });
  const cienciaSettings = parseCienciaSettings((batch.ciencia_settings?.[0]?.content as Record<string, unknown>) ?? null);
  const heroKicker =
    resolveLocalized(cienciaSettings.kicker, cienciaSettings.kicker_en, locale);
  const heroTitle =
    resolveLocalized(cienciaSettings.title, cienciaSettings.title_en, locale);
  const heroSubtitle =
    resolveLocalized(cienciaSettings.subtitle, cienciaSettings.subtitle_en, locale);

  // Jump Bar
  const jumpBar01 =
    resolveLocalized(cienciaSettings.jump_bar_01, cienciaSettings.jump_bar_01_en, locale) || '01 · Pureza & Ausencia de Pesticidas';
  const jumpBar02 =
    resolveLocalized(cienciaSettings.jump_bar_02, cienciaSettings.jump_bar_02_en, locale) || '02 · Bioquímica & Enzimas Vivas';
  const jumpBar03 =
    resolveLocalized(cienciaSettings.jump_bar_03, cienciaSettings.jump_bar_03_en, locale) || '03 · Biblioteca Botánica NCh2981';
  const jumpBar04 =
    resolveLocalized(cienciaSettings.jump_bar_04, cienciaSettings.jump_bar_04_en, locale) || '04 · Panel Sensorial ST-CATA';
  const jumpBar05 =
    resolveLocalized(cienciaSettings.jump_bar_05, cienciaSettings.jump_bar_05_en, locale) || '05 · Balance Biofísico & Pecoreo';
  const jumpBar06 =
    resolveLocalized(cienciaSettings.jump_bar_06, cienciaSettings.jump_bar_06_en, locale) || '06 · Compliance & Límites';

  // Eje 01 · Triangulación & Pureza
  const triangulacionKicker =
    resolveLocalized(cienciaSettings.triangulacion_kicker, cienciaSettings.triangulacion_kicker_en, locale) || 'EJE 01 · Triangulación & Pureza de Origen';
  const triangulacionTitle =
    resolveLocalized(cienciaSettings.triangulacion_title, cienciaSettings.triangulacion_title_en, locale);
  const triangulacionDesc =
    resolveLocalized(cienciaSettings.triangulacion_desc, cienciaSettings.triangulacion_desc_en, locale);

  const triangulacionC1Badge =
    resolveLocalized(cienciaSettings.triangulacion_c1_badge, cienciaSettings.triangulacion_c1_badge_en, locale) || '0.00 ppm · LOR';
  const triangulacionC1Title =
    resolveLocalized(cienciaSettings.triangulacion_c1_title, cienciaSettings.triangulacion_c1_title_en, locale) || 'Neonicotinoides y Glifosato: No Detectados';
  const triangulacionC1Desc =
    resolveLocalized(cienciaSettings.triangulacion_c1_desc, cienciaSettings.triangulacion_c1_desc_en, locale) ||
    'Los análisis cromatográficos multiresiduo en matrices de miel y polen del bosque templado lluvioso no registran trazas detectables de insecticidas sistémicos (imidacloprid, tiametoxam) ni herbicidas agroindustriales (bajo límite de detección analítica y estándares Codex Alimentarius).';
  const triangulacionC1Footer =
    resolveLocalized(cienciaSettings.triangulacion_c1_footer, cienciaSettings.triangulacion_c1_footer_en, locale) || 'Ensayos cromatográficos GC-MS/MS & LC-MS/MS · Respaldo por lote';

  const triangulacionC2Badge =
    resolveLocalized(cienciaSettings.triangulacion_c2_badge, cienciaSettings.triangulacion_c2_badge_en, locale) || '100% Reserva Nativa';
  const triangulacionC2Title =
    resolveLocalized(cienciaSettings.triangulacion_c2_title, cienciaSettings.triangulacion_c2_title_en, locale) || 'Invernada con Néctar y Polen Silvestre';
  const triangulacionC2Desc =
    resolveLocalized(cienciaSettings.triangulacion_c2_desc, cienciaSettings.triangulacion_c2_desc_en, locale) ||
    'Frente a prácticas de apicultura masiva que reemplazan sistemáticamente la reserva invernal con jarabes de maíz de alta fructosa (HFCS), priorizamos que el enjambre inverne con sus propios marcos de miel y polen de floraciones nativas, protegiendo la vitalidad de la colonia.';
  const triangulacionC2Footer =
    resolveLocalized(cienciaSettings.triangulacion_c2_footer, cienciaSettings.triangulacion_c2_footer_en, locale) || 'Manejo apícola adaptativo sin sustitutos sintéticos';

  const triangulacionC3Badge =
    resolveLocalized(cienciaSettings.triangulacion_c3_badge, cienciaSettings.triangulacion_c3_badge_en, locale) || '≥ 45% NCh2981';
  const triangulacionC3Title =
    resolveLocalized(cienciaSettings.triangulacion_c3_title, cienciaSettings.triangulacion_c3_title_en, locale) || 'Melisopalinología y Botánica';
  const triangulacionC3Desc =
    resolveLocalized(cienciaSettings.triangulacion_c3_desc, cienciaSettings.triangulacion_c3_desc_en, locale) ||
    'La norma chilena NCh2981 define miel monofloral a partir de un mínimo del 45% de polen dominante de una misma especie nativa. El análisis melisopalinológico verifica la identidad botánica del bosque valdiviano de Chiloé frente a mieles de pradera o mezcla comercial.';
  const triangulacionC3Footer =
    resolveLocalized(cienciaSettings.triangulacion_c3_footer, cienciaSettings.triangulacion_c3_footer_en, locale) || 'Melisopalinología NCh2981 · Clasificación polínica microscópica';

  const triangulacionBannerText =
    resolveLocalized(cienciaSettings.triangulacion_banner_text, cienciaSettings.triangulacion_banner_text_en, locale) ||
    'Trazabilidad analítica y ensayos de pureza verificables en el sello y pasaporte digital de cada frasco.';
  const triangulacionBannerCtaLabel =
    resolveLocalized(cienciaSettings.triangulacion_banner_cta_label, cienciaSettings.triangulacion_banner_cta_label_en, locale) || 'Explorar frascos con pasaporte →';
  const triangulacionBannerCtaHref =
    cienciaSettings.triangulacion_banner_cta_href || '/catalogo';

  // Eje 02 · Bioquímica & Enzimas
  const bioquimicaKicker =
    resolveLocalized(cienciaSettings.bioquimica_kicker, cienciaSettings.bioquimica_kicker_en, locale);
  const bioquimicaTitle =
    resolveLocalized(cienciaSettings.bioquimica_title, cienciaSettings.bioquimica_title_en, locale);
  const bioquimicaDesc =
    resolveLocalized(cienciaSettings.bioquimica_desc, cienciaSettings.bioquimica_desc_en, locale);

  const tablaThParametro =
    resolveLocalized(cienciaSettings.tabla_th_parametro, cienciaSettings.tabla_th_parametro_en, locale) || 'Parámetro';
  const tablaThMiel =
    resolveLocalized(cienciaSettings.tabla_th_miel, cienciaSettings.tabla_th_miel_en, locale) || 'Miel cruda';
  const tablaThAzucar =
    resolveLocalized(cienciaSettings.tabla_th_azucar, cienciaSettings.tabla_th_azucar_en, locale) || 'Azúcar refinada';

  const tablaR1Parametro =
    resolveLocalized(cienciaSettings.tabla_r1_parametro, cienciaSettings.tabla_r1_parametro_en, locale) || 'Índice glucémico (referencia)';
  const tablaR1Miel =
    resolveLocalized(cienciaSettings.tabla_r1_miel, cienciaSettings.tabla_r1_miel_en, locale) || '~55';
  const tablaR1Azucar =
    resolveLocalized(cienciaSettings.tabla_r1_azucar, cienciaSettings.tabla_r1_azucar_en, locale) || '65';

  const tablaR2Parametro =
    resolveLocalized(cienciaSettings.tabla_r2_parametro, cienciaSettings.tabla_r2_parametro_en, locale) || 'Enzimas activas';
  const tablaR2Miel =
    resolveLocalized(cienciaSettings.tabla_r2_miel, cienciaSettings.tabla_r2_miel_en, locale) || 'Diastasa, invertasa, GOx';
  const tablaR2Azucar =
    resolveLocalized(cienciaSettings.tabla_r2_azucar, cienciaSettings.tabla_r2_azucar_en, locale) || '0';

  const tablaR3Parametro =
    resolveLocalized(cienciaSettings.tabla_r3_parametro, cienciaSettings.tabla_r3_parametro_en, locale) || 'Acción antibacteriana (contexto)';
  const tablaR3Miel =
    resolveLocalized(cienciaSettings.tabla_r3_miel, cienciaSettings.tabla_r3_miel_en, locale) || 'Asociada a H₂O₂ y bajo Aw';
  const tablaR3Azucar =
    resolveLocalized(cienciaSettings.tabla_r3_azucar, cienciaSettings.tabla_r3_azucar_en, locale) || 'No aplica';

  const protocoloKicker =
    resolveLocalized(cienciaSettings.protocolo_kicker, cienciaSettings.protocolo_kicker_en, locale) || 'Protocolo de Laboratorio y Análisis por Lote';
  const protocoloTitle =
    resolveLocalized(cienciaSettings.protocolo_title, cienciaSettings.protocolo_title_en, locale);
  const protocoloDesc =
    resolveLocalized(cienciaSettings.protocolo_desc, cienciaSettings.protocolo_desc_en, locale);

  const protocoloC1Badge =
    resolveLocalized(cienciaSettings.protocolo_c1_badge, cienciaSettings.protocolo_c1_badge_en, locale) || 'Humedad Máxima <18%';
  const protocoloC1Title =
    resolveLocalized(cienciaSettings.protocolo_c1_title, cienciaSettings.protocolo_c1_title_en, locale) || 'Refractometría Analítica';
  const protocoloC1Desc =
    resolveLocalized(cienciaSettings.protocolo_c1_desc, cienciaSettings.protocolo_c1_desc_en, locale) ||
    'Estabilidad física permanente. Previene fermentaciones en frío sin recurrir a pasteurización térmica.';

  const protocoloC2Badge =
    resolveLocalized(cienciaSettings.protocolo_c2_badge, cienciaSettings.protocolo_c2_badge_en, locale) || 'HMF Codex <40 mg/kg';
  const protocoloC2Title =
    resolveLocalized(cienciaSettings.protocolo_c2_title, cienciaSettings.protocolo_c2_title_en, locale) || 'Control de Temperatura';
  const protocoloC2Desc =
    resolveLocalized(cienciaSettings.protocolo_c2_desc, cienciaSettings.protocolo_c2_desc_en, locale) ||
    'Niveles basales mínimos que certifican la ausencia de calentamiento industrial, protegiendo diastasa, invertasa y bioactividad.';

  const protocoloC3Badge =
    resolveLocalized(cienciaSettings.protocolo_c3_badge, cienciaSettings.protocolo_c3_badge_en, locale) || 'Norma NCh2981';
  const protocoloC3Title =
    resolveLocalized(cienciaSettings.protocolo_c3_title, cienciaSettings.protocolo_c3_title_en, locale) || 'Melisopalinología Certificada';
  const protocoloC3Desc =
    resolveLocalized(cienciaSettings.protocolo_c3_desc, cienciaSettings.protocolo_c3_desc_en, locale) ||
    'Identificación microscópica de polen de ulmo, tiaca y especies acompañantes, garantizando el origen biogeográfico de Chiloé.';

  const evidenciaSectionTitle =
    resolveLocalized(cienciaSettings.evidencia_section_title, cienciaSettings.evidencia_section_title_en, locale) || 'Evidencia y Ensayos Registrados';

  // Eje 03 · Floraciones Nativas & Polinización
  const bibliotecaKicker =
    resolveLocalized(cienciaSettings.biblioteca_kicker, cienciaSettings.biblioteca_kicker_en, locale);
  const bibliotecaTitle =
    resolveLocalized(cienciaSettings.biblioteca_title, cienciaSettings.biblioteca_title_en, locale);
  const bibliotecaDesc =
    resolveLocalized(cienciaSettings.biblioteca_desc, cienciaSettings.biblioteca_desc_en, locale);

  const bibliotecaCtaLabel =
    resolveLocalized(cienciaSettings.biblioteca_cta_label, cienciaSettings.biblioteca_cta_label_en, locale) || 'Ver biblioteca completa';
  const bibliotecaCtaHref =
    cienciaSettings.biblioteca_cta_href || '/origen';

  const bibliotecaP1Title =
    resolveLocalized(cienciaSettings.biblioteca_p1_title, cienciaSettings.biblioteca_p1_title_en, locale) || '01 · Melisopalinología NCh2981';
  const bibliotecaP1Desc =
    resolveLocalized(cienciaSettings.biblioteca_p1_desc, cienciaSettings.biblioteca_p1_desc_en, locale) ||
    'Conteo microscópico de granos de polen para certificar ≥45% de dominancia floral exclusiva frente a mezclas comerciales.';

  const bibliotecaP2Title =
    resolveLocalized(cienciaSettings.biblioteca_p2_title, cienciaSettings.biblioteca_p2_title_en, locale) || '02 · Fenología & Grados Día';
  const bibliotecaP2Desc =
    resolveLocalized(cienciaSettings.biblioteca_p2_desc, cienciaSettings.biblioteca_p2_desc_en, locale) ||
    'Modelación térmica territorial que predice las ventanas breves de floración en el bosque lluvioso de Chiloé.';

  const bibliotecaP3Title =
    resolveLocalized(cienciaSettings.biblioteca_p3_title, cienciaSettings.biblioteca_p3_title_en, locale) || '03 · Bioactividad No Peróxica';
  const bibliotecaP3Desc =
    resolveLocalized(cienciaSettings.biblioteca_p3_desc, cienciaSettings.biblioteca_p3_desc_en, locale) ||
    'Identificación de flavonoides y terpenos de especies endémicas que conservan su capacidad antioxidante intacta.';

  const cardFichaLabel =
    resolveLocalized(cienciaSettings.card_ficha_label, cienciaSettings.card_ficha_label_en, locale) || 'Ficha Botánica';
  const cardLabLabel =
    resolveLocalized(cienciaSettings.card_lab_label, cienciaSettings.card_lab_label_en, locale) || 'Catas & Lab';

  // Eje 04 · Ciencia Sensorial & Evaluación Objetiva (ST-CATA) + Estación
  const sensorialKicker =
    resolveLocalized(cienciaSettings.sensorial_kicker, cienciaSettings.sensorial_kicker_en, locale) || 'EJE 04 · Ciencia Sensorial & Evaluación Objetiva';
  const sensorialTitle =
    resolveLocalized(cienciaSettings.sensorial_title, cienciaSettings.sensorial_title_en, locale) || 'Protocolo de Panel Sensorial Distribuido (ST-CATA)';
  const sensorialDesc =
    resolveLocalized(cienciaSettings.sensorial_desc, cienciaSettings.sensorial_desc_en, locale) ||
    'De la degustación empírica al perfil sensorial validado. Nuestra plataforma no publica promedios subjetivos de marketing: opera el protocolo científico ST-CATA (Check-All-That-Apply semi-entrenado) para caracterizar la miel cruda de bosque nativo con rigor estadístico y reproducibilidad.';

  const sensorialC1Title =
    resolveLocalized(cienciaSettings.sensorial_c1_title, cienciaSettings.sensorial_c1_title_en, locale) || '01 · Instrumento 60s';
  const sensorialC1Desc =
    resolveLocalized(cienciaSettings.sensorial_c1_desc, cienciaSettings.sensorial_c1_desc_en, locale) ||
    'Evaluación de 3 pares semánticos bipolares y chips organolépticos con orden contrabalanceado aleatorio para eliminar sesgos de posición.';

  const sensorialC2Title =
    resolveLocalized(cienciaSettings.sensorial_c2_title, cienciaSettings.sensorial_c2_title_en, locale) || '02 · Dos Cohortes';
  const sensorialC2Desc =
    resolveLocalized(cienciaSettings.sensorial_c2_desc, cienciaSettings.sensorial_c2_desc_en, locale) ||
    'Separación estricta entre consumidores espontáneos en mesa y la red semi-entrenada de baristas calibrados con referentes aromáticos físicos.';

  const sensorialC3Title =
    resolveLocalized(cienciaSettings.sensorial_c3_title, cienciaSettings.sensorial_c3_title_en, locale) || '03 · Umbral N ≥ 30';
  const sensorialC3Desc =
    resolveLocalized(cienciaSettings.sensorial_c3_desc, cienciaSettings.sensorial_c3_desc_en, locale) ||
    'Regla de oro: ningún perfil de floración o lote se publica con menos de 30 sesiones completadas. Bajo ese umbral, la plataforma declara «perfil en construcción».';

  const estacionKicker =
    resolveLocalized(cienciaSettings.estacion_kicker, cienciaSettings.estacion_kicker_en, locale);
  const estacionTitle =
    resolveLocalized(cienciaSettings.estacion_title, cienciaSettings.estacion_title_en, locale);
  const estacionDesc =
    resolveLocalized(cienciaSettings.estacion_desc, cienciaSettings.estacion_desc_en, locale);
  const estacionCtaLabel =
    resolveLocalized(cienciaSettings.estacion_cta_label, cienciaSettings.estacion_cta_label_en, locale);
  const estacionCtaHref =
    cienciaSettings.estacion_cta_href || '/experiencias/degustaciones#estacion-origen';
  const estacionSecondaryCtaLabel =
    resolveLocalized(cienciaSettings.estacion_secondary_cta_label, cienciaSettings.estacion_secondary_cta_label_en, locale) || 'Ver todas las modalidades';
  const estacionSecondaryCtaHref =
    cienciaSettings.estacion_secondary_cta_href || '/experiencias/degustaciones';

  // Eje 05 · Balance Territorial & Pecoreo
  const metodologiaKicker =
    resolveLocalized(cienciaSettings.metodologia_kicker, cienciaSettings.metodologia_kicker_en, locale);
  const metodologiaTitle =
    resolveLocalized(cienciaSettings.metodologia_title, cienciaSettings.metodologia_title_en, locale);
  const metodologiaDesc =
    resolveLocalized(cienciaSettings.metodologia_desc, cienciaSettings.metodologia_desc_en, locale);

  const pecoreoKicker =
    resolveLocalized(cienciaSettings.pecoreo_kicker, cienciaSettings.pecoreo_kicker_en, locale);
  const pecoreoTitle =
    resolveLocalized(cienciaSettings.pecoreo_title, cienciaSettings.pecoreo_title_en, locale);
  const pecoreoDesc =
    resolveLocalized(cienciaSettings.pecoreo_desc, cienciaSettings.pecoreo_desc_en, locale);

  const pecoreoC1Title =
    resolveLocalized(cienciaSettings.pecoreo_c1_title, cienciaSettings.pecoreo_c1_title_en, locale) || 'Néctar y Concentración';
  const pecoreoC1Formula =
    cienciaSettings.pecoreo_c1_formula || 'M_néctar = kg × (0.82 / 0.30)';
  const pecoreoC1Desc =
    resolveLocalized(cienciaSettings.pecoreo_c1_desc, cienciaSettings.pecoreo_c1_desc_en, locale) ||
    'Considera 82% de azúcares en miel madura frente al 30% de sólidos solubles en néctar de flora nativa.';

  const pecoreoC2Title =
    resolveLocalized(cienciaSettings.pecoreo_c2_title, cienciaSettings.pecoreo_c2_title_en, locale) || 'Superficie Vital Protegida';
  const pecoreoC2Formula =
    cienciaSettings.pecoreo_c2_formula || 'Área = (kg / 20) × 5.000 m²';
  const pecoreoC2Desc =
    resolveLocalized(cienciaSettings.pecoreo_c2_desc, cienciaSettings.pecoreo_c2_desc_en, locale) ||
    'Basado en un rendimiento conservador de 20 kg/colmena y 0,5 ha de bosque maduro asignado como radio vital.';

  const pecoreoC3Title =
    resolveLocalized(cienciaSettings.pecoreo_c3_title, cienciaSettings.pecoreo_c3_title_en, locale) || 'Vuelo y Fecundación';
  const pecoreoC3Formula =
    cienciaSettings.pecoreo_c3_formula || 'Flores = M_néctar / 1.2 mg';
  const pecoreoC3Desc =
    resolveLocalized(cienciaSettings.pecoreo_c3_desc, cienciaSettings.pecoreo_c3_desc_en, locale) ||
    'Secreción media de 1,2 mg néctar/flor y tasa de polinización cruzada (+40% semillas viables al banco de suelo).';

  const equivalenciaC1Title =
    resolveLocalized(cienciaSettings.equivalencia_c1_title, cienciaSettings.equivalencia_c1_title_en, locale) || 'Frasco 500 g';
  const equivalenciaC1Value =
    resolveLocalized(cienciaSettings.equivalencia_c1_value, cienciaSettings.equivalencia_c1_value_en, locale) || `~${IMPACTO_COEFICIENTES.co2_evitado_kg_por_frasco_500g} kg CO₂e`;
  const equivalenciaC1Desc =
    resolveLocalized(cienciaSettings.equivalencia_c1_desc, cienciaSettings.equivalencia_c1_desc_en, locale) ||
    'Estimación de emisiones evitadas por sustitución de azúcar refinada industrial. No constituye certificado de absorción forestal individual.';

  const equivalenciaC2Title =
    resolveLocalized(cienciaSettings.equivalencia_c2_title, cienciaSettings.equivalencia_c2_title_en, locale) || '1 Kilogramo Miel';
  const equivalenciaC2Value =
    resolveLocalized(cienciaSettings.equivalencia_c2_value, cienciaSettings.equivalencia_c2_value_en, locale) || `~${IMPACTO_COEFICIENTES.co2_evitado_kg_por_kg_miel} kg CO₂e`;
  const equivalenciaC2Desc =
    resolveLocalized(cienciaSettings.equivalencia_c2_desc, cienciaSettings.equivalencia_c2_desc_en, locale) ||
    'Coeficiente de orden de magnitud por sustitución alimentaria de miel cruda sin procesamiento térmico ni aditivos.';

  const equivalenciaC3Title =
    resolveLocalized(cienciaSettings.equivalencia_c3_title, cienciaSettings.equivalencia_c3_title_en, locale) || 'Factor por Árbol Nativo';
  const equivalenciaC3Value =
    resolveLocalized(cienciaSettings.equivalencia_c3_value, cienciaSettings.equivalencia_c3_value_en, locale) || `~${IMPACTO_COEFICIENTES.co2_ton_por_arbol} t CO₂e`;
  const equivalenciaC3Desc =
    resolveLocalized(cienciaSettings.equivalencia_c3_desc, cienciaSettings.equivalencia_c3_desc_en, locale) ||
    'Secuestro referencial estimado en biomasa leñosa para especies nativas en crecimiento activo en el Predio Pureo.';

  const ecosistemaTitle =
    resolveLocalized(cienciaSettings.ecosistema_title, cienciaSettings.ecosistema_title_en, locale) || 'Estado del Ecosistema en Vivo';
  const ecosistemaTerritorio =
    resolveLocalized(cienciaSettings.ecosistema_territorio, cienciaSettings.ecosistema_territorio_en, locale) || `Territorio: ${IMPACTO_TERRITORIO}`;
  const ecosistemaVersionBadge =
    cienciaSettings.ecosistema_version_badge || `v${IMPACTO_METODOLOGIA_VERSION}`;
  const ecosistemaM1Label =
    resolveLocalized(cienciaSettings.ecosistema_m1_label, cienciaSettings.ecosistema_m1_label_en, locale) || 'Árboles censados en el predio';
  const ecosistemaM2Label =
    resolveLocalized(cienciaSettings.ecosistema_m2_label, cienciaSettings.ecosistema_m2_label_en, locale) || 'CO₂ capturado estimado';
  const ecosistemaM3Label =
    resolveLocalized(cienciaSettings.ecosistema_m3_label, cienciaSettings.ecosistema_m3_label_en, locale) || 'CO₂ emitido logística + producción';
  const ecosistemaM4Label =
    resolveLocalized(cienciaSettings.ecosistema_m4_label, cienciaSettings.ecosistema_m4_label_en, locale) || 'Índice de Regeneración (IRR)';
  const ecosistemaDisclaimer =
    resolveLocalized(cienciaSettings.ecosistema_disclaimer, cienciaSettings.ecosistema_disclaimer_en, locale) ||
    'Rigor ético y metodológico: la modelación biofísica de absorción en biomasa e IRR requiere el censo georreferenciado árbol a árbol del Predio Pureo (temporada 2026–2027 en ejecución). Por honestidad radical, no publicamos indicadores concluidos mientras el conteo empírico territorial permanezca en calibración.';

  const metodo = getMetodologiaPublica();
  const formulasTitle =
    resolveLocalized(cienciaSettings.formulas_title, cienciaSettings.formulas_title_en, locale) || 'Fórmulas Matemáticas Abiertas';
  const formulasC1Label =
    resolveLocalized(cienciaSettings.formulas_c1_label, cienciaSettings.formulas_c1_label_en, locale) || 'Secuestro por árbol nativo:';
  const formulasC1Text =
    cienciaSettings.formulas_c1_text || metodo.formulas.co2_ton_plantacion;
  const formulasC2Label =
    resolveLocalized(cienciaSettings.formulas_c2_label, cienciaSettings.formulas_c2_label_en, locale) || 'Índice de Regeneración Relativa (IRR):';
  const formulasC2Text =
    cienciaSettings.formulas_c2_text || metodo.formulas.irr_simplificado;
  const formulasC3Label =
    resolveLocalized(cienciaSettings.formulas_c3_label, cienciaSettings.formulas_c3_label_en, locale) || 'Emisiones evitadas por frasco 500 g:';
  const formulasC3Text =
    cienciaSettings.formulas_c3_text || metodo.formulas.co2_frasco_500g;
  const fuentesTitle =
    resolveLocalized(cienciaSettings.fuentes_title, cienciaSettings.fuentes_title_en, locale) || 'Fuentes Bibliográficas de Respaldo';

  const horizonteTitle =
    resolveLocalized(cienciaSettings.horizonte_title, cienciaSettings.horizonte_title_en, locale);
  const horizonteText =
    resolveLocalized(cienciaSettings.horizonte_text, cienciaSettings.horizonte_text_en, locale);

  // Eje 06 · Respaldo Académico & Límites
  const respaldoKicker =
    resolveLocalized(cienciaSettings.respaldo_kicker, cienciaSettings.respaldo_kicker_en, locale) || 'EJE 06 · Compliance & Límites';
  const respaldoTitle =
    resolveLocalized(cienciaSettings.respaldo_title, cienciaSettings.respaldo_title_en, locale) || 'Límites Metodológicos & Responsabilidad Regulatoria';
  const respaldoExtraNotas =
    resolveLocalized(cienciaSettings.respaldo_extra_notas, cienciaSettings.respaldo_extra_notas_en, locale);
  const respaldoDisclaimerMinsal =
    resolveLocalized(cienciaSettings.respaldo_disclaimer_minsal, cienciaSettings.respaldo_disclaimer_minsal_en, locale) || DISCLAIMER_LEY_20606;

  const cmsCienciaItems = (batch.ciencia ?? [])
    .map((row) => row.content as {
      categoria?: string;
      categoria_en?: string;
      titulo?: string;
      titulo_en?: string;
      texto?: string;
      texto_en?: string;
      fuente?: string;
    })
    .filter((item) => Boolean(item?.titulo && item?.texto))
    .map((item) => ({
      categoria: resolveLocalized(item.categoria, item.categoria_en, locale),
      titulo: resolveLocalized(item.titulo, item.titulo_en, locale),
      texto: resolveLocalized(item.texto, item.texto_en, locale),
      fuente: item.fuente,
    }));

  // Coeficientes y límites desde la metodología publicada (paquete compartido).
  const ig = getClaim('ig_referencia');
  const enzimas = getClaim('composicion_enzimas');
  const h2o2 = getClaim('h2o2_antimicrobiana');
  const hmf = getClaim('hmf_limite_codex');
  const perfil = getClaim('perfil_organoleptico');

  // IRR sin números mágicos: solo se muestra cuando el dato de emisión existe.
  const co2CapturadoAnual = m.co2_capturado_kg > 0 ? m.co2_capturado_kg : null;
  const co2EmitidoAnual = m.co2_emitido_kg > 0 ? m.co2_emitido_kg : null;
  const irrCalculado =
    co2CapturadoAnual != null && co2EmitidoAnual != null && co2EmitidoAnual > 0
      ? Number((co2CapturadoAnual / co2EmitidoAnual).toFixed(2))
      : (m.irr_ecosistema ?? null);

  return (
    <StoreShell>
      <ShopHeader />
      <main
        data-cms-section="ciencia"
        className="min-h-[var(--vh-full)] bg-background"
      >
        {/* ── Hero ── */}
        <section
          data-cms-section="ciencia_settings"
          className="relative overflow-hidden border-b border-border/20 px-4 text-center pt-[max(7rem,calc(env(safe-area-inset-top)+5.5rem))] pb-16 md:py-24"
        >
          {cienciaSettings.hero_image ? (
            <div className="absolute inset-0">
              <Image
                src={cienciaSettings.hero_image}
                alt="Atmósfera de investigación y bosque austral"
                fill
                sizes="100vw"
                priority
                className="object-cover"
                style={{ opacity: (cienciaSettings.hero_image_opacity ?? 25) / 100 }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/60" />
            </div>
          ) : null}
          <div className="relative max-w-5xl xl:max-w-6xl mx-auto">
            {heroKicker ? (
              <span className="block text-[0.65rem] tracking-[0.5em] uppercase text-accent-text mb-6">
                {heroKicker}
              </span>
            ) : null}
            {heroTitle ? (
              <h1 className="font-display text-[clamp(2.25rem,6.5vw,4.75rem)] md:text-6xl lg:text-7xl font-light text-foreground mb-6 text-balance max-w-4xl lg:max-w-5xl mx-auto leading-[1.08]">
                {heroTitle}
              </h1>
            ) : null}
            {heroSubtitle ? (
              <p className={`text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl lg:max-w-4xl mx-auto text-pretty whitespace-pre-line ${alignToClass(cienciaSettings.text_align)}`}>
                {heroSubtitle}
              </p>
            ) : null}

            {/* Jump Bar: Índice Ejecutivo de Navegación Científica */}
            <nav
              aria-label="Ejes de investigación científica"
              className="mt-10 flex flex-wrap items-center justify-center gap-2 pt-2"
            >
              <a
                href="#triangulacion"
                className="px-3.5 py-1.5 rounded-full border border-border/60 bg-surface-raised/70 hover:border-accent/60 hover:text-accent-text text-xs text-muted-foreground transition-colors font-mono"
              >
                {jumpBar01}
              </a>
              <a
                href="#bioquimica"
                className="px-3.5 py-1.5 rounded-full border border-border/60 bg-surface-raised/70 hover:border-accent/60 hover:text-accent-text text-xs text-muted-foreground transition-colors font-mono"
              >
                {jumpBar02}
              </a>
              <a
                href="#biblioteca"
                className="px-3.5 py-1.5 rounded-full border border-accent/40 bg-accent/10 text-accent-text hover:bg-accent/20 text-xs transition-colors font-mono font-medium"
              >
                {jumpBar03}
              </a>
              <a
                href="#sensorial"
                className="px-3.5 py-1.5 rounded-full border border-border/60 bg-surface-raised/70 hover:border-accent/60 hover:text-accent-text text-xs text-muted-foreground transition-colors font-mono"
              >
                {jumpBar04}
              </a>
              <a
                href="#biofisica"
                className="px-3.5 py-1.5 rounded-full border border-border/60 bg-surface-raised/70 hover:border-accent/60 hover:text-accent-text text-xs text-muted-foreground transition-colors font-mono"
              >
                {jumpBar05}
              </a>
              <a
                href="#respaldo"
                className="px-3.5 py-1.5 rounded-full border border-border/60 bg-surface-raised/70 hover:border-accent/60 hover:text-accent-text text-xs text-muted-foreground transition-colors font-mono"
              >
                {jumpBar06}
              </a>
            </nav>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-24 space-y-24 pt-8">
          {/* ── EJE 01: Triangulación botánica y límites de detección ── */}
          <section id="triangulacion" className="border-t border-border/40 pt-12 scroll-mt-36">
            <div className="mb-10">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                {triangulacionKicker || 'EJE 01 · Triangulación & Pureza de Origen'}
              </span>
              {triangulacionTitle ? (
                <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] font-light text-foreground">
                  {triangulacionTitle}
                </h2>
              ) : null}
              {triangulacionDesc ? (
                <p className={`mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left whitespace-pre-line ${alignToClass(cienciaSettings.text_align)}`}>
                  {triangulacionDesc}
                </p>
              ) : null}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent-text">
                      <ShieldCheck size={20} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent-text border border-accent/20">
                      {triangulacionC1Badge}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    {triangulacionC1Title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-left whitespace-pre-line">
                    {triangulacionC1Desc}
                  </p>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-6 pt-3 border-t border-border/40">
                  {triangulacionC1Footer}
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <Leaf size={20} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {triangulacionC2Badge}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    {triangulacionC2Title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-left whitespace-pre-line">
                    {triangulacionC2Desc}
                  </p>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-6 pt-3 border-t border-border/40">
                  {triangulacionC2Footer}
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent-text">
                      <BookOpen size={20} />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent/10 text-accent-text border border-accent/20">
                      {triangulacionC3Badge}
                    </span>
                  </div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    {triangulacionC3Title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-left whitespace-pre-line">
                    {triangulacionC3Desc}
                  </p>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-6 pt-3 border-t border-border/40">
                  {triangulacionC3Footer}
                </p>
              </div>
            </div>

            {/* Sello de Trazabilidad */}
            <div className="mt-6 rounded-2xl border border-border/40 bg-surface-raised/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-accent-text shrink-0" />
                <span>{triangulacionBannerText}</span>
              </span>
              <Link
                href={triangulacionBannerCtaHref}
                className="shrink-0 text-foreground hover:text-accent-text font-medium underline underline-offset-4 transition-colors"
              >
                {triangulacionBannerCtaLabel}
              </Link>
            </div>
          </section>

          {/* ── EJE 02: Composición bioquímica y actividad enzimática ── */}
          <section id="bioquimica" className="border-t border-border/40 pt-16 scroll-mt-36">
            <div className="mb-6">
              {bioquimicaKicker ? (
                <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                  {bioquimicaKicker}
                </span>
              ) : null}
              {bioquimicaTitle ? (
                <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.5rem)] font-light text-foreground">
                  {bioquimicaTitle}
                </h2>
              ) : null}
              {bioquimicaDesc ? (
                <p className={`mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left whitespace-pre-line ${alignToClass(cienciaSettings.text_align)}`}>
                  {bioquimicaDesc}
                </p>
              ) : null}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-3 pr-4 font-normal">{tablaThParametro}</th>
                    <th className="py-3 pr-4 font-normal text-accent-text">{tablaThMiel}</th>
                    <th className="py-3 font-normal">{tablaThAzucar}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {ig && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">{tablaR1Parametro}</td>
                      <td className="py-4 pr-4 text-accent-text">{tablaR1Miel}</td>
                      <td className="py-4 text-foreground">{tablaR1Azucar}</td>
                    </tr>
                  )}
                  {enzimas && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">{tablaR2Parametro}</td>
                      <td className="py-4 pr-4 text-accent-text">{tablaR2Miel}</td>
                      <td className="py-4 text-foreground">{tablaR2Azucar}</td>
                    </tr>
                  )}
                  {h2o2 && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">{tablaR3Parametro}</td>
                      <td className="py-4 pr-4 text-accent-text">{tablaR3Miel}</td>
                      <td className="py-4 text-foreground">{tablaR3Azucar}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <ul className="mt-6 space-y-2 text-xs text-muted-foreground border-t border-border/20 pt-6">
              {[ig, enzimas, h2o2].filter(Boolean).map((c) => c && (
                <li key={c.id}>
                  <strong className="text-foreground">{c.titulo}.</strong>{' '}
                  {c.url ? (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors hover:underline"
                    >
                      {c.fuente}
                    </a>
                  ) : (
                    c.fuente
                  )}
                </li>
              ))}
            </ul>

            {/* Protocolo de Laboratorio y Análisis por Lote */}
            <div className="mt-10 rounded-3xl border border-border/60 bg-surface-raised p-6 sm:p-8 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider font-semibold">
                  <ShieldCheck size={16} />
                  <span>{protocoloKicker}</span>
                </div>
                <h3 className="font-display text-xl font-light text-foreground">
                  {protocoloTitle || 'Estándares Físico-Químicos de Liberación'}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl whitespace-pre-line">
                  {protocoloDesc ||
                    'Cada partida envasada cuenta con respaldo analítico documentado antes de su distribución. Los estándares físico-químicos y botánicos respaldan la pureza entregada a hogares, cafeterías, hoteles y tiendas de autor:'}
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-4 rounded-2xl border border-border/40 bg-card space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent-text block">
                    {protocoloC1Badge}
                  </span>
                  <p className="text-foreground font-medium">{protocoloC1Title}</p>
                  <p className="text-muted-foreground leading-snug whitespace-pre-line">
                    {protocoloC1Desc}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-border/40 bg-card space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block">
                    {protocoloC2Badge}
                  </span>
                  <p className="text-foreground font-medium">{protocoloC2Title}</p>
                  <p className="text-muted-foreground leading-snug whitespace-pre-line">
                    {protocoloC2Desc}
                  </p>
                </div>
                <div className="p-4 rounded-2xl border border-border/40 bg-card space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent-text block">
                    {protocoloC3Badge}
                  </span>
                  <p className="text-foreground font-medium">{protocoloC3Title}</p>
                  <p className="text-muted-foreground leading-snug whitespace-pre-line">
                    {protocoloC3Desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Ensayos y Literatura Complementaria */}
            {cmsCienciaItems.length > 0 && (
              <div className="mt-8 space-y-4">
                <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text font-mono">
                  {evidenciaSectionTitle}
                </span>
                <div className="grid md:grid-cols-2 gap-4">
                  {cmsCienciaItems.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/40 bg-card p-6">
                      {item.categoria && (
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text block mb-2 font-mono">
                          {item.categoria}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-foreground mb-2">{item.titulo}</h3>
                      <p className={`text-xs text-muted-foreground leading-relaxed text-left whitespace-pre-line ${alignToClass(cienciaSettings.text_align)}`}>{item.texto}</p>
                      {item.fuente && (
                        <p className="mt-3 text-[10px] text-muted-foreground/70 font-mono">{item.fuente}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── EJE 03: Biblioteca de Floraciones del Bosque Nativo ── */}
          <section id="biblioteca" className="border-t border-border/40 pt-16 scroll-mt-36">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                  {bibliotecaKicker || 'EJE 03 · Botánica Melífera & Fenología Austral'}
                </span>
                <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] font-light text-foreground">
                  {bibliotecaTitle || 'La Biblioteca de Floraciones del Bosque Nativo'}
                </h2>
                <p className={`mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left whitespace-pre-line ${alignToClass(cienciaSettings.text_align)}`}>
                  {bibliotecaDesc ||
                    'El bosque nativo de Chile no florece todo a la vez: sigue una cadencia estacional estricta. Nuestra biblioteca documenta la taxonomía, fenología y perfil fitoquímico de las especies que dan vida a cada recolección.'}
                </p>
              </div>
              <Link
                href={bibliotecaCtaHref}
                className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border/60 bg-surface-raised/40 text-xs font-medium uppercase tracking-wider text-foreground hover:border-accent hover:text-accent-text transition-colors"
              >
                <span>{bibliotecaCtaLabel}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Pilares Metodológicos de la Biblioteca */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-border/40 bg-surface-raised p-5 space-y-2">
                <div className="flex items-center gap-2 text-accent-text text-xs uppercase tracking-wider font-semibold font-mono">
                  <BookOpen size={14} />
                  <span>{bibliotecaP1Title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {bibliotecaP1Desc}
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-raised p-5 space-y-2">
                <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider font-semibold font-mono">
                  <Compass size={14} />
                  <span>{bibliotecaP2Title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {bibliotecaP2Desc}
                </p>
              </div>

              <div className="rounded-2xl border border-border/40 bg-surface-raised p-5 space-y-2">
                <div className="flex items-center gap-2 text-accent-text text-xs uppercase tracking-wider font-semibold font-mono">
                  <Sparkles size={14} />
                  <span>{bibliotecaP3Title}</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {bibliotecaP3Desc}
                </p>
              </div>
            </div>

            {/* Vitrina Sintética de Especies */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {floracionesCards.map((f) => (
                <article
                  key={f.key}
                  className="rounded-2xl border border-border/50 bg-card p-5 sm:p-6 flex flex-col justify-between hover:border-accent/50 transition-colors space-y-5 group"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-xl font-medium text-foreground group-hover:text-accent-text transition-colors">
                          {f.nombre}
                        </h3>
                        <p className="text-[11px] italic text-muted-foreground font-serif">
                          {f.nombreCientifico}
                        </p>
                      </div>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-mono uppercase tracking-wider border shrink-0 ${f.colorBadge}`}>
                        {f.key}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-accent-text bg-surface-sunken/60 px-2.5 py-1 rounded-md border border-border/40 inline-block">
                      {f.temporada}
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {f.tagline}
                    </p>

                    <div>
                      <ul className="flex flex-wrap gap-1">
                        {f.cata.slice(0, 3).map((c) => (
                          <li
                            key={c}
                            className="text-[10px] px-2 py-0.5 rounded-full bg-surface-sunken border border-border/40 text-foreground/80"
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px]">
                    <Link
                      href={`/origen/${f.key}`}
                      className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      <span>{cardFichaLabel}</span>
                      <ArrowRight size={12} />
                    </Link>
                    <Link
                      href={`/ciencia/${f.key}`}
                      className="font-medium text-accent-text hover:text-accent transition-colors inline-flex items-center gap-1"
                    >
                      <span>{cardLabLabel}</span>
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ── EJE 04: Protocolo de Panel Sensorial Distribuido (ST-CATA) ── */}
          <section id="sensorial" className="border-t border-border/40 pt-16 scroll-mt-36">
            <div className="mb-8">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2 font-mono">
                {sensorialKicker}
              </span>
              <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] font-light text-foreground">
                {sensorialTitle}
              </h2>
              <p className={`mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left whitespace-pre-line ${alignToClass(cienciaSettings.text_align)}`}>
                {sensorialDesc}
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-2">
                <span className="font-mono text-xs text-accent-text font-semibold">{sensorialC1Title}</span>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {sensorialC1Desc}
                </p>
              </div>
              <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-2">
                <span className="font-mono text-xs text-primary font-semibold">{sensorialC2Title}</span>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {sensorialC2Desc}
                </p>
              </div>
              <div className="rounded-2xl border border-border/40 bg-card p-5 space-y-2">
                <span className="font-mono text-xs text-accent-text font-semibold">{sensorialC3Title}</span>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {sensorialC3Desc}
                </p>
              </div>
            </div>

            {/* Módulo: Estación de Origen */}
            <div className="rounded-3xl border border-accent/30 bg-surface-raised/40 p-7 sm:p-9 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                {estacionKicker ? (
                  <span className="block text-[0.65rem] tracking-[0.35em] uppercase text-accent-text font-mono">
                    {estacionKicker}
                  </span>
                ) : null}
                {estacionTitle ? (
                  <h3 className="font-display text-2xl sm:text-3xl font-light text-foreground">
                    {estacionTitle}
                  </h3>
                ) : null}
                {estacionDesc ? (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {estacionDesc}
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3 w-full sm:w-auto">
                <Link
                  href={estacionCtaHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:opacity-90 transition-opacity text-center"
                >
                  <span>{estacionCtaLabel || 'Estación de Origen'}</span>
                  <span aria-hidden="true">→</span>
                </Link>
                <Link
                  href={estacionSecondaryCtaHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/60 bg-background/50 px-5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground hover:border-accent transition-colors text-center"
                >
                  <span>{estacionSecondaryCtaLabel}</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ── EJE 05: Contabilidad Biofísica de Regeneración y Pecoreo ── */}
          <section id="biofisica" className="border-t border-border/40 pt-16 scroll-mt-36">
            <div className="mb-10">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2 font-mono">
                {metodologiaKicker || 'EJE 05 · Modelación Biofísica & Capacidad de Carga'}
              </span>
              {metodologiaTitle ? (
                <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] font-light text-foreground">
                  {metodologiaTitle}
                </h2>
              ) : null}
              {metodologiaDesc ? (
                <p className={`mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left whitespace-pre-line ${alignToClass(cienciaSettings.text_align)}`}>
                  {metodologiaDesc}
                </p>
              ) : null}
            </div>

            {/* Sub-eje Biofísico: Estequiometría de Pecoreo */}
            <div className="rounded-3xl border border-border/60 bg-surface-raised p-6 sm:p-8 space-y-6 mb-10">
              <div className="space-y-2">
                {pecoreoKicker ? (
                  <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent-text font-bold">
                    <Leaf size={14} />
                    <span>{pecoreoKicker}</span>
                  </div>
                ) : null}
                {pecoreoTitle ? (
                  <h3 className="font-display text-2xl font-light text-foreground">
                    {pecoreoTitle}
                  </h3>
                ) : null}
                {pecoreoDesc ? (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl whitespace-pre-line">
                    {pecoreoDesc}
                  </p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-border/50 bg-card/60 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent-text">
                    {pecoreoC1Title}
                  </span>
                  <p className="font-mono text-[11px] text-foreground">
                    {pecoreoC1Formula}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug whitespace-pre-line">
                    {pecoreoC1Desc}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border/50 bg-card/60 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                    {pecoreoC2Title}
                  </span>
                  <p className="font-mono text-[11px] text-foreground">
                    {pecoreoC2Formula}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug whitespace-pre-line">
                    {pecoreoC2Desc}
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border/50 bg-card/60 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent-text">
                    {pecoreoC3Title}
                  </span>
                  <p className="font-mono text-[11px] text-foreground">
                    {pecoreoC3Formula}
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug whitespace-pre-line">
                    {pecoreoC3Desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Equivalencias por gramaje de producto */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="rounded-2xl border border-border/60 bg-surface-raised p-6 space-y-2">
                <div className="flex items-center gap-2 text-accent-text text-xs uppercase tracking-wider font-semibold">
                  <Scale size={14} />
                  <span>{equivalenciaC1Title}</span>
                </div>
                <p className="font-display text-2xl font-light text-foreground">
                  {equivalenciaC1Value}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {equivalenciaC1Desc}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-surface-raised p-6 space-y-2">
                <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider font-semibold">
                  <Leaf size={14} />
                  <span>{equivalenciaC2Title}</span>
                </div>
                <p className="font-display text-2xl font-light text-foreground">
                  {equivalenciaC2Value}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {equivalenciaC2Desc}
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-surface-raised p-6 space-y-2">
                <div className="flex items-center gap-2 text-accent-text text-xs uppercase tracking-wider font-semibold">
                  <TreePine size={14} />
                  <span>{equivalenciaC3Title}</span>
                </div>
                <p className="font-display text-2xl font-light text-foreground">
                  {equivalenciaC3Value}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                  {equivalenciaC3Desc}
                </p>
              </div>
            </div>

            {/* Métricas en vivo del ecosistema */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 shadow-sm mb-10">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-xl font-light text-foreground">
                    {ecosistemaTitle}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {ecosistemaTerritorio}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-accent/10 text-accent-text border border-accent/20">
                  {ecosistemaVersionBadge}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Metric
                  label={ecosistemaM1Label}
                  value={m.arboles_total > 0 ? m.arboles_total.toLocaleString('es-CL') : 'En censo 2026–2027'}
                />
                <Metric
                  label={ecosistemaM2Label}
                  value={m.arboles_total > 0 && co2CapturadoAnual != null ? `${co2CapturadoAnual.toLocaleString('es-CL')} kg` : 'En medición'}
                />
                <Metric
                  label={ecosistemaM3Label}
                  value={m.arboles_total > 0 && co2EmitidoAnual != null ? `${co2EmitidoAnual.toLocaleString('es-CL')} kg` : 'En auditoría'}
                />
                <Metric
                  label={ecosistemaM4Label}
                  value={m.arboles_total > 0 && irrCalculado != null ? String(irrCalculado) : 'En calibración'}
                />
              </div>

              <p className="mt-6 text-xs text-muted-foreground leading-relaxed text-left border-t border-border/30 pt-4 whitespace-pre-line">
                {m.arboles_total > 0 && irrCalculado != null
                  ? `IRR = ${co2CapturadoAnual?.toLocaleString('es-CL') ?? '—'} kg capturado / ${co2EmitidoAnual?.toLocaleString('es-CL') ?? '—'} kg emitido = ${irrCalculado}. Un valor superior a 1.0 documenta una huella neta regenerativa.`
                  : ecosistemaDisclaimer}
              </p>
            </div>

            {/* Horizonte Metodológico (si está configurado) */}
            {horizonteTitle || horizonteText ? (
              <div className="rounded-3xl border border-border/50 bg-surface-raised p-6 sm:p-8 space-y-2 mb-10">
                {horizonteTitle ? (
                  <h4 className="font-display text-lg font-medium text-foreground">
                    {horizonteTitle}
                  </h4>
                ) : null}
                {horizonteText ? (
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {horizonteText}
                  </p>
                ) : null}
              </div>
            ) : null}

            {/* Metodología abierta: Fórmulas y Fuentes */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border/50 bg-surface-sunken p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-text font-mono">
                  <FileText size={14} />
                  <span>{formulasTitle}</span>
                </div>
                <ul className="space-y-3 text-xs font-mono text-muted-foreground">
                  <li className="p-3 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground block font-sans font-medium text-[11px] mb-1">
                      {formulasC1Label}
                    </span>
                    {formulasC1Text}
                  </li>
                  <li className="p-3 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground block font-sans font-medium text-[11px] mb-1">
                      {formulasC2Label}
                    </span>
                    {formulasC2Text}
                  </li>
                  <li className="p-3 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground block font-sans font-medium text-[11px] mb-1">
                      {formulasC3Label}
                    </span>
                    {formulasC3Text}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border/50 bg-surface-sunken p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary font-mono">
                  <BookOpen size={14} />
                  <span>{fuentesTitle}</span>
                </div>
                <ul className="space-y-3">
                  {IMPACTO_FUENTES.map((f) => (
                    <li key={f.id} className="text-xs leading-relaxed">
                      <span className="font-semibold text-foreground">{f.titulo}</span>
                      <p className="text-muted-foreground mt-0.5">{f.nota}</p>
                      {f.url && (
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-accent-text hover:underline mt-1 inline-block"
                        >
                          Ver publicación →
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ── EJE 06: Compliance Regulatorio & Responsabilidad Científica ── */}
          <section id="respaldo" className="rounded-3xl border border-border/60 bg-surface-raised p-8 space-y-4 scroll-mt-36">
            <div className="space-y-1">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text font-mono">
                {respaldoKicker}
              </span>
              <div className="flex items-center gap-2 text-accent-text text-sm font-semibold">
                <Scale size={18} />
                <h2 className="font-display text-xl font-medium text-foreground">
                  {respaldoTitle || 'Límites Metodológicos & Responsabilidad Regulatoria'}
                </h2>
              </div>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed text-left">
              {IMPACTO_LIMITES.map((l) => (
                <li key={l.id}>· {l.texto}</li>
              ))}
              <li>· Estas notas proporcionan contexto botánico y bibliográfico de composición; no constituyen rotulado terapéutico MINSAL ni promesas médicas.</li>
              <li>· El IRR es un cociente biofísico de transparencia interna y no debe confundirse con un bono de carbono transferible ni un Análisis de Ciclo de Vida (ACV) corporativo.</li>
            </ul>
            {respaldoExtraNotas ? (
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed text-left whitespace-pre-line border-t border-border/30 pt-4">
                {respaldoExtraNotas}
              </p>
            ) : null}
          </section>

          <p className="text-xs text-muted-foreground px-2 leading-relaxed text-left">{respaldoDisclaimerMinsal}</p>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-3xl font-light text-foreground tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">{label}</p>
    </div>
  );
}
