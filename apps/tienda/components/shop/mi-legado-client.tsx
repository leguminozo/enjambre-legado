'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Package, Clock, Leaf, ChevronRight, TreePine, Droplets, Trees, Bug, ArrowRight, ArrowUpRight, Wallet, Compass, MapPin, Bell } from 'lucide-react';
import type { EcosystemMetrics } from '@/lib/shop/ecosystem-metrics';
import type { TiendaUserProfile } from '@/lib/shop/user-profile';
import { formatCLP } from '@enjambre/ui';
import {
  REPOSICION_PATH,
} from '@/lib/shop/store-routes';
import { GuardianPowerGrid } from '@/components/perfil/guardian-power-grid';

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
  stats?: {
    totalOrders: number;
    totalSpent: number;
  };
  hasAddress?: boolean;
  hasSubscription?: boolean;
  pointsBalance?: number;
  cmsInicio?: Record<string, unknown>;
  cmsTrazabilidad?: Record<string, unknown>;
  cmsPedidos?: Record<string, unknown>;
  cmsSuscripciones?: Record<string, unknown>;
  cmsResenas?: Record<string, unknown>;
  cmsRetorno?: Record<string, unknown>;
  cmsBilletera?: Record<string, unknown>;
}

const TIER_THRESHOLDS = {
  OBRERA: { next: 'ZÁNGANO', ciclos: 500, spent: 50000, trees: 0 },
  ZÁNGANO: { next: 'REINA', ciclos: 2000, spent: 0, trees: 5 },
  REINA: { next: 'COLMENA', ciclos: 5000, spent: 0, trees: 10 },
  COLMENA: { next: null, ciclos: 0, spent: 0, trees: 0 },
} as const;

function getTierProgress(
  tier: string,
  ciclos: number,
  spent: number,
  trees: number,
): { next: string; progress: number; ciclos: number; threshold: number } | null {
  const t = TIER_THRESHOLDS[tier as keyof typeof TIER_THRESHOLDS];
  if (!t || !t.next) return null;

  const ciclosProgress = t.ciclos > 0 ? Math.min(ciclos / t.ciclos, 1) : 1;
  const spentProgress = t.spent > 0 ? Math.min(spent / t.spent, 1) : 1;
  const treesProgress = t.trees > 0 ? Math.min(trees / t.trees, 1) : 1;

  const progress = tier === 'OBRERA'
    ? Math.max(ciclosProgress, spentProgress)
    : Math.min(ciclosProgress, treesProgress);

  return { next: t.next, progress, ciclos, threshold: t.ciclos };
}

export function MiLegadoClient({
  user,
  tierData,
  hiveData,
  orders,
  claimPoints,
  ecosystemMetrics,
  stats,
  hasAddress = false,
  hasSubscription = false,
  pointsBalance = 0,
  cmsInicio,
  cmsTrazabilidad,
  cmsPedidos,
  cmsSuscripciones,
  cmsResenas,
  cmsRetorno,
  cmsBilletera,
}: MiLegadoClientProps) {
  const totalOrders = stats?.totalOrders ?? orders?.length ?? 0;
  const totalSpent = stats?.totalSpent ?? orders?.reduce((sum, order) => sum + (order.total || 0), 0) ?? 0;
  const azucarSustituida = Math.round(totalSpent / 4500 * 0.8);
  const arbolesPersonal = user?.arboles_personal ?? 0;
  const co2PersonalEstimado = arbolesPersonal * 15;
  const irrEstimado = co2PersonalEstimado > 0
    ? (co2PersonalEstimado / Math.max(totalSpent * 0.0001, 1)).toFixed(1)
    : '—';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-12 pb-16 animate-in fade-in duration-300">
      {/* ── HERO & IDENTIDAD ── */}
      <header className="space-y-5 border-b border-border/40 pb-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground/90 font-medium">
            Mi Legado · Resumen
          </span>
          <span className="text-xs text-muted-foreground italic hidden sm:inline">
            {String(cmsInicio?.hero_tagline || 'El bosque nativo de Chiloé en tu despensa')}
          </span>
        </div>

        <div className="space-y-1.5">
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-light text-foreground tracking-tight">
            {String(cmsInicio?.hero_title || 'El Legado')}
          </h1>
          <p className="font-display text-xl sm:text-2xl text-foreground/90 font-normal">
            {user?.full_name || 'Miembro del Legado'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-wider text-foreground/80 font-medium">
            {String(cmsInicio?.member_label || 'Miembro Activo')}
          </span>
          <span className="text-border" aria-hidden>·</span>
          <span>
            {String(cmsInicio?.tier_label || 'Nivel en colmena')}:{' '}
            <strong className="text-foreground font-medium uppercase tracking-wide">
              {tierData?.tier || 'OBRERA'}
            </strong>{' '}
            ({tierData?.ciclos_historicos || 0} ciclos acumulados)
          </span>
        </div>

        {(() => {
          const progress = getTierProgress(
            tierData?.tier || 'OBRERA',
            tierData?.ciclos_historicos || 0,
            totalSpent,
            arbolesPersonal,
          );
          if (!progress) return null;
          return (
            <div className="max-w-md space-y-1.5">
              <div className="flex items-baseline justify-between text-[11px] font-mono">
                <span className="text-muted-foreground uppercase tracking-wider">
                  Ascenso a {progress.next}
                </span>
                <span className="text-muted-foreground">
                  {progress.ciclos} / {progress.threshold} ciclos
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-sunken rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.round(progress.progress * 100)}%` }}
                />
              </div>
            </div>
          );
        })()}
      </header>

      {/* ── ACCIONES PRINCIPALES ── */}
      <nav aria-label="Acciones de ciclo" className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        <Link
          href="/catalogo"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-foreground text-background px-4 py-2 text-xs font-medium uppercase tracking-wider hover:bg-foreground/90 transition-colors shadow-sm"
        >
          <span>Explorar Mieles</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link
          href="/perfil/trazabilidad"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border/80 bg-card/70 px-4 py-2 text-xs font-mono uppercase tracking-wider text-foreground/90 hover:text-foreground hover:border-foreground/40 hover:bg-surface-raised transition-colors"
        >
          <span>Origen y Trazabilidad</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
        </Link>
        <Link
          href="/perfil/billetera"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border/80 bg-card/70 px-4 py-2 text-xs font-mono uppercase tracking-wider text-foreground/90 hover:text-foreground hover:border-foreground/40 hover:bg-surface-raised transition-colors"
        >
          <span>Billetera & Beneficios</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
        </Link>
      </nav>

      {/* ── 3 MÉTRICAS (Escala tipográfica alta 5xl/6xl, ceros contextualizados, verde solo para lo vivo) ── */}
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
        {/* Card 1: Pedidos (Objeto inanimado: icono neutro, NO mint) */}
        <Link
          href="/perfil/pedidos"
          className="vanguard-data group bg-card border border-border/70 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-border transition-all hover:bg-surface-raised/40"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-sunken/60 border border-border/40 flex items-center justify-center text-muted-foreground">
                <Package className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </div>
            <div className="font-display text-5xl lg:text-6xl font-normal tracking-tight text-foreground mb-1">
              {totalOrders}
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-foreground/80 font-medium">
              {String(cmsInicio?.stat_pedidos_label || 'Pedidos')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground leading-snug">
            {totalOrders === 0 ? String(cmsInicio?.stat_pedidos_empty || 'Aún sin pedidos · Tu primer ciclo abre el legado') : `${totalOrders} ciclo${totalOrders > 1 ? 's' : ''} registrado${totalOrders > 1 ? 's' : ''}`}
          </div>
        </Link>

        {/* Card 2: Legado Acumulado (Financiamiento: icono neutro) */}
        <Link
          href={REPOSICION_PATH}
          className="vanguard-data group bg-card border border-border/70 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-border transition-all hover:bg-surface-raised/40"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-sunken/60 border border-border/40 flex items-center justify-center text-muted-foreground">
                <Leaf className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-foreground transition-colors" />
            </div>
            <div className="font-display text-5xl lg:text-6xl font-normal tracking-tight text-foreground mb-1">
              {formatCLP(totalSpent)}
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-foreground/80 font-medium">
              {String(cmsInicio?.stat_legado_label || 'Legado Acumulado')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground leading-snug">
            {totalSpent === 0 ? String(cmsInicio?.stat_legado_empty || 'Aún sin aportes · Financia bosque nativo en Pureo') : 'Aporte directo a la regeneración de Chiloé'}
          </div>
        </Link>

        {/* Card 3: m² Regenerados (ESTO ES LO VIVO -> mint reservado para aquí) */}
        <Link
          href="/perfil/trazabilidad"
          className="group bg-card border border-border/70 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-accent/40 transition-all hover:bg-surface-raised/40"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent">
                <TreePine className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-accent/60 group-hover:text-accent transition-colors" />
            </div>
            <div className="font-display text-5xl lg:text-6xl font-normal tracking-tight text-foreground mb-1 flex items-baseline gap-1.5">
              <span>{arbolesPersonal}</span>
              <span className="text-2xl font-display font-light text-muted-foreground">m²</span>
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-foreground/80 font-medium">
              {String(cmsInicio?.stat_m2_label || 'm² Regenerados')}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/40 text-[11px] text-muted-foreground leading-snug">
            {arbolesPersonal === 0 ? String(cmsInicio?.stat_m2_empty || 'Aún en reposo · Se activa con tu primer frasco') : 'Bosque nativo bajo protección directa en Chiloé'}
          </div>
        </Link>
      </div>

      {/* ── MATRIZ DE TRAYECTORIA Y BENEFICIOS ── */}
      <section aria-labelledby="legado-trayectoria-heading" className="vanguard-data">
        <GuardianPowerGrid
          totalOrders={totalOrders}
          hasAddress={hasAddress}
          hasSubscription={hasSubscription}
          pointsBalance={pointsBalance}
          cmsInicio={cmsInicio}
        />
      </section>

      {/* ── SECCIONES DE DETALLE (Ritmo vertical consistente) ── */}
      <div className="space-y-16">
        {/* ── REGENERACIÓN DEL BOSQUE ── */}
        <section aria-labelledby="regeneracion-heading" className="vanguard-data border-t border-border/50 pt-10">
          <div className="max-w-xl mb-8">
            <span id="regeneracion-heading" className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium mb-2">
              Regeneración del Bosque
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tu contribución directa a la regeneración. Cada número es rastreable y demostrable por triangulación de papers y datos locales de Chiloé.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {/* m²: LO VIVO -> mint */}
            <div className="bg-card border border-border/70 rounded-2xl p-6 text-center">
              <div className="text-accent mb-3 flex justify-center">
                <Trees className="w-6 h-6" />
              </div>
              <p className="font-display text-3xl font-light text-foreground mb-1">{arbolesPersonal}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-foreground/75 font-medium">m² Regenerados</p>
            </div>

            {/* CO2: neutro */}
            <div className="bg-card border border-border/70 rounded-2xl p-6 text-center">
              <div className="text-muted-foreground mb-3 flex justify-center">
                <Leaf className="w-6 h-6" />
              </div>
              <p className="font-display text-3xl font-light text-foreground mb-1">
                {co2PersonalEstimado > 0 ? `~${co2PersonalEstimado}` : '—'}
              </p>
              <p className="text-xs font-mono uppercase tracking-wider text-foreground/75 font-medium">kg CO₂ capturado</p>
            </div>

            {/* Miel virgen consumida */}
            <div className="bg-card border border-border/70 rounded-2xl p-6 text-center">
              <div className="text-muted-foreground mb-3 flex justify-center">
                <Bug className="w-6 h-6" />
              </div>
              <p className="font-display text-3xl font-light text-foreground mb-1">
                {azucarSustituida > 0 ? `~${azucarSustituida}` : '—'}
              </p>
              <p className="text-xs font-mono uppercase tracking-wider text-foreground/75 font-medium">g Miel virgen consumida</p>
            </div>

            {/* IRR: neutro con badge de vida si > 1 */}
            <div className="bg-card border border-border/70 rounded-2xl p-6 text-center">
              <div className="text-muted-foreground mb-3 flex justify-center">
                <TreePine className="w-6 h-6" />
              </div>
              <p className="font-display text-3xl font-light text-foreground mb-1">{irrEstimado}</p>
              <p className="text-xs font-mono uppercase tracking-wider text-foreground/75 font-medium">IRR personal</p>
              {irrEstimado !== '—' && Number(irrEstimado) > 1 && (
                <span className="inline-block text-[10px] font-mono text-accent mt-1 px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20">
                  Impacto &gt; Huella
                </span>
              )}
            </div>
          </div>

          <div className="bg-surface-raised/40 border border-border/50 rounded-2xl p-6 sm:p-8 mb-8">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">
              Tu IRR personal
            </p>
            {irrEstimado !== '—' && Number(irrEstimado) > 1 ? (
              <>
                <p className="font-display text-2xl sm:text-3xl font-light text-foreground tracking-tight mb-3">
                  IRR {irrEstimado} · Impacto &gt; Huella
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Tu consumo genera {irrEstimado}× más captura de carbono que emisión. Cada pedido financia árboles en Pureo, Chiloé, y sostiene apiarios entre Quemchi, Molulco y Pureo-Quelen.
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl sm:text-3xl font-light text-foreground tracking-tight mb-3">
                  Tu impacto está en camino
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                  Con cada pedido, financias árboles y sostienes apiarios en bosque nativo entre Quemchi, Molulco y Pureo-Quelen. Tu índice IRR personal se calculará con tus primeros pedidos.
                </p>
              </>
            )}
          </div>

          <div className="bg-surface-raised/40 border border-border/50 rounded-2xl p-6 sm:p-8">
            <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-muted-foreground font-medium mb-3">
              Ecosistema colectivo vinculado
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              Tu legado se suma al ecosistema colectivo de {ecosystemMetrics.anos_legado} en Chiloé:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center py-3">
                <p className="font-display text-2xl sm:text-3xl font-normal text-foreground">
                  {ecosystemMetrics.arboles_total.toLocaleString('es-CL')}+
                </p>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">Árboles totales</p>
              </div>
              <div className="text-center py-3">
                <p className="font-display text-2xl sm:text-3xl font-normal text-foreground">
                  ~{ecosystemMetrics.co2_ton.toLocaleString('es-CL')} ton
                </p>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">CO₂ capturado</p>
              </div>
              <div className="text-center py-3">
                <p className="font-display text-2xl sm:text-3xl font-normal text-foreground">
                  {ecosystemMetrics.colmenas_total}
                </p>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">Colmenas</p>
              </div>
              <div className="text-center py-3">
                <p className="font-display text-2xl sm:text-3xl font-normal text-foreground">
                  {ecosystemMetrics.especies_nativas}
                </p>
                <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-1">Especies nativas</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-border/30 flex flex-wrap items-center gap-4">
              <Link
                href="/perfil/trazabilidad"
                className="inline-flex min-h-10 items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-foreground hover:text-accent transition-colors"
              >
                <span>Origen y Colmena</span>
                <ArrowUpRight size={13} />
              </Link>
              <Link
                href="/ciencia"
                className="inline-flex min-h-10 items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Ver ciencia del bosque y metodología</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── COLMENA ── */}
        <section aria-labelledby="colmena-heading" className="vanguard-data border-t border-border/50 pt-10">
          <span id="colmena-heading" className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium mb-6">
            Estado de tu Colmena
          </span>
          {hiveData ? (
            <div className="flex flex-col sm:flex-row justify-between items-baseline gap-6 bg-card border border-border/70 rounded-2xl p-6 sm:p-8">
              <div>
                <h3 className="font-display text-3xl font-light text-foreground mb-1.5">{hiveData.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Sector Pureo</span>
                  <span className="text-border" aria-hidden>·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${hiveData.estado === 'optima' ? 'bg-accent' : 'bg-warning'}`} />
                    {hiveData.estado === 'optima' ? 'Ritmo Vital Estable' : 'Atención Requerida'}
                  </span>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="block font-display italic text-4xl text-foreground">{hiveData.peso_kg || '--'} kg</span>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Peso Actual</span>
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-10 bg-card/40 rounded-2xl border border-dashed border-border/70 text-center space-y-4">
              <Droplets className="w-10 h-10 text-muted-foreground/60 mx-auto" />
              <div className="space-y-1 max-w-md mx-auto">
                <p className="text-sm text-foreground/90 font-medium">
                  Aún no has vinculado tu legado a una colmena específica
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Las adopciones de colmena en Chiloé permiten monitorear peso, salud y floración en tiempo real.
                </p>
              </div>
              <div className="pt-1">
                <Link
                  href="/catalogo"
                  className="inline-flex min-h-10 items-center gap-2 text-xs font-mono uppercase tracking-wider text-foreground hover:text-accent transition-colors"
                >
                  <span>Explorar Adopciones y Mieles</span>
                  <ChevronRight size={15} />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* ── PUNTOS DE RECLAMO ── */}
        <section aria-labelledby="reclamo-heading" className="vanguard-data border-t border-border/50 pt-10">
          <span id="reclamo-heading" className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium mb-6">
            Puntos de Reclamo
          </span>
          {claimPoints && claimPoints.length > 0 ? (
            <div className="space-y-3">
              {claimPoints.map((point) => (
                <div key={point.id} className="flex items-center justify-between p-5 bg-card border border-border/70 rounded-xl">
                  <div>
                    <div className="text-foreground font-display text-lg">{point.ciclos?.tipo ?? 'Ciclo'}</div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{point.ciclos?.estado ?? 'activo'}</div>
                  </div>
                  <Clock className="w-5 h-5 text-muted-foreground" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-card/30 rounded-xl border border-dashed border-border/60 text-center">
              <p className="text-xs text-muted-foreground italic">
                No tienes puntos de reclamo pendientes · Los canjes y puntos por retorno de envases aparecerán aquí.
              </p>
            </div>
          )}
        </section>

        {/* ── PEDIDOS RECIENTES ── */}
        <section aria-labelledby="pedidos-heading" className="vanguard-data border-t border-border/50 pt-10">
          <div className="flex items-center justify-between mb-6 gap-4">
            <span id="pedidos-heading" className="block text-xs font-mono uppercase tracking-[0.2em] text-foreground/80 font-medium">
              Pedidos Recientes
            </span>
            <Link
              href="/perfil/pedidos"
              className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver todos <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {orders && orders.length > 0 ? (
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <Link
                  key={order.id}
                  href="/perfil/pedidos"
                  className="flex items-center justify-between p-5 bg-card border border-border/70 rounded-xl hover:border-border transition-colors group"
                >
                  <div>
                    <div className="text-foreground font-display text-lg">{new Date(order.created_at).toLocaleDateString('es-CL')}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {order.pedido_items?.[0]?.productos?.nombre || 'Varios'} · {order.pedido_items?.[0]?.cantidad || 0} un.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display italic text-foreground text-lg">{formatCLP(order.total || 0)}</div>
                    <div className="text-xs font-mono uppercase tracking-wider text-muted-foreground mt-0.5">{order.estado}</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-card/30 rounded-xl border border-dashed border-border/60 text-center space-y-2">
              <p className="text-sm text-muted-foreground italic">
                Aún sin pedidos registrados en tu historial.
              </p>
              <p className="text-xs text-muted-foreground/80">
                Tu primer ciclo de miel cruda o adopción de colmena se reflejará aquí.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ── ACCESO CANÓNICO A BILLETERA & PASE (ÚNICO DESTINO DEL QR) ── */}
      <div className="vanguard-data pt-4">
        <div className="bg-card border border-border/70 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-border transition-colors">
          <div className="space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground font-medium">
              <Wallet className="w-4 h-4 text-accent" />
              <span>Billetera del Bosque · Tarjeta Obrera</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-light text-foreground">
              Sellos de producto y pase digital
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Escanea tu credencial en ferias locales, gestiona sellos de fidelización por variedad y descarga tu pase oficial a Apple Wallet o Google Wallet.
            </p>
          </div>
          <Link
            href="/perfil/billetera"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-raised px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-foreground hover:border-accent/40 hover:text-accent transition-colors shrink-0"
          >
            <span>Abrir Billetera</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
