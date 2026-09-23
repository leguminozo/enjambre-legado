'use client';

import Link from 'next/link';
import {
  RotateCcw,
  Sparkles,
  TreePine,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Gift,
  ShoppingBag,
} from 'lucide-react';

export interface RetornoItem {
  id: string;
  created_at: string;
  puntos: number;
  cantidad: number;
  punto: string;
}

export interface CircularClientProps {
  totalFrascos: number;
  co2EvitadoKg: number;
  puntosGanados: number;
  retornos: RetornoItem[];
}

export function CircularClient({
  totalFrascos,
  co2EvitadoKg,
  puntosGanados,
  retornos,
}: CircularClientProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabecera Editorial */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-muted-foreground">
            Economía Circular & Retorno de Frascos
          </span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-semibold text-foreground tracking-tight">
          Ciclo Circular del Vidrio Austral
        </h1>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
          Cada frasco devuelto al territorio es sanitizado minuciosamente e integrado al siguiente ciclo
          de recolección nativa en Chiloé. Retribuimos tu compromiso con 500 puntos por envase acreditados en tu Billetera.
        </p>
      </div>

      {/* Tarjetas de Métricas de Impacto */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
              Frascos Retornados
            </span>
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <RotateCcw size={16} />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {totalFrascos}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalFrascos === 1 ? 'Envase reincorporado al bosque' : 'Envases reincorporados al bosque'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
              CO₂e Evitado
            </span>
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <TreePine size={16} />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">
              {co2EvitadoKg.toFixed(1)} <span className="text-lg font-normal text-muted-foreground">kg</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Metodología territorial (1.2 kg por frasco de 500g)
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 flex flex-col justify-between backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs uppercase font-mono tracking-wider text-muted-foreground">
              Puntos Obtenidos
            </span>
            <div className="w-8 h-8 rounded-full bg-accent/15 text-accent flex items-center justify-center">
              <Gift size={16} />
            </div>
          </div>
          <div>
            <div className="font-display text-3xl sm:text-4xl font-bold text-accent">
              +{puntosGanados.toLocaleString('es-CL')}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Disponibles para canje en tu Billetera
            </p>
          </div>
        </div>
      </div>

      {/* Guía de Retorno en 4 Pasos */}
      <div className="rounded-2xl border border-border/60 bg-card/30 p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div>
          <h2 className="font-display text-xl font-semibold text-foreground">
            Protocolo de Retorno de Envases
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Un estándar de origen que preserva la pureza del bosque y premia tu devolución.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border/40 bg-surface-raised/40 p-4 space-y-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center font-mono">
              1
            </div>
            <h3 className="text-sm font-semibold text-foreground">Disfruta la Miel</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Saborea hasta la última gota de miel virgen cruda en tu mesa sin aplicar químicos abrasivos.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-surface-raised/40 p-4 space-y-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center font-mono">
              2
            </div>
            <h3 className="text-sm font-semibold text-foreground">Enjuague Simple</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enjuaga el frasco con agua tibia para retirar restos superficiales de miel y conserva su tapa original.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-surface-raised/40 p-4 space-y-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center font-mono">
              3
            </div>
            <h3 className="text-sm font-semibold text-foreground">Entrega Directa</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Entrega tu frasco en nuestras ferias oficiales, locales autorizados o a nuestro repartidor al pedir tu reposición.
            </p>
          </div>

          <div className="rounded-xl border border-border/40 bg-surface-raised/40 p-4 space-y-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 text-accent text-xs font-bold flex items-center justify-center font-mono">
              4
            </div>
            <h3 className="text-sm font-semibold text-foreground">Puntos Inmediatos</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Se acreditan 500 puntos por frasco al instante en tu Billetera, listos para canjear en futuras compras.
            </p>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href="/perfil/billetera"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <span>Ver Catálogo de Canje en Billetera</span>
            <ArrowRight size={14} />
          </Link>
          <Link
            href="/catalogo"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border/60 bg-surface-raised/40 px-6 py-2.5 text-xs font-medium text-foreground hover:border-accent transition-colors"
          >
            <ShoppingBag size={14} />
            <span>Pedir Reposición de Miel</span>
          </Link>
        </div>
      </div>

      {/* Historial de Devoluciones */}
      <div className="rounded-2xl border border-border/60 bg-card/30 p-6 sm:p-8 backdrop-blur-sm space-y-4">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Registro Histórico de Retornos
        </h2>

        {retornos.length > 0 ? (
          <div className="divide-y divide-border/30">
            {retornos.map((item) => (
              <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0 text-muted-foreground">
                    <CheckCircle2 size={16} className="text-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.cantidad} {item.cantidad === 1 ? 'frasco retornado' : 'frascos retornados'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Calendar size={12} />
                      <span>{new Date(item.created_at).toLocaleDateString('es-CL')}</span>
                      <span>·</span>
                      <span>{item.punto}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-semibold text-accent">
                    +{item.puntos.toLocaleString('es-CL')} pts
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 space-y-2 border border-dashed border-border/40 rounded-xl">
            <RotateCcw size={28} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium text-foreground">Aún no registras retornos de frascos</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Al terminar tu miel de Pureo, entrega tu envase limpio en cualquiera de nuestras ferias o al recibir tu pedido para activar tu historial de impacto.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
