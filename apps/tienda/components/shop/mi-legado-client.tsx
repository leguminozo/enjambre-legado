'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { Package, Clock, Leaf, ChevronRight, TreePine, Droplets, Trees, Bug, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import { GuardianStampsSection } from '@/components/shop/guardian-stamps-section';
import {
  REPOSICION_PATH,
} from '@/lib/shop/store-routes';

interface Order {
  id: string;
  created_at: string;
  total: number;
  estado: string;
  pedido_items: Array<{
    cantidad: number;
    productos: {
      nombre: string;
      precio: number;
    };
  }>;
}

interface ClaimPoint {
  id: string;
  ciclos: {
    tipo: string;
    estado: string;
  };
}

interface MiLegadoClientProps {
  user: TiendaUserProfile | null;
  tierData: {
    tier: string;
    ciclos_historicos: number;
  } | null;
  hiveData: {
    name: string;
    estado: string;
    peso_kg: number;
  } | null;
  orders: Order[];
  claimPoints: ClaimPoint[];
  ecosystemMetrics: EcosystemMetrics;
}

export function MiLegadoClient({ user, tierData, hiveData, orders, claimPoints, ecosystemMetrics }: MiLegadoClientProps) {

  useEffect(() => {
    gsap.from('.vanguard-data', {
      opacity: 0,
      y: 20,
      duration: 2,
      stagger: 0.3,
      ease: 'power2.out'
    });
  }, []);

  const totalOrders = orders?.length || 0;
  const totalSpent = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  const azucarSustituida = Math.round(totalSpent / 4500 * 0.8);
  const arbolesPersonal = user?.arboles_personal ?? 0;
  const co2PersonalEstimado = arbolesPersonal * 15;
  const irrEstimado = co2PersonalEstimado > 0
    ? (co2PersonalEstimado / Math.max(totalSpent * 0.0001, 1)).toFixed(1)
    : '—';

  return (
    <div className="w-full">
      <div className="relative mb-20">

        <div className="relative z-10 max-w-4xl w-full mx-auto">
          <div className="text-center mb-4">
            <p className="text-[0.6rem] tracking-[0.2em] text-success/60 italic">
              Gracias por custodiar este bosque con nosotros. Este panel existe para recordar lo que ya hiciste bien.
            </p>
          </div>
          <div className="text-center mb-16">
            <span className="vanguard-data block text-[0.7rem] tracking-[0.5em] uppercase text-accent mb-6">
              Mi Legado
            </span>
            <h1 className="vanguard-data font-display text-5xl md:text-7xl font-light text-foreground mb-4">
              {(user?.full_name) || 'Guardián del Bosque'}
            </h1>
            <p className="vanguard-data font-display italic text-xl text-muted-foreground">
              {tierData?.tier || 'OBRERA'} · {tierData?.ciclos_historicos || 0} Ciclos Acumulados
            </p>
          </div>

          {/* Entrelazado: hub → herramientas del rol cliente */}
          <div className="vanguard-data flex flex-wrap justify-center gap-2 sm:gap-3 mb-12">
            {[
              { href: '/perfil/pedidos', label: 'Pedidos' },
              { href: REPOSICION_PATH, label: 'Reposición' },
              { href: '/perfil/resenas', label: 'Reseñas' },
              { href: '/perfil/trazabilidad', label: 'Trazabilidad' },
              { href: '/perfil/guardian', label: 'Guardián' },
              { href: '/perfil/logros', label: 'Logros' },
              { href: '/perfil/canje', label: 'Canje' },
              { href: '/catalogo', label: 'Catálogo' },
              { href: '/ciencia', label: 'Metodología' },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/60 px-3 py-1.5 text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground hover:text-accent hover:border-accent/40 transition-colors"
              >
                {item.label}
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <Link
              href="/perfil/pedidos"
              className="vanguard-data bg-card border border-border rounded-3xl p-8 text-center hover:border-accent/40 transition-colors block"
            >
              <Package className="w-8 h-8 text-accent mx-auto mb-4" />
              <div className="text-4xl font-display text-foreground mb-2">{totalOrders}</div>
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Pedidos</div>
            </Link>
            <Link
              href={REPOSICION_PATH}
              className="vanguard-data bg-card border border-border rounded-3xl p-8 text-center hover:border-accent/40 transition-colors block"
            >
              <Leaf className="w-8 h-8 text-accent mx-auto mb-4" />
              <div className="text-4xl font-display text-foreground mb-2">${totalSpent.toLocaleString('es-CL')}</div>
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Legado Acumulado</div>
            </Link>
            <Link
              href="/perfil/guardian"
              className="vanguard-data bg-card border border-border rounded-3xl p-8 text-center hover:border-accent/40 transition-colors block"
            >
              <TreePine className="w-8 h-8 text-accent mx-auto mb-4" />
              <div className="text-4xl font-display text-foreground mb-2">{arbolesPersonal}</div>
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">m² Regenerados</div>
            </Link>
          </div>

          <div className="space-y-24">
            {/* ── MI IMPACTO ── */}
            <div className="vanguard-data border-t border-border pt-12">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Mi Impacto</span>
              <p className="text-sm text-muted-foreground italic mb-12 max-w-lg">
                Tu contribución directa a la regeneración. Cada número es rastreable y demostrable por triangulación de papers y datos locales de Chiloé.
              </p>

              <div className="grid md:grid-cols-4 gap-6 mb-12">
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
                  <p className="font-display text-3xl font-light text-foreground mb-2">{irrEstimado}</p>
                  <p className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">IRR personal</p>
                  {irrEstimado !== '—' && Number(irrEstimado) > 1 && (
                    <p className="text-[0.5rem] text-success/70 mt-1">Impacto &gt; Huella</p>
                  )}
                </div>
              </div>

              <div className="bg-surface-raised/50 border border-border/30 rounded-xl p-10 mb-12">
                <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/50 mb-6">Tu IRR personal</p>
                {irrEstimado !== '—' && Number(irrEstimado) > 1 ? (
                  <>
                    <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide mb-4">
                      IRR {irrEstimado} · Impacto &gt; Huella
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                      Tu consumo genera {irrEstimado}× más captura de carbono que emisión. Cada pedido financia árboles en Pureo, Chiloé, y sostiene apiarios entre Quemchi, Molulco y Pureo-Quelen.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-2xl md:text-3xl font-light text-foreground tracking-wide mb-4">
                      Tu impacto está en camino
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
                      Con cada pedido, financias árboles y sostienes apiarios en bosque nativo entre Quemchi, Molulco y Pureo-Quelen. Tu IRR personal se calculará con tus primeros pedidos.
                    </p>
                  </>
                )}
              </div>

              <div className="bg-surface-raised/50 border border-accent/20 rounded-xl p-10">
                <p className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-accent/50 mb-6">Ecosistema que custodias</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Tu legado se suma al ecosistema colectivo de {ecosystemMetrics.anos_legado} en Chiloé:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center py-4">
                    <p className="font-display text-2xl font-light text-foreground">{ecosystemMetrics.arboles_total.toLocaleString('es-CL')}+</p>
                    <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">Árboles totales</p>
                  </div>
                  <div className="text-center py-4">
                    <p className="font-display text-2xl font-light text-foreground">~{ecosystemMetrics.co2_ton.toLocaleString('es-CL')} ton</p>
                    <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">CO₂ capturado</p>
                  </div>
                  <div className="text-center py-4">
                    <p className="font-display text-2xl font-light text-foreground">{ecosystemMetrics.colmenas_total}</p>
                    <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">Colmenas</p>
                  </div>
                  <div className="text-center py-4">
                    <p className="font-display text-2xl font-light text-foreground">{ecosystemMetrics.especies_nativas}</p>
                    <p className="text-[0.55rem] uppercase tracking-[0.2em] text-muted-foreground">Especies nativas</p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-border/20 text-center flex flex-wrap justify-center gap-4">
                  <Link href="/perfil/guardian" className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-accent hover:text-accent/80 transition-colors">
                    Panel guardián <ArrowUpRight size={12} />
                  </Link>
                  <Link href="/ciencia" className="inline-flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors">
                    Ver metodología completa <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* ── COLMENA ── */}
            <div className="vanguard-data border-t border-border pt-12">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Estado de tu Colmena</span>
              {hiveData ? (
                <div className="flex flex-col md:flex-row justify-between items-baseline gap-8">
                  <div>
                    <h3 className="font-display text-3xl font-light mb-2">{hiveData.name}</h3>
                    <p className="text-sm text-muted-foreground">Sector Pureo · {hiveData.estado === 'optima' ? 'Ritmo Vital Estable' : 'Atención Requerida'}</p>
                  </div>
                  <div className="text-right">
                    <span className="block font-display italic text-4xl text-foreground">{hiveData.peso_kg || '--'} kg</span>
                    <span className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Peso Actual</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-secondary/30 rounded-3xl border border-border border-dashed">
                  <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground italic mb-6">
                    Aún no has vinculado tu legado a una colmena específica.
                  </p>
                  <a href="/catalogo" className="inline-flex items-center gap-2 text-accent text-[0.65rem] uppercase tracking-[0.2em] hover:gap-4 transition-all">
                    Explorar Suscripciones <ChevronRight size={16} />
                  </a>
                </div>
              )}
            </div>

            {/* ── PUNTOS DE RECLAMO ── */}
            <div className="vanguard-data border-t border-border pt-12">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Puntos de Reclamo</span>
              {claimPoints && claimPoints.length > 0 ? (
                <div className="space-y-4">
                  {claimPoints.map((point) => (
                    <div key={point.id} className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl">
                      <div>
                        <div className="text-foreground font-display text-lg">{point.ciclos?.tipo ?? 'Ciclo'}</div>
                        <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{point.ciclos?.estado ?? 'activo'}</div>
                      </div>
                      <Clock className="w-5 h-5 text-accent" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  No tienes puntos de reclamo pendientes
                </p>
              )}
            </div>

            {/* ── PEDIDOS ── */}
            <div className="vanguard-data border-t border-border pt-12">
              <div className="flex items-center justify-between mb-8 gap-4">
                <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent">Pedidos Recientes</span>
                <Link
                  href="/perfil/pedidos"
                  className="inline-flex items-center gap-1 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-colors"
                >
                  Ver todos <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <Link
                      key={order.id}
                      href="/perfil/pedidos"
                      className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl hover:border-accent/40 transition-colors"
                    >
                      <div>
                        <div className="text-foreground font-display text-lg">{new Date(order.created_at).toLocaleDateString('es-CL')}</div>
                        <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                          {order.pedido_items?.[0]?.productos?.nombre || 'Varios'} · {order.pedido_items?.[0]?.cantidad || 0} un.
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display italic text-foreground">${order.total?.toLocaleString('es-CL') || '0'}</div>
                        <div className="text-[0.6rem] uppercase tracking-[0.2em] text-accent">{order.estado}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Sin pedidos recientes
                </p>
              )}
            </div>
          </div>

          <div className="vanguard-data mt-20">
            <GuardianStampsSection />
          </div>
        </div>
      </div>
    </div>
  );
}
