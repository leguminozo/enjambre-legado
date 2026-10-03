/**
 * Catálogo de afirmaciones científicas publicables en la tienda.
 *
 * Regla estructural: una afirmación solo puede aparecer en HTML público si
 * está en este catálogo con estado `triangulado` (fuente real y verificable).
 * Los claims `pendiente` (fuente en verificación) o `retirado` (riesgo legal
 * o sin sustento) NO se exportan para render — es imposible colgarlos.
 *
 * Contexto legal chileno: un alimento no puede declarar efectos terapéuticos
 * ni claims de salud (Ley 20.606 y regulación MINSAL). El catálogo distingue
 * entre "composición / contexto bibliográfico" y "indicación terapéutica":
 * solo lo primero es publicable, con su cita visible.
 */

export type ClaimEstado = 'triangulado' | 'pendiente' | 'retirado';

export interface ClaimCiencia {
  /** Estable, para referencias desde páginas y CMS. */
  id: string;
  titulo: string;
  /** Texto público — redactado como composición/contexto, nunca como efecto sobre la salud. */
  texto: string;
  /** Cita legible (autor/año/medio). La cita real es condición para triangulado. */
  fuente: string;
  /** Enlace opcional a la fuente científica o reguladora. */
  url?: string;
  estado: ClaimEstado;
}

export const CLAIMS_CIENCIA: readonly ClaimCiencia[] = [
  {
    id: 'ig_referencia',
    titulo: 'Índice glucémico de referencia',
    texto:
      'En tablas internacionales publicadas, el índice glucémico de la miel (~55) es menor que el de la sacarosa (65); el valor varía según origen botánico. Es un dato de literatura, no un sello nutricional de este frasco.',
    fuente:
      'Foster-Powell, Holt & Brand-Miller (2002). International table of glycemic index and glycemic load values. Am. J. Clin. Nutr. 76(1):5–56.',
    url: 'https://doi.org/10.1093/ajcn/76.1.5',
    estado: 'triangulado',
  },
  {
    id: 'composicion_enzimas',
    titulo: 'Composición: enzimas de la miel cruda',
    texto:
      'La miel cruda conserva enzimas (diastasa, invertasa, glucosa oxidasa) que el calentamiento industrial degrada. La actividad diastásica es, además, un parámetro de calidad en la norma internacional del producto.',
    fuente:
      'Codex Alimentarius, norma para la miel CXS 12-1981 (parámetros de calidad).',
    url: 'https://www.fao.org/fao-who-codexalimentarius/sh-proxy/es/?lnk=1&url=https%253A%252F%252Fworkspace.fao.org%252Fsites%252Fcodex%252FStandards%252FCXS%2B12-1981%252FCXS_012s.pdf',
    estado: 'triangulado',
  },
  {
    id: 'h2o2_antimicrobiana',
    titulo: 'Contexto bibliográfico: peróxido de hidrógeno',
    texto:
      'La literatura atribuye parte de la actividad antibacteriana de la miel al peróxido de hidrógeno generado por la glucosa oxidasa en presencia de agua. Es contexto de investigación, no un estándar clínico.',
    fuente:
      'White, Subers & Schepartz (1963). The identification of inhibine, the antibacterial factor in honey, as hydrogen peroxide. Biochim. Biophys. Acta 73(1):57–70.',
    url: 'https://doi.org/10.1016/0926-6569(63)90108-9',
    estado: 'triangulado',
  },
  {
    id: 'hmf_limite_codex',
    titulo: 'HMF: límite regulatorio de referencia',
    texto:
      'El hidroximetilfurfural (HMF) es un indicador de frescura y exposición al calor. La norma internacional establece un límite de 40 mg/kg para la miel en general (80 mg/kg en climas tropicales).',
    fuente: 'Codex Alimentarius, norma para la miel CXS 12-1981.',
    url: 'https://www.fao.org/fao-who-codexalimentarius/sh-proxy/es/?lnk=1&url=https%253A%252F%252Fworkspace.fao.org%252Fsites%252Fcodex%252FStandards%252FCXS%2B12-1981%252FCXS_012s.pdf',
    estado: 'triangulado',
  },
  {
    id: 'perfil_organoleptico',
    titulo: 'Origen botánico y perfil sensorial',
    texto:
      'El perfil sensorial de una miel varía con su origen botánico y se documenta con ruedas de aroma y paneles descriptivos: el bosque húmedo del sur de Chile entrega perfiles que no se replican fuera de su territorio.',
    fuente:
      'UC Davis Honey Flavor and Aroma Wheel; Galán-Soldevilla et al. (2010); panel sensorial chileno (Cien. Inv. Agr. 35(1)).',
    url: 'https://honey.ucdavis.edu/learn/honey-wheel',
    estado: 'triangulado',
  },
  {
    id: 'manuka_comparable',
    titulo: 'Comparación con variedades de referencia',
    texto:
      'La comparación de actividad con variedades internacionales requiere ensayos estandarizados por variedad; no publicamos equivalencias sin ese ensayo.',
    fuente: 'Pendiente de ensayo estandarizado por variedad.',
    estado: 'pendiente',
  },
  {
    id: 'antioxidante_ulmo_estudio',
    titulo: 'Antioxidantes en flora nativa de Chiloé',
    texto:
      'Estudios sobre compuestos fenólicos en mieles chilenas están en proceso de consolidación por variedad y territorio.',
    fuente: 'Pendiente de consolidación bibliográfica.',
    estado: 'pendiente',
  },
  {
    id: 'efectos_ansioliticos',
    titulo: 'Categoría retirada: efectos sobre salud mental',
    texto:
      'Retirado: un alimento no declara efectos ansiolíticos, antidepresivos ni sobre el eje intestino-cerebro (Ley 20.606).',
    fuente: 'Retirado por regulación chilena de rotulación de alimentos.',
    estado: 'retirado',
  },
  {
    id: 'control_glucemico_clinico',
    titulo: 'Categoría retirada: uso clínico',
    texto:
      'Retirado: HbA1c, prediabetes y síndrome metabólico no son lenguaje publicable en un alimento.',
    fuente: 'Retirado por regulación chilena de rotulación de alimentos.',
    estado: 'retirado',
  },
] as const;

/** Solo afirmaciones listas para HTML público (fuente real verificada). */
export function claimsTrianguladas(): ClaimCiencia[] {
  return CLAIMS_CIENCIA.filter((c) => c.estado === 'triangulado');
}

export function getClaim(id: string): ClaimCiencia | undefined {
  return CLAIMS_CIENCIA.find((c) => c.id === id);
}

/** Contexto legal estándar para bloques de ciencia en la tienda. */
export const DISCLAIMER_LEY_20606 =
  'Contexto bibliográfico y de composición. No es indicación terapéutica ni rotulado MINSAL (Ley 20.606). El alimento se presenta por origen y oficio.';