import Link from 'next/link';
import type { Metadata } from 'next';
import {
  ShieldCheck,
  Leaf,
  Flower2,
  TreePine,
  Sparkles,
  BookOpen,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import { getSiteContentBatch } from '@/lib/cms';
import { parseCienciaSettings } from '@/lib/shop/store-chrome';
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
      'Miel de perfil profundo y balsámico, con una acidez noble característica y un retrogusto largo. Cristalización media y alta persistencia en boca.',
    aporteRegeneracion:
      'Especie pionera clave en la protección de riberas y cuencas hídricas en Chiloé. Su floración tardía garantiza el sustento energético de la colmena previo al reposo invernal.',
  },
  {
    key: 'quillay',
    nombre: 'Quillay',
    nombreCientifico: 'Quillaja saponaria',
    temporada: 'Octubre a Diciembre (Primavera)',
    tagline: 'El árbol sagrado de la vertiente esclerófila y templada.',
    colorBadge: 'border-success/40 bg-success/10 text-success-text',
    cata: ['Floral intenso', 'Toques tostados', 'Amargor noble', 'Aroma fresco y vegetal'],
    perfil:
      'Miel ámbar dorada de viscosidad densa. Contiene saponinas y fitoquímicos naturales que confieren propiedades tensoactivas suaves y gran riqueza antioxidante.',
    aporteRegeneracion:
      'Árbol endémico de excepcional resiliencia hídrica. Su polen vigoroso reactiva el sistema inmune del enjambre al inicio de cada temporada.',
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
  const [m, batch] = await Promise.all([
    getEcosystemMetrics(),
    getSiteContentBatch(['ciencia', 'ciencia_settings'], { draft }),
  ]);
  const cienciaSettings = parseCienciaSettings((batch.ciencia_settings?.[0]?.content as Record<string, unknown>) ?? null);
  const cmsCienciaItems = (batch.ciencia ?? [])
    .map((row) => row.content as { categoria?: string; titulo?: string; texto?: string; fuente?: string })
    .filter((item) => Boolean(item?.titulo && item?.texto));

  // Coeficientes y límites desde la metodología publicada (paquete compartido).
  const ig = getClaim('ig_referencia');
  const enzimas = getClaim('composicion_enzimas');
  const h2o2 = getClaim('h2o2_antimicrobiana');
  const hmf = getClaim('hmf_limite_codex');
  const perfil = getClaim('perfil_organoleptico');
  const claims = claimsTrianguladas();
  const metodo = getMetodologiaPublica();

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
        <section className="relative px-4 text-center pt-[max(7rem,calc(env(safe-area-inset-top)+5.5rem))] pb-16 md:py-32">
          <div className="max-w-3xl mx-auto">
            <span className="block text-[0.65rem] tracking-[0.5em] uppercase text-accent-text mb-8">
              {cienciaSettings.kicker || 'Ciencia'}
            </span>
            <h1 className="font-display text-[clamp(2.25rem,8vw,4.5rem)] md:text-7xl font-light text-foreground mb-6 text-balance">
              {cienciaSettings.title || 'La ciencia del bosque'}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty text-left">
              {cienciaSettings.subtitle ||
                'Cada frasco condensa un proceso biofísico observable. Estas son las referencias bibliográficas que lo acompañan, con sus límites explícitos.'}
            </p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-24 space-y-24">
          {/* ── EJE 01: Triangulación botánica libre de pesticidas ── */}
          <section className="border-t border-border/40 pt-12">
            <div className="mb-10">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Eje 01 · Triangulación Botánica
              </span>
              <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] font-light text-foreground">
                Refugio Austral: Bosque Nativo sin Pesticidas
              </h2>
              <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left">
                El archipiélago de Chiloé y la vertiente occidental de la Cordillera de la Costa constituyen
                un santuario biogeográfico aislado. La ausencia de monocultivos agroindustriales extensivos,
                combinada con una densa pluviometría templada lluviosa, protege los apiarios de la deriva
                de agroquímicos sintéticos.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent-text">
                    <ShieldCheck size={20} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    Cero Neonicotinoides y Glifosato
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-left">
                    Los análisis cromatográficos multiresiduo en matrices de polen y miel silvestre
                    del bosque templado lluvioso demuestran la ausencia detectable de insecticidas
                    sistémicos (imidacloprid, tiametoxam) y herbicidas de uso agroindustrial masivo.
                  </p>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-6 pt-3 border-t border-border/40">
                  Fuente: Ensayos palinológicos y de residuos · INIA / UACh
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <Leaf size={20} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    Nutrición 100% Silvestre
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-left">
                    A diferencia de la apicultura industrial que alimenta colmenas con jarabes de maíz
                    de alta fructosa (HFCS) y sustitutos artificiales, el enjambre se nutre
                    exclusivamente de las reservas de néctar y polen nativo de floraciones siempreverdes.
                  </p>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-6 pt-3 border-t border-border/40">
                  Preservación de la microbiota simbiótica de la abeja
                </p>
              </div>

              <div className="rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent-text">
                    <BookOpen size={20} />
                  </div>
                  <h3 className="font-display text-lg font-medium text-foreground">
                    Triangulación Académica
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-left">
                    La literatura botánica y agronómica (Universidad Austral de Chile, Pontificia
                    Universidad Católica e INIA) respalda la dominancia de especies endémicas
                    del bosque valdiviano como fuente única de bioactividad antibacteriana no peróxica.
                  </p>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground/80 mt-6 pt-3 border-t border-border/40">
                  Melisopalinología NCh2981 · Monofloralidad estricta
                </p>
              </div>
            </div>
          </section>

          {/* ── EJE 02: Composición bioquímica y enzimas vivas ── */}
          <section className="border-t border-border/40 pt-16">
            <div className="mb-6">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Eje 02 · Bioquímica de Origen
              </span>
              <h2 className="font-display text-[clamp(1.5rem,5.5vw,2.5rem)] font-light text-foreground">
                Composición de la Miel Cruda Viva
              </h2>
              <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left">
                La miel no es un producto fabricado: es energía solar transformada en biomolécula
                por una cadena causal directa. La abeja concentra el néctar con enzimas y lo
                estabiliza por deshidratación. Frente al azúcar refinada —molienda,
                clarificación, centrifugación, decoloración—, la miel cruda es un alimento sin
                etapas industriales.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    <th className="py-3 pr-4 font-normal">Parámetro</th>
                    <th className="py-3 pr-4 font-normal text-accent-text">Miel cruda</th>
                    <th className="py-3 font-normal">Azúcar refinada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {ig && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">Índice glucémico (referencia)</td>
                      <td className="py-4 pr-4 text-accent-text">~55</td>
                      <td className="py-4 text-foreground">65</td>
                    </tr>
                  )}
                  {enzimas && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">Enzimas activas</td>
                      <td className="py-4 pr-4 text-accent-text">Diastasa, invertasa, GOx</td>
                      <td className="py-4 text-foreground">0</td>
                    </tr>
                  )}
                  {h2o2 && (
                    <tr>
                      <td className="py-4 pr-4 text-muted-foreground">Acción antibacteriana (contexto)</td>
                      <td className="py-4 pr-4 text-accent-text">Asociada a H₂O₂ y bajo Aw</td>
                      <td className="py-4 text-foreground">No aplica</td>
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

            {/* Propiedades fitoquímicas que no se fabrican */}
            <div className="grid md:grid-cols-2 gap-4 mt-8">
              {[hmf, perfil].filter(Boolean).map((c) => c && (
                <div key={c.id} className="rounded-2xl border border-border/40 bg-card p-6">
                  <h3 className="text-sm font-semibold text-foreground mb-2">{c.titulo}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-left">{c.texto}</p>
                  {c.fuente && (
                    <p className="mt-3 text-[10px] text-muted-foreground/70 font-mono">
                      {c.fuente}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {cmsCienciaItems.length > 0 && (
              <div className="mt-8 space-y-4">
                <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text">
                  Evidencia y Ensayos Registrados
                </span>
                <div className="grid md:grid-cols-2 gap-4">
                  {cmsCienciaItems.map((item, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/40 bg-card p-6">
                      {item.categoria && (
                        <span className="text-[0.65rem] uppercase tracking-wider text-accent-text block mb-2">
                          {item.categoria}
                        </span>
                      )}
                      <h3 className="text-sm font-semibold text-foreground mb-2">{item.titulo}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed text-left">{item.texto}</p>
                      {item.fuente && (
                        <p className="mt-3 text-[10px] text-muted-foreground/70 font-mono">{item.fuente}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* ── EJE 03: Biblioteca de Floraciones Nativas ── */}
          <section className="border-t border-border/40 pt-16">
            <div className="mb-10">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Eje 03 · Botánica Melífera
              </span>
              <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] font-light text-foreground">
                Biblioteca de Floraciones del Bosque Nativo
              </h2>
              <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left">
                El bosque nativo del sur de Chile no florece todo a la vez: sigue una cadencia
                estacional estricta. Cada miel es la huella digital de una floración en el tiempo.
                La regeneración biocultural protege esta sucesión para que las abejas jamás sufran
                vacíos nutricionales ni dependan de jarabes industriales.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {FLORACIONES_NATIVAS.map((f) => (
                <article
                  key={f.key}
                  className="rounded-3xl border border-border/60 bg-card p-7 flex flex-col justify-between space-y-6 hover:border-accent/40 transition-colors"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-2xl font-semibold text-foreground">
                          {f.nombre}
                        </h3>
                        <p className="text-xs italic text-accent-text font-serif">
                          {f.nombreCientifico}
                        </p>
                      </div>
                      <span className={`text-[10px] px-3 py-1 rounded-full font-mono uppercase tracking-wider border ${f.colorBadge}`}>
                        {f.key}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {f.tagline}
                    </p>

                    <div>
                      <p className="text-[0.65rem] uppercase tracking-wider text-muted-foreground font-bold mb-1.5 flex items-center gap-1.5">
                        <Flower2 size={12} className="text-accent-text" />
                        Notas de cata
                      </p>
                      <ul className="flex flex-wrap gap-1.5">
                        {f.cata.map((c) => (
                          <li
                            key={c}
                            className="text-xs px-2.5 py-1 rounded-full bg-surface-sunken border border-border/50 text-foreground/80"
                          >
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2 pt-2 text-xs border-t border-border/30">
                      <p className="text-foreground/90 leading-relaxed">
                        <strong className="text-foreground font-medium">Perfil sensorial: </strong>
                        {f.perfil}
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        <strong className="text-foreground font-medium">Aporte a la regeneración: </strong>
                        {f.aporteRegeneracion}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-mono text-accent-text">{f.temporada}</span>
                    <Link
                      href="/catalogo"
                      className="text-xs text-foreground hover:text-accent-text transition-colors underline underline-offset-4"
                    >
                      Explorar recolecciones →
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ── EJE 04: Contabilidad Biofísica de Regeneración y CO₂ ── */}
          <section id="metodologia" className="border-t border-border/40 pt-16">
            <div className="mb-10">
              <span className="block text-[0.65rem] tracking-[0.4em] uppercase text-accent-text mb-2">
                Eje 04 · Contabilidad Biofísica
              </span>
              <h2 className="font-display text-[clamp(1.75rem,5.5vw,2.75rem)] font-light text-foreground">
                Cálculo Referencial de CO₂ y Regeneración
              </h2>
              <p className="mt-4 text-muted-foreground max-w-3xl leading-relaxed text-left">
                El impacto ecológico no debe ser una promesa abstracta ni un certificado comercial opaco.
                Modelamos la relación entre cada gramaje de miel recolectada, el CO₂ evitado respecto al azúcar
                industrial y la custodia activa de árboles nativos en el archipiélago de Chiloé.
              </p>
            </div>

            {/* Equivalencias por gramaje de producto */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="rounded-2xl border border-border/60 bg-surface-raised p-6 space-y-2">
                <div className="flex items-center gap-2 text-accent-text text-xs uppercase tracking-wider font-semibold">
                  <Scale size={14} />
                  <span>Frasco 500 g</span>
                </div>
                <p className="font-display text-2xl font-light text-foreground">
                  ~{IMPACTO_COEFICIENTES.co2_evitado_kg_por_frasco_500g} kg CO₂e
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Emisiones evitadas frente al ciclo de refinería, centrifugación química y transporte del azúcar industrial.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-surface-raised p-6 space-y-2">
                <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-wider font-semibold">
                  <Leaf size={14} />
                  <span>1 Kilogramo Miel</span>
                </div>
                <p className="font-display text-2xl font-light text-foreground">
                  ~{IMPACTO_COEFICIENTES.co2_evitado_kg_por_kg_miel} kg CO₂e
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Coeficiente conservador por kg de miel cruda recolectada en bosque nativo sin molienda mecánica ni aditivos.
                </p>
              </div>

              <div className="rounded-2xl border border-border/60 bg-surface-raised p-6 space-y-2">
                <div className="flex items-center gap-2 text-accent-text text-xs uppercase tracking-wider font-semibold">
                  <TreePine size={14} />
                  <span>Custodia por Árbol</span>
                </div>
                <p className="font-display text-2xl font-light text-foreground">
                  ~{IMPACTO_COEFICIENTES.co2_ton_por_arbol} t CO₂e
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Secuestro estimado en biomasa leñosa por individuo nativo custodiado y enriquecido en el Predio Pureo.
                </p>
              </div>
            </div>

            {/* Métricas en vivo del ecosistema */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 shadow-sm mb-10">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-xl font-light text-foreground">
                    Estado del Ecosistema en Vivo
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Territorio: {IMPACTO_TERRITORIO}
                  </p>
                </div>
                <span className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-accent/10 text-accent-text border border-accent/20">
                  v{IMPACTO_METODOLOGIA_VERSION}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Metric label="Árboles en el ecosistema" value={m.arboles_total.toLocaleString('es-CL')} />
                <Metric
                  label="CO₂ capturado estimado"
                  value={co2CapturadoAnual != null ? `${co2CapturadoAnual.toLocaleString('es-CL')} kg` : '—'}
                />
                <Metric
                  label="CO₂ emitido logística + producción"
                  value={co2EmitidoAnual != null ? `${co2EmitidoAnual.toLocaleString('es-CL')} kg` : '—'}
                />
                <Metric label="Índice de Regeneración (IRR)" value={irrCalculado != null ? String(irrCalculado) : '—'} />
              </div>

              <p className="mt-6 text-xs text-muted-foreground leading-relaxed text-left border-t border-border/30 pt-4">
                {irrCalculado != null
                  ? `IRR = ${co2CapturadoAnual?.toLocaleString('es-CL') ?? '—'} kg capturado / ${co2EmitidoAnual?.toLocaleString('es-CL') ?? '—'} kg emitido = ${irrCalculado}. Un valor superior a 1.0 documenta una huella neta regenerativa.`
                  : 'Datos de emisión en proceso de consolidación: publicamos el indicador cuando existe registro efectivo verificado.'}
              </p>
            </div>

            {/* Metodología abierta: Fórmulas y Fuentes */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border/50 bg-surface-sunken p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent-text">
                  <Sparkles size={14} />
                  <span>Fórmulas Matemáticas Abiertas</span>
                </div>
                <ul className="space-y-3 text-xs font-mono text-muted-foreground">
                  <li className="p-3 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground block font-sans font-medium text-[11px] mb-1">
                      Secuestro por árbol nativo:
                    </span>
                    {metodo.formulas.co2_ton_plantacion}
                  </li>
                  <li className="p-3 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground block font-sans font-medium text-[11px] mb-1">
                      Índice de Regeneración Relativa (IRR):
                    </span>
                    {metodo.formulas.irr_simplificado}
                  </li>
                  <li className="p-3 rounded-xl bg-card border border-border/40">
                    <span className="text-foreground block font-sans font-medium text-[11px] mb-1">
                      Emisiones evitadas por frasco 500 g:
                    </span>
                    {metodo.formulas.co2_frasco_500g}
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-border/50 bg-surface-sunken p-6 space-y-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                  <BookOpen size={14} />
                  <span>Fuentes Bibliográficas de Respaldo</span>
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

            {/* Sub-eje Biofísico: Pecoreo, Bosque Maduro y Horizonte 2026–2027 */}
            <div className="mt-8 rounded-3xl border border-border/70 bg-surface-raised p-6 sm:p-8 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-accent-text font-bold">
                  <Leaf size={14} />
                  <span>Modelación Biofísica de Pecoreo & Polinización Nativa</span>
                </div>
                <h3 className="font-display text-2xl font-light text-foreground">
                  Transformación Néctar-Miel y Capacidad de Carga del Bosque
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
                  En el núcleo analítico de Enjambre Legado (<code className="text-foreground">@enjambre/pricing</code>),
                  hemos modelado la estequiometría de pecoreo de <em>Apis mellifera</em> en el dosel nativo de Chiloé:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl border border-border/50 bg-card/60 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent-text">
                    Néctar y Concentración
                  </span>
                  <p className="font-mono text-[11px] text-foreground">
                    M_néctar = kg × (0.82 / 0.30)
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Considera 82% de azúcares en miel madura frente al 30% de sólidos solubles en néctar de flora nativa.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border/50 bg-card/60 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                    Superficie Vital Custodiada
                  </span>
                  <p className="font-mono text-[11px] text-foreground">
                    Área = (kg / 20) × 5.000 m²
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Basado en un rendimiento conservador de 20 kg/colmena y 0,5 ha de bosque maduro asignado como radio vital.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-border/50 bg-card/60 space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-accent-text">
                    Vuelo y Fecundación
                  </span>
                  <p className="font-mono text-[11px] text-foreground">
                    Flores = M_néctar / 1.2 mg
                  </p>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    Secreción media de 1,2 mg néctar/flor y tasa de polinización cruzada (+40% semillas viables al banco de suelo).
                  </p>
                </div>
              </div>

              {/* Transparencia y honestidad metodológica 2026-2027 */}
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-5 sm:p-6 space-y-2.5">
                <div className="flex items-center gap-2 text-accent-text font-semibold text-xs tracking-wider uppercase">
                  <ShieldCheck size={16} />
                  <span>Horizonte Metodológico 2026–2027 · Medición y Calibración en Terreno</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  <strong>Principio de honestidad radical:</strong> Aunque esta modelación matemática biofísica está
                  completamente programada y disponible en el motor del monorepo, <strong>no se encuentra activa como
                  sello comercial cerrado ni promesa certificada en frascos individuales</strong>. Durante las temporadas
                  <strong> 2026 y 2027</strong> estamos llevando a cabo la medición empírica exhaustiva, el conteo de floraciones
                  y la trazabilidad georreferenciada de árboles y apiarios en el Predio Pureo y predios asociados de Chiloé.
                  Solo publicaremos estas equivalencias unitarias al consumidor una vez concluida la validación empírica en terreno.
                </p>
              </div>
            </div>
          </section>

          {/* ── Límites y Ley 20.606 ── */}
          <section className="rounded-3xl border border-border/60 bg-surface-raised p-8 space-y-4">
            <div className="flex items-center gap-2 text-warning text-sm font-semibold">
              <AlertTriangle size={18} />
              <h2 className="font-display text-xl font-medium text-foreground">
                Límites y Responsabilidad Científica (Léelos)
              </h2>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground leading-relaxed text-left">
              {IMPACTO_LIMITES.map((l) => (
                <li key={l.id}>· {l.texto}</li>
              ))}
              <li>· Estas notas proporcionan contexto botánico y bibliográfico de composición; no constituyen rotulado terapéutico MINSAL ni promesas médicas.</li>
              <li>· El IRR es un cociente biofísico de transparencia interna y no debe confundirse con un bono de carbono transferible ni un Análisis de Ciclo de Vida (ACV) corporativo.</li>
            </ul>
          </section>

          <p className="text-xs text-muted-foreground px-2 leading-relaxed text-left">{DISCLAIMER_LEY_20606}</p>
          <p className="sr-only">Afirmaciones publicadas: {claims.map((c) => c.id).join(', ')}</p>
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