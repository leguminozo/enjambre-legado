import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Trees, Leaf, Bug, ArrowRight, TreePine } from 'lucide-react';
import { ShopHeader } from '@/components/shop/shop-header';
import { ShopFooter } from '@/components/shop/shop-footer';
import { StoreShell } from '@/components/shop/store-shell';
import { createClient } from '@/utils/supabase/server';
import { getEcosystemMetrics } from '@/lib/shop/ecosystem-metrics';

export const metadata = {
  title: 'Mi Impacto · Legado del bosque',
};

export default async function ImpactoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const [profileData, tierData, subConfig, ordersData, m] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_tier_view').select('*').eq('user_id', user.id).single(),
    supabase.from('suscriptor_config').select('*, colmenas(*)').eq('user_id', user.id).single(),
    supabase.from('pedidos').select('total').eq('user_id', user.id),
    getEcosystemMetrics(),
  ]);

  const profile = profileData.data as Record<string, unknown> | null;
  const tier = tierData.data as { tier: string; ciclos_historicos: number } | null;
  const hive = subConfig.data?.colmenas as { name: string; estado: string; peso_kg: number } | null;
  const orders = ordersData.data as Array<{ total: number }> | null;

  const totalSpent = orders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
  const totalOrders = orders?.length || 0;
  const arbolesPersonal = (profile?.arboles_personal as number) || 0;
  const azucarSustituida = Math.round(totalSpent / 4500 * 0.8);
  const co2PersonalEstimado = arbolesPersonal * 15;
  const irrEstimado = co2PersonalEstimado > 0
    ? (co2PersonalEstimado / Math.max(totalSpent * 0.0001, 1)).toFixed(1)
    : null;

  return (
    <StoreShell>
      <ShopHeader />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">

          <div className="text-center mb-20">
            <span className="block text-[0.65rem] tracking-[0.5em] uppercase text-accent mb-6">Mi Impacto</span>
            <h1 className="font-display text-5xl md:text-7xl font-light text-foreground mb-6">
              Legado del bosque
            </h1>
            <p className="font-display italic text-lg text-muted-foreground max-w-lg mx-auto">
              Tu contribución directa a la regeneración del ecosistema. Cada número es rastreable.
            </p>
            {tier && (
              <p className="mt-4 font-display italic text-xl text-accent">
                {tier.tier} · {tier.ciclos_historicos} Ciclos Acumulados
              </p>
            )}
          </div>

          <div className="grid md:grid-cols-4 gap-6 mb-20">
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-accent mb-4 flex justify-center"><Trees className="w-7 h-7" /></div>
              <p className="font-display text-3xl font-light text-foreground mb-2">{arbolesPersonal}</p>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">m² Regenerados</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-accent mb-4 flex justify-center"><Leaf className="w-7 h-7" /></div>
              <p className="font-display text-3xl font-light text-foreground mb-2">{co2PersonalEstimado > 0 ? `~${co2PersonalEstimado}` : '—'}</p>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">kg CO₂ capturado</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-accent mb-4 flex justify-center"><Bug className="w-7 h-7" /></div>
              <p className="font-display text-3xl font-light text-foreground mb-2">{azucarSustituida > 0 ? `~${azucarSustituida}` : '—'}</p>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">g Azúcar sustituida</p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="text-accent mb-4 flex justify-center"><TreePine className="w-7 h-7" /></div>
              <p className="font-display text-3xl font-light text-foreground mb-2">{totalOrders}</p>
              <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Pedidos</p>
            </div>
          </div>

          <div className="bg-surface-raised/50 border border-border/30 rounded-xl p-10 mb-16">
            <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/50 mb-6">Tu IRR personal</p>
            {irrEstimado && Number(irrEstimado) > 1 ? (
              <>
                <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide mb-4">
                  IRR {irrEstimado} · Impacto &gt; Huella
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
                  Tu consumo genera {irrEstimado}× más captura de carbono que emisión. Cada pedido financia árboles en Pureo, Chiloé, y sostiene apiarios entre Quemchi, Molulco y Pureo-Quelen.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide mb-4">
                  Tu impacto está en camino
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mb-6">
                  Con cada pedido, financias árboles y sostienes apiarios en bosque nativo entre Quemchi, Molulco y Pureo-Quelen. Tu IRR personal se calculará con tus primeros pedidos.
                </p>
              </>
            )}
            <Link href="/ciencia" className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-accent hover:text-accent/80 transition-colors">
              Ver metodología completa <ArrowRight size={12} />
            </Link>
          </div>

          {hive && (
            <div className="border-t border-border pt-12 mb-16">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Tu Colmena</span>
              <div className="flex flex-col md:flex-row justify-between items-baseline gap-8">
                <div>
                  <h3 className="font-display text-3xl font-light mb-2">{hive.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Sector Pureo · {hive.estado === 'optima' ? 'Ritmo Vital Estable' : 'Atención Requerida'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="block font-display italic text-4xl text-foreground">{hive.peso_kg || '--'} kg</span>
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Peso Actual</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-surface-raised/50 border border-accent/20 rounded-xl p-10 mb-16">
            <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/50 mb-6">Ecosistema que custodias</p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Tu legado se suma al ecosistema colectivo de {m.anos_legado} en Chiloé:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center py-4">
                <p className="font-display text-2xl font-light text-foreground">{m.arboles_total.toLocaleString('es-CL')}+</p>
                <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">Árboles totales</p>
              </div>
              <div className="text-center py-4">
                <p className="font-display text-2xl font-light text-foreground">~{m.co2_ton.toLocaleString('es-CL')} ton</p>
                <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">CO₂ capturado</p>
              </div>
              <div className="text-center py-4">
                <p className="font-display text-2xl font-light text-foreground">{m.colmenas_total}</p>
                <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">Colmenas</p>
              </div>
              <div className="text-center py-4">
                <p className="font-display text-2xl font-light text-foreground">{m.especies_nativas}</p>
                <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">Especies nativas</p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/perfil"
              className="inline-flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-accent hover:text-accent/80 transition-colors"
            >
              ← Volver a Mi Legado
            </Link>
          </div>
        </div>
      </main>
      <ShopFooter />
    </StoreShell>
  );
}
