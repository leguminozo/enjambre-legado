/**
 * scripts/fenologia/calibrar.ts
 * Calibración pasiva del Oráculo fenológico (US$0, todo vía API pública):
 *   1. GBIF: facet mensual de ocurrencias en bbox Chiloé → ventana de floración por especie.
 *   2. iNaturalist: observaciones con fenofase "Flowers" (term_id=12, term_value_id=13)
 *      en Chile → fechas exactas de floración.
 *   3. Open-Meteo ERA5: GDD acumulado (desde 1-jul, Tbase 5°C) hasta cada evento floral.
 *   → umbral GDD por especie = mediana de GDD-a-floración; stddev = dispersión.
 *
 * Uso: npx tsx apps/nucleo/scripts/fenologia/calibrar.ts [--out /tmp/calibracion.json]
 * Salida: JSON + SQL de seed (stdout) para insertar en especies_fenologicas.
 */
import { writeFileSync } from "node:fs";

// Chiloé (bbox) — misma región del proyecto
const BBOX = { latMin: -43.8, latMax: -41.5, lngMin: -74.6, lngMax: -73.1 };
const CENTRO = { lat: -41.86, lng: -73.82 }; // Pureo
const INAT_PLACE_CHILE = 7182;
const TBASE = 5;

const ESPECIES = [
  { cientifico: "Eucryphia cordifolia", comun: "Ulmo", familia: "Cunoniaceae", gbifKey: 3920287 },
  { cientifico: "Tepualia stipularis", comun: "Tepú", familia: "Myrtaceae", gbifKey: 3188365 },
  { cientifico: "Caldcluvia paniculata", comun: "Tiaca", familia: "Cunoniaceae", gbifKey: 3613200 },
  { cientifico: "Embothrium coccineum", comun: "Notro", familia: "Proteaceae", gbifKey: 7124132 },
  { cientifico: "Luma apiculata", comun: "Arrayán", familia: "Myrtaceae", gbifKey: 5420309 },
  { cientifico: "Amomyrtus luma", comun: "Luma", familia: "Myrtaceae", gbifKey: 3186044 },
  { cientifico: "Drimys winteri", comun: "Canelo", familia: "Winteraceae", gbifKey: 4020527 },
  { cientifico: "Weinmannia trichosperma", comun: "Tineo", familia: "Cunoniaceae", gbifKey: 3613680 },
  { cientifico: "Myrceugenia planipes", comun: "Patagua", familia: "Myrtaceae", gbifKey: 3185825 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { "User-Agent": "enjambre-fenologia/1.0 (contacto@obrerayzangano.cl)" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url.slice(0, 120)}`);
  return res.json();
}

/** 1. GBIF: histograma mensual en Chiloé (un solo request con facet). */
async function gbifHistograma(gbifKey: number): Promise<{ mes: number; count: number }[]> {
  const url =
    `https://api.gbif.org/v1/occurrence/search?taxonKey=${gbifKey}` +
    `&decimalLatitude=${BBOX.latMin},${BBOX.latMax}&decimalLongitude=${BBOX.lngMin},${BBOX.lngMax}` +
    `&hasCoordinate=true&hasGeospatialIssue=false&facet=month&facetLimit=12&limit=0`;
  const data = await getJson(url);
  const facet = data.facets?.find((f: any) => f.field === "MONTH");
  return (facet?.counts ?? []).map((c: any) => ({ mes: Number(c.name), count: c.count }));
}

/** 2. iNaturalist: resuelve taxon_id por nombre científico. */
async function inatTaxonId(cientifico: string): Promise<number | null> {
  const url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(cientifico)}&rank=species&per_page=1`;
  const data = await getJson(url);
  const t = data.results?.[0];
  return t?.is_active ? t.id : null;
}

/** 2b. iNaturalist: observaciones con fenofase "Flowers" en Chile. */
async function inatFlores(taxonId: number): Promise<{ fecha: string; lat?: number; lng?: number }[]> {
  const out: { fecha: string; lat?: number; lng?: number }[] = [];
  for (let page = 1; page <= 5; page++) {
    const url =
      `https://api.inaturalist.org/v1/observations?verifiable=true&place_id=${INAT_PLACE_CHILE}` +
      `&taxon_id=${taxonId}&term_id=12&term_value_id=13&per_page=100&page=${page}`;
    const data = await getJson(url);
    const results = data.results ?? [];
    for (const r of results) {
      if (!r.observed_on) continue;
      const lat = r.geojson?.coordinates?.[1];
      const lng = r.geojson?.coordinates?.[0];
      out.push({ fecha: r.observed_on, lat: lat ?? undefined, lng: lng ?? undefined });
    }
    if (results.length < 100 || page >= 5) break;
    await sleep(500);
  }
  return out;
}

