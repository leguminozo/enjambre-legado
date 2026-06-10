import Link from 'next/link';
import type { Metadata } from 'next';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://obrerayzangano.com';

export const metadata: Metadata = {
  title: 'La ciencia del bosque · Enjambre Legado',
  description:
    'Miel cruda vs azúcar refinada: índice glicémico, enzimas activas y el Índice de Regeneración Relativa (IRR). La ciencia detrás de cada frasco.',
  alternates: { canonical: `${SITE_URL}/ciencia` },
  openGraph: {
    title: 'La ciencia del bosque · La Obrera y el Zángano',
    description:
      'Miel cruda vs azúcar refinada: índice glicémico, enzimas activas y el Índice de Regeneración Relativa (IRR).',
    url: `${SITE_URL}/ciencia`,
    type: 'article',
    locale: 'es_CL',
    siteName: 'La Obrera y el Zángano',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'La ciencia del bosque · La Obrera y el Zángano',
    description:
      'Miel cruda vs azúcar refinada: índice glicémico, enzimas activas y el Índice de Regeneración Relativa (IRR).',
  },
};

export default async function CienciaPage() {
  const m = await getEcosystemMetrics();

  const co2CapturadoAnual = m.irr_ecosistema ? m.co2_capturado_kg : m.arboles_total * 15;
  const co2EmitidoEstimado = m.co2_emitido_kg > 0 ? m.co2_emitido_kg : 5200;
  const irrCalculado = m.irr_ecosistema ?? Number((co2CapturadoAnual / co2EmitidoEstimado).toFixed(2));

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-screen bg-background">
        {/* ── Hero ── */}
        <section className="relative py-32 px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <span className="block text-[0.65rem] tracking-[0.5em] uppercase text-accent mb-8">Ciencia</span>
            <h1 className="font-display text-5xl md:text-7xl font-light text-foreground mb-6">
              La ciencia<br />del bosque
            </h1>
            <p className="font-display italic text-xl text-muted-foreground max-w-lg mx-auto">
              Cada frasco condensa un proceso biofísico observable. Estas son las ecuaciones que lo demuestran.
            </p>
          </div>
        </section>

        {/* ── E solar → miel ── */}
        <section className="py-24 px-4 border-t border-border/20">
          <div className="max-w-4xl mx-auto grid md:grid-cols-[1fr_1fr] gap-16 items-center">
            <div>
              <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent mb-6">Fórmula 01</span>
              <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-6">
                Energía solar → Miel
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                La miel no es un producto fabricado. Es energía solar transformada en biomolécula nutritiva por una cadena causal directa: la planta convierte fotones en carbohidratos, la abeja los concentra con enzimas, y el resultado es miel virgen cruda.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A diferencia del azúcar refinada —que requiere molienda, clarificación, centrifugación y decoloración—, la miel se estabiliza por deshidratación enzimática. Cero etapas industriales.
              </p>
            </div>
            <div className="bg-surface-raised border border-border/30 rounded-xl p-10 text-center">
              <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/50 mb-6">Vector de transferencia</p>
              <p className="font-mono text-lg md:text-xl text-foreground leading-loose tracking-wide">
                E<sub>sol</sub> → C<sub>n</sub>H<sub>2n</sub>O<sub>n</sub> → fructosa + glucosa → miel virgen
              </p>
              <div className="mt-8 pt-6 border-t border-border/20">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-muted-foreground uppercase tracking-wider">
                      <th className="pb-3 font-medium" />
                      <th className="pb-3 font-medium">Miel virgen</th>
                      <th className="pb-3 font-medium">Azúcar refinada</th>
                    </tr>
                  </thead>
                  <tbody className="text-foreground/70">
                    <tr className="border-t border-border/10">
                      <td className="py-3 text-muted-foreground">CO₂ en producción</td>
                      <td className="py-3 text-accent">~0.5 kg/kg</td>
                      <td className="py-3 text-destructive/70">~3.2 kg/kg</td>
                    </tr>
                    <tr className="border-t border-border/10">
                      <td className="py-3 text-muted-foreground">Índice glicémico</td>
                      <td className="py-3 text-accent">55–65</td>
                      <td className="py-3 text-destructive/70">65–100</td>
                    </tr>
                    <tr className="border-t border-border/10">
                      <td className="py-3 text-muted-foreground">Enzimas activas</td>
                      <td className="py-3 text-accent">Diastasa, invertasa, GOx</td>
                      <td className="py-3 text-destructive/70">0</td>
                    </tr>
                    <tr className="border-t border-border/10">
                      <td className="py-3 text-muted-foreground">Acción antimicrobiana</td>
                      <td className="py-3 text-accent">H₂O₂, péptidos, bajo Aw</td>
                      <td className="py-3 text-destructive/70">Ninguna</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* ── IRR ── */}
        <section className="py-24 px-4 border-t border-border/20 bg-surface-raised/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent mb-6">Fórmula 02</span>
              <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-6">
                Índice de Regeneración Relativa
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-16">
              <div>
                <div className="bg-card border border-border/30 rounded-xl p-10 text-center mb-8">
                  <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/50 mb-6">IRR</p>
                  <p className="font-mono text-2xl md:text-3xl text-foreground tracking-wide">
                    CO₂ capturado / CO₂ emitido
                  </p>
                  {m.irr_ecosistema && m.irr_ecosistema > 1 && (
                    <p className="mt-6 font-display text-4xl font-light text-success">
                      {m.irr_ecosistema}
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  El IRR mide si tu consumo de miel genera más captura de carbono que emisión. Un IRR mayor a 1 significa impacto positivo neto: el bosque asociado al apiario captura más CO₂ del que la producción y logística emiten.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Nuestros apiarios en Pureo, Chiloé, están rodeados de {m.anos_legado} de reforestación nativa. {m.arboles_total.toLocaleString('es-CL')} árboles de {m.especies_nativas} especies capturan entre 10 y 25 kg de CO₂/año.
                </p>
              </div>
              <div className="bg-card border border-border/30 rounded-xl p-10">
                <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/50 mb-6">Cálculo del ecosistema</p>
                <div className="space-y-4 text-sm text-foreground/70">
                  <div className="flex justify-between border-b border-border/10 pb-3">
                    <span>Árboles en el ecosistema</span>
                    <span className="text-accent font-mono">{m.arboles_total.toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-3">
                    <span>CO₂ capturado/año (prom. 15 kg/árbol)</span>
                    <span className="text-accent font-mono">{co2CapturadoAnual.toLocaleString('es-CL')} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-border/10 pb-3">
                    <span>CO₂ emitido producción + logística</span>
                    <span className="text-destructive/70 font-mono">{co2EmitidoEstimado.toLocaleString('es-CL')} kg</span>
                  </div>
                  <div className="flex justify-between pt-3">
                    <span className="text-foreground font-medium">IRR</span>
                    <span className={`font-mono text-lg font-bold ${irrCalculado > 1 ? 'text-success' : 'text-muted-foreground'}`}>
                      {irrCalculado}
                    </span>
                  </div>
                </div>
                <p className="mt-6 text-xs text-muted-foreground italic">
                  IRR = {co2CapturadoAnual.toLocaleString('es-CL')} / {co2EmitidoEstimado.toLocaleString('es-CL')} = {irrCalculado}. {irrCalculado > 1 ? 'Cada kg de miel producida en Pureo está respaldado por ' + irrCalculado + ' kg de CO₂ capturado.' : 'Datos de emisión en proceso de registro.'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Propiedades bioactivas ── */}
        <section className="py-24 px-4 border-t border-border/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent mb-6">Fórmula 03</span>
              <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-6">
                Propiedades que no se fabrican
              </h2>
              <p className="text-sm text-muted-foreground italic max-w-lg mx-auto">
                La miel del bosque húmedo patagónico posee características que la refinación destruye y la industria no puede replicar.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Actividad antimicrobiana',
                  desc: 'Comparable a variedades Manuka en estudios chilenos. Genera peróxido de hidrógeno por acción de glucosa oxidasa, combinado con bajo contenido de agua y péptidos bioactivos.',
                },
                {
                  title: 'Carga enzimática viva',
                  desc: 'Diastasa, invertasa y glucosa oxidasa permanecen activas en miel virgen cruda de baja temperatura. Son marcadores de una miel no procesada; su ausencia indica calentamiento industrial.',
                },
                {
                  title: 'HMF cercano a cero',
                  desc: 'El hidroximetilfurfural (HMF) es un marcador de frescura y ausencia de calor. La miel virgen cruda mantenida a baja temperatura conserva niveles casi nulos, mientras la miel industrial suele superar 40 mg/kg.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-surface-raised border border-border/30 rounded-xl p-8">
                  <h3 className="font-display text-xl font-light text-foreground mb-4">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Perfil irrepetible ── */}
        <section className="py-24 px-4 border-t border-border/20 bg-surface-raised/30">
          <div className="max-w-3xl mx-auto text-center">
            <span className="block text-[0.6rem] tracking-[0.4em] uppercase text-accent mb-6">Denominación de origen</span>
            <h2 className="font-display text-3xl md:text-4xl font-light text-foreground mb-6">
              Un perfil que no se repite
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto mb-8">
              El néctar de Ulmo, Tepú y Olivillo del bosque húmedo patagónico produce un perfil organoléptico imposible de replicar fuera de Chiloé. No es marketing: es biogeografía.
            </p>
            <Link href="/catalogo" className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-accent hover:text-accent/80 transition-colors">
              Explorar creaciones →
            </Link>
          </div>
        </section>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
