import Link from 'next/link';
import { Trees, Leaf, Bug, ArrowRight } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';

export const metadata = {
  title: 'Legado del bosque · Impacto',
};

export default async function ImpactoPage() {
  const m = await getEcosystemMetrics();

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">

          <div className="text-center mb-20">
            <span className="block text-[0.65rem] tracking-[0.5em] uppercase text-accent mb-6">Impacto</span>
            <h1 className="font-display text-5xl md:text-7xl font-light text-foreground mb-6">
              Legado del bosque
            </h1>
            <p className="font-display italic text-lg text-muted-foreground max-w-lg mx-auto">
              Cada compra financia árboles y sostiene apiarios en bosque nativo. El impacto supera la huella.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-20">
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-accent mb-4 flex justify-center"><Trees className="w-7 h-7" /></div>
              <p className="font-display text-3xl font-light text-foreground mb-2">{m.arboles_total.toLocaleString('es-CL')}+</p>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Árboles plantados</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-accent mb-4 flex justify-center"><Leaf className="w-7 h-7" /></div>
              <p className="font-display text-3xl font-light text-foreground mb-2">~{m.co2_ton.toLocaleString('es-CL')} ton</p>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">CO₂ capturado</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-accent mb-4 flex justify-center"><Bug className="w-7 h-7" /></div>
              <p className="font-display text-3xl font-light text-foreground mb-2">{m.colmenas_total}</p>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Colmenas custodiadas</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-accent mb-4 flex justify-center"><Trees className="w-7 h-7" /></div>
              <p className="font-display text-3xl font-light text-foreground mb-2">{m.especies_nativas}</p>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Especies nativas</p>
            </div>
          </div>

          <div className="bg-surface-raised/50 border border-border/30 rounded-xl p-10 mb-16">
            <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/50 mb-6">IRR del ecosistema</p>
            {m.irr_ecosistema && m.irr_ecosistema > 1 ? (
              <>
                <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide mb-4">
                  IRR {m.irr_ecosistema} · Impacto &gt; Huella
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
                  {m.anos_legado} de reforestación nativa en Pureo, Chiloé. El bosque captura {m.irr_ecosistema}× más CO₂ del que la cadena productiva emite.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide mb-4">
                  Miel de bosque + Árboles plantados &gt; Huella de producción
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
                  {m.anos_legado} de reforestación nativa en Pureo, Chiloé. Cada árbol captura entre 10 y 25 kg de CO₂/año. Nuestro IRR se calculará cuando los registros de emisión estén completos.
                </p>
              </>
            )}
            <Link href="/ciencia" className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-accent hover:text-accent/80 transition-colors">
              Ver metodología completa <ArrowRight size={12} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="border-t border-border pt-8">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-4">Reforestación</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {m.especies_nativas} especies nativas — Ulmo, Tepú, Tineo, Avellano, Canelo — plantadas en {m.sectores} sectores de Pureo, Chiloé. Cada árbol está registrado con coordenadas, especie y estado.
              </p>
            </div>
            <div className="border-t border-border pt-8">
              <p className="text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-4">Polinización</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {m.colmenas_total} colmenas activas en el bosque nativo generan polinización de especies que sostienen la biodiversidad del ecosistema. La actividad apícola no solo no emite: activa mecanismos de captura positiva mediante la salud del bosque.
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-accent hover:text-accent/80 transition-colors"
            >
              ← Explorar creaciones
            </Link>
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