/** 3. Open-Meteo ERA5: serie de una temporada fenológica completa.
 *  Temporada hemisferio sur: 1-jul (año N) → 30-jun (año N+1).
 *  Un evento en feb pertenece a la temporada que empezó jul del año anterior. */
async function serieTemporada(anioInicio: number): Promise<{ time: string[]; tmax: number[]; tmin: number[] } | null> {
  const start = `${anioInicio}-07-01`;
  const end = `${anioInicio + 1}-06-30`;
  const url =
    `https://archive-api.open-meteo.com/v1/era5?latitude=${CENTRO.lat}&longitude=${CENTRO.lng}` +
    `&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min&timezone=America%2FSantiago`;
  try {
    const data = await getJson(url);
    return {
      time: data.daily?.time ?? [],
      tmax: data.daily?.temperature_2m_max ?? [],
      tmin: data.daily?.temperature_2m_min ?? [],
    };
  } catch {
    return null;
  }
}

/** GDD acumulado desde 1-jul de la temporada hasta una fecha dentro de la serie. */
function gddEnFecha(fecha: string, serie: { time: string[]; tmax: number[]; tmin: number[] }): number | null {
  let gdd = 0;
  for (let i = 0; i < serie.time.length; i++) {
    if (serie.time[i] > fecha) break;
    const media = (serie.tmax[i] + serie.tmin[i]) / 2;
    gdd += Math.max(0, media - TBASE);
  }
  if (serie.time.length === 0 || serie.time[serie.time.length - 1] < fecha) return null;
  return Math.round(gdd * 10) / 10;
}

