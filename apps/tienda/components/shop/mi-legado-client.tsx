'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { Package, Clock, Leaf, ChevronRight, TreePine, Droplets, ArrowRight } from 'lucide-react';

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
  user: unknown;
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
}

export function MiLegadoClient({ user, tierData, hiveData, orders, claimPoints }: MiLegadoClientProps) {
  const userData = user as Record<string, unknown> | null;

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
  const co2PersonalEstimado = (userData?.arboles_personal as number) || 0;
  const irrEstimado = co2PersonalEstimado > 0 ? (co2PersonalEstimado * 15 / Math.max(totalSpent * 0.0001, 1)).toFixed(1) : '—';

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
              {(userData?.full_name as string) || 'Guardián del Bosque'}
            </h1>
            <p className="vanguard-data font-display italic text-xl text-muted-foreground">
              {tierData?.tier || 'OBRERA'} · {tierData?.ciclos_historicos || 0} Ciclos Acumulados
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="vanguard-data bg-card border border-border rounded-3xl p-8 text-center">
              <Package className="w-8 h-8 text-accent mx-auto mb-4" />
              <div className="text-4xl font-display text-foreground mb-2">{totalOrders}</div>
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Pedidos</div>
            </div>
            <div className="vanguard-data bg-card border border-border rounded-3xl p-8 text-center">
              <Leaf className="w-8 h-8 text-accent mx-auto mb-4" />
              <div className="text-4xl font-display text-foreground mb-2">${totalSpent.toLocaleString('es-CL')}</div>
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">Legado Acumulado</div>
            </div>
            <div className="vanguard-data bg-card border border-border rounded-3xl p-8 text-center">
              <TreePine className="w-8 h-8 text-accent mx-auto mb-4" />
              <div className="text-4xl font-display text-foreground mb-2">{(userData?.arboles_personal as number) || 0}</div>
              <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">m² Regenerados</div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-20">
            <div className="vanguard-data bg-surface-raised/50 border border-accent/20 rounded-2xl p-6 text-center">
              <p className="text-[0.55rem] uppercase tracking-[0.3em] text-accent/60 mb-2">Azúcar sustituida</p>
              <p className="font-mono text-2xl text-foreground">{azucarSustituida > 0 ? `~${azucarSustituida} g` : '—'}</p>
            </div>
            <div className="vanguard-data bg-surface-raised/50 border border-success/20 rounded-2xl p-6 text-center">
              <p className="text-[0.55rem] uppercase tracking-[0.3em] text-success/60 mb-2">CO₂ capturado asociado</p>
              <p className="font-mono text-2xl text-foreground">{co2PersonalEstimado > 0 ? `~${co2PersonalEstimado * 15} kg` : '—'}</p>
            </div>
            <div className="vanguard-data bg-surface-raised/50 border border-accent/20 rounded-2xl p-6 text-center">
              <p className="text-[0.55rem] uppercase tracking-[0.3em] text-accent/60 mb-2">Tu IRR estimado</p>
              <p className="font-mono text-2xl text-foreground">{irrEstimado}</p>
              {irrEstimado !== '—' && Number(irrEstimado) > 1 && (
                <p className="text-[0.5rem] text-success/70 mt-1">Impacto &gt; Huella</p>
              )}
            </div>
          </div>

          <div className="space-y-24">
          <div className="vanguard-data border-t border-border pt-12">
            <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Mi Impacto</span>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h3 className="font-display text-3xl font-light mb-2">Legado del bosque</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Tu contribución directa a la regeneración. Cada número es rastreable y demostrable por triangulación de papers y datos locales de Chiloé.
                </p>
              </div>
              <Link
                href="/impacto"
                className="inline-flex items-center gap-3 px-8 py-4 border border-accent text-accent text-[0.65rem] uppercase tracking-[0.2em] hover:bg-accent hover:text-accent-foreground transition-all duration-elegant rounded-lg"
              >
                Ver mi impacto <ArrowRight size={14} />
              </Link>
            </div>
          </div>

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

            <div className="vanguard-data border-t border-border pt-12">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Puntos de Reclamo</span>
              {claimPoints && claimPoints.length > 0 ? (
                <div className="space-y-4">
                  {claimPoints.map((point) => (
                    <div key={point.id} className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl">
                      <div>
                        <div className="text-foreground font-display text-lg">{point.ciclos.tipo}</div>
                        <div className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">{point.ciclos.estado}</div>
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

            <div className="vanguard-data border-t border-border pt-12">
              <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-accent mb-8">Pedidos Recientes</span>
              {orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-6 bg-card border border-border rounded-2xl">
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
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  Sin pedidos recientes
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
