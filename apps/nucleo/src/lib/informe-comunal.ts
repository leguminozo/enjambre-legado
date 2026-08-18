import {
  COMUNAS_CHILOE,
  nombreCanonicoComuna,
  resolveComunaChiloe,
  slugifyComuna,
} from './chiloe-comunas';

/** Con 1–2 apiarios el total de colmenas identifica al declarante. */
export const MIN_APIARIOS_PARA_PUBLICAR_COLMENAS = 3;

export type ResumenComuna = {
  comuna: string;
  actores_activos: number;
  apiarios: number;
  colmenas: number;
  trashumantes: number;
  alertas_activas: number;
};

export type InformeComunalPublico = {
  slug: string;
  comuna: string;
  es_comuna_chiloe: boolean;
  actores_activos: number;
  apiarios_declarados: number;
  trashumantes_declarados: number;
  alertas_activas: number;
  colmenas_publicables: boolean;
  colmenas: number | null;
  vacio: boolean;
  nota_colmenas: string | null;
  disclaimer: string;
};

export const INFORME_DISCLAIMER =
  'Información agregada y anonimizada. No se publican nombres, RUT, RUP, teléfonos ni coordenadas exactas (Ley 21.719). El total de colmenas solo se muestra si hay al menos tres apiarios declarados. Esto no es un acto del SAG ni un censo oficial del Estado.';

export function agregarResumenComunas(input: {
  actores: Array<{ comuna?: string | null }>;
  apiarios: Array<{ comuna?: string | null; n_colmenas?: number | null }>;
  trashumantes: Array<{ comuna_destino?: string | null }>;
  alertas: Array<{ comuna?: string | null }>;
}): ResumenComuna[] {
  const mapa = new Map<string, ResumenComuna>();
  const bump = (
    comuna: string | null | undefined,
    key: Exclude<keyof ResumenComuna, 'comuna'>,
    delta = 1,
  ) => {
    const nombre = comuna?.trim();
    if (!nombre) return;
    const canon = nombreCanonicoComuna(nombre);
    const actual = mapa.get(canon) ?? {
      comuna: canon,
      actores_activos: 0,
      apiarios: 0,
      colmenas: 0,
      trashumantes: 0,
      alertas_activas: 0,
    };
    actual[key] += delta;
    mapa.set(canon, actual);
  };

  for (const a of input.actores) bump(a.comuna, 'actores_activos');
  for (const ap of input.apiarios) {
    bump(ap.comuna, 'apiarios');
    bump(ap.comuna, 'colmenas', Number(ap.n_colmenas ?? 0));
  }
  for (const e of input.trashumantes) bump(e.comuna_destino, 'trashumantes');
  for (const al of input.alertas) bump(al.comuna, 'alertas_activas');

  return [...mapa.values()].sort((a, b) => a.comuna.localeCompare(b.comuna, 'es'));
}

export function publicarColmenas(
  apiarios: number,
  colmenas: number,
): { colmenas: number | null; colmenas_publicables: boolean; nota: string | null } {
  if (apiarios <= 0) {
    return { colmenas: 0, colmenas_publicables: true, nota: null };
  }
  if (apiarios < MIN_APIARIOS_PARA_PUBLICAR_COLMENAS) {
    return {
      colmenas: null,
      colmenas_publicables: false,
      nota: `Hay ${apiarios === 1 ? '1 apiario declarado' : `${apiarios} apiarios declarados`}. El total de colmenas no se publica para no identificar a quien declaró (Ley 21.719).`,
    };
  }
  return { colmenas, colmenas_publicables: true, nota: null };
}

export function toInformePublico(row: ResumenComuna): InformeComunalPublico {
  const resolved = resolveComunaChiloe(row.comuna);
  const pub = publicarColmenas(row.apiarios, row.colmenas);
  const vacio =
    row.actores_activos === 0 &&
    row.apiarios === 0 &&
    row.trashumantes === 0 &&
    row.alertas_activas === 0;
  return {
    slug: resolved?.slug ?? slugifyComuna(row.comuna),
    comuna: resolved?.nombre ?? row.comuna,
    es_comuna_chiloe: Boolean(resolved),
    actores_activos: row.actores_activos,
    apiarios_declarados: row.apiarios,
    trashumantes_declarados: row.trashumantes,
    alertas_activas: row.alertas_activas,
    colmenas_publicables: pub.colmenas_publicables,
    colmenas: pub.colmenas,
    vacio,
    nota_colmenas: pub.nota,
    disclaimer: INFORME_DISCLAIMER,
  };
}

/** Las 10 comunas de Chiloé, con ceros si aún no hay declaraciones. */
export function informesChiloe(rows: ResumenComuna[]): InformeComunalPublico[] {
  const bySlug = new Map<string, ResumenComuna>();
  for (const row of rows) {
    const resolved = resolveComunaChiloe(row.comuna);
    if (resolved) bySlug.set(resolved.slug, { ...row, comuna: resolved.nombre });
  }

  return COMUNAS_CHILOE.map((c) => {
    const row = bySlug.get(c.slug) ?? {
      comuna: c.nombre,
      actores_activos: 0,
      apiarios: 0,
      colmenas: 0,
      trashumantes: 0,
      alertas_activas: 0,
    };
    return toInformePublico(row);
  });
}

export function informeDeSlug(
  rows: ResumenComuna[],
  slug: string,
): InformeComunalPublico | null {
  const resolved = resolveComunaChiloe(slug);
  if (!resolved) return null;
  const row = rows.find((r) => resolveComunaChiloe(r.comuna)?.slug === resolved.slug) ?? {
    comuna: resolved.nombre,
    actores_activos: 0,
    apiarios: 0,
    colmenas: 0,
    trashumantes: 0,
    alertas_activas: 0,
  };
  return toInformePublico({ ...row, comuna: resolved.nombre });
}