function mediana(vals: number[]): number {
  const s = [...vals].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function desviacion(vals: number[], med: number): number {
  if (vals.length < 2) return 0;
  const v = vals.reduce((a, x) => a + (x - med) ** 2, 0) / (vals.length - 1);
  return Math.round(Math.sqrt(v) * 10) / 10;
}

async function main() {
  const out: any[] = [];
  for (const esp of ESPECIES) {
    console.log(`\n=== ${esp.comun} (${esp.cientifico}) ===`);
    try {
      // 1. GBIF → señal de colección (solo diagnóstico; la ventana real sale de iNat)
      const hist = await gbifHistograma(esp.gbifKey);
      await sleep(1200);
      const mesesConDatos = hist.filter((h) => h.count > 0).sort((a, b) => b.count - a.count);
      const picoGBIF = mesesConDatos[0]?.mes ?? null;
      console.log("  GBIF (Chiloé):", hist.map((h) => `${h.mes}:${h.count}`).join(" "));

      // 2. iNaturalist → fechas de floración
      const taxonId = await inatTaxonId(esp.cientifico);
      await sleep(500);
      let eventos: { fecha: string; lat?: number; lng?: number }[] = [];
      if (taxonId) {
        eventos = await inatFlores(taxonId);
        console.log(`  iNat "Flowers" (taxon ${taxonId}): ${eventos.length}`);
        await sleep(500);
      }

      // 3. GDD por evento: una serie ERA5 por temporada fenológica (jul→jun), cache en memoria
      const seriePorTemporada = new Map<number, { time: string[]; tmax: number[]; tmin: number[] } | null>();
      const gddEventos: { fecha: string; gdd: number }[] = [];
      for (const ev of eventos) {
        const anio = Number(ev.fecha.slice(0, 4));
        const mes = Number(ev.fecha.slice(5, 7));
        if (anio < 2014) continue;
        // Evento en ene-jun → temporada iniciada jul del año anterior
        const anioInicio = mes < 7 ? anio - 1 : anio;
        if (!seriePorTemporada.has(anioInicio)) {
          seriePorTemporada.set(anioInicio, await serieTemporada(anioInicio));
          await sleep(150);
        }
        const serie = seriePorTemporada.get(anioInicio) ?? null;
        if (!serie) continue;
        const gdd = gddEnFecha(ev.fecha, serie);
        if (gdd != null) gddEventos.push({ fecha: ev.fecha, gdd });
      }

      const gddVals = gddEventos.map((e) => e.gdd);
      const umbral = gddVals.length ? mediana(gddVals) : null;
      const std = gddVals.length ? desviacion(gddVals, umbral ?? 0) : null;

      // Ventana de floración: meses de los eventos iNat "Flowers" (señal real, no sesgo de colección)
      const mesesEventos = eventos
        .map((ev) => Number(ev.fecha.slice(5, 7)))
        .filter((m) => m >= 1 && m <= 12);
      const porMes = new Map<number, number>();
      for (const m of mesesEventos) porMes.set(m, (porMes.get(m) ?? 0) + 1);
      const picoMes = Math.max(...porMes.values(), 0);
      const ventana = [...porMes.entries()]
        .filter(([, c]) => picoMes > 0 && c >= Math.max(2, picoMes * 0.5))
        .map(([m]) => m)
        .sort((a, b) => a - b);
      console.log(`  GDD-a-floración (n=${gddVals.length}): ${gddVals.slice(0, 12).join(", ")}${gddVals.length > 12 ? "…" : ""}`);
      console.log(`  → umbral ${umbral} ± ${std} | ventana iNat ${ventana.join("-")} (GBIF pico mes ${picoGBIF})`);

      out.push({
        cientifico: esp.cientifico,
        comun: esp.comun,
        familia: esp.familia,
        tbase: TBASE,
        gddUmbral: umbral,
        gddStddev: std,
        ventanaIni: ventana[0] ?? null,
        ventanaFin: ventana[ventana.length - 1] ?? null,
        fuente: gddVals.length >= 5 ? "inat" : gddVals.length > 0 ? "inat" : "gbif",
        nEventos: gddVals.length,
      });
    } catch (e) {
      console.error("  ERROR:", e);
      out.push({ cientifico: esp.cientifico, comun: esp.comun, error: String(e) });
    }
  }

  // SQL de seed
  let sql = "";
  for (const r of out) {
    if (r.error) continue;
    sql +=
      `INSERT INTO public.especies_fenologicas ` +
      `(nombre_cientifico, nombre_comun, familia, tbase_c, gdd_umbral, gdd_stddev, ventana_ini, ventana_fin, fuente, activo) VALUES ` +
      `('${r.cientifico}', '${r.comun}', '${r.familia}', ${r.tbase}, ` +
      `${r.gddUmbral ?? "NULL"}, ${r.gddStddev ?? "NULL"}, ${r.ventanaIni ?? "NULL"}, ${r.ventanaFin ?? "NULL"}, ` +
      `'${r.fuente}', true) ` +
      `ON CONFLICT (nombre_cientifico) DO UPDATE SET ` +
      `nombre_comun = EXCLUDED.nombre_comun, familia = EXCLUDED.familia, tbase_c = EXCLUDED.tbase_c, ` +
      `gdd_umbral = EXCLUDED.gdd_umbral, gdd_stddev = EXCLUDED.gdd_stddev, ` +
      `ventana_ini = EXCLUDED.ventana_ini, ventana_fin = EXCLUDED.ventana_fin, fuente = EXCLUDED.fuente;\n`;
  }

  console.log("\n\n===== SEED SQL =====");
  console.log(sql);
  writeFileSync("/tmp/calibracion.json", JSON.stringify(out, null, 2));
  writeFileSync("/tmp/calibracion-seed.sql", sql);
  console.log("Guardado: /tmp/calibracion.json + /tmp/calibracion-seed.sql");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
