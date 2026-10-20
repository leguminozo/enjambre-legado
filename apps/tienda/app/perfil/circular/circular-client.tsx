'use client';

import Link from 'next/link';
import {
  RotateCcw,
  Award,
  TreePine,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Gift,
  ShoppingBag,
} from 'lucide-react';
import {
  JAR_RETURN_POINTS,
  JAR_RETURN_CLP,
  JAR_BONUS_CYCLE_POINTS,
  JAR_BONUS_CYCLE_CLP,
  JAR_CYCLE_TOTAL_POINTS,
  JAR_CYCLE_TOTAL_CLP,
} from '@/lib/shop/loyalty-rates';

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
          de recolección nativa en Chiloé. Acreditamos {JAR_RETURN_POINTS} puntos (${JAR_RETURN_CLP.toLocaleString('es-CL')} de saldo a favor) por envase devuelto,
          con un bono especial de +{JAR_BONUS_CYCLE_POINTS} puntos (${JAR_BONUS_CYCLE_CLP.toLocaleString('es-CL')} CLP) por cada hito de 10 frascos completado.
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

      {/* Hito de Lealtad Circular: 10 Frascos */}
      {(() => {
        const frascosEnCiclo = totalFrascos % 10;
        const ciclosCompletados = Math.floor(totalFrascos / 10);
        const faltantes = 10 - frascosEnCiclo;
        const porcentaje = (frascosEnCiclo / 10) * 100;

        return (
          <div className="rounded-2xl border border-accent/30 bg-gradient-to-br from-card/60 via-card/40 to-accent/5 p-6 sm:p-8 backdrop-blur-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-mono uppercase tracking-wider mb-2">
                  <Award size={12} />
                  <span>Hito Guardián Austral</span>
                </div>
                <h2 className="font-display text-xl sm:text-2xl font-semibold text-foreground">
                  Bono Especial por Ciclo de 10 Frascos
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
                  Por cada 10 frascos retornados con tapa original y limpios, sumas un bono adicional de{' '}
                  <span className="text-foreground font-semibold">+{JAR_BONUS_CYCLE_POINTS.toLocaleString('es-CL')} puntos</span> (${JAR_BONUS_CYCLE_CLP.toLocaleString('es-CL')} CLP extra), totalizando{' '}
                  <span className="text-accent font-semibold">{JAR_CYCLE_TOTAL_POINTS.toLocaleString('es-CL')} puntos (${JAR_CYCLE_TOTAL_CLP.toLocaleString('es-CL')} de saldo a favor)</span> por ciclo completo.
                </p>
              </div>

              {ciclosCompletados > 0 && (
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 bg-surface-raised/40 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-border/40">
                  <span className="text-xs text-muted-foreground">Ciclos completados</span>
                  <span className="font-display text-2xl font-bold text-accent">
                    {ciclosCompletados} {ciclosCompletados === 1 ? 'pack' : 'packs'}
                  </span>
                </div>
              )}
            </div>

            {/* Barra y Ranuras de Progreso */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  Progreso del ciclo actual: <span className="text-accent font-mono font-bold">{frascosEnCiclo}</span> / 10 frascos
                </span>
                <span className="text-muted-foreground text-[11px]">
                  {frascosEnCiclo === 0 && totalFrascos > 0
                    ? '¡Ciclo completado! El próximo retorno inicia una nueva etapa.'
                    : `Faltan ${faltantes} ${faltantes === 1 ? 'frasco' : 'frascos'} para el bono de +$${JAR_BONUS_CYCLE_CLP.toLocaleString('es-CL')}`}
                </span>
              </div>

              <div className="w-full h-3 rounded-full bg-surface-raised overflow-hidden border border-border/50 p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent/80 to-accent transition-all duration-500 ease-out"
                  style={{ width: `${Math.max(porcentaje, frascosEnCiclo > 0 ? 5 : 0)}%` }}
                />
              </div>

              {/* 10 Marcadores de Posición */}
              <div className="grid grid-cols-10 gap-1 sm:gap-2 pt-1">
                {Array.from({ length: 10 }, (_, i) => {
                  const frascoNum = i + 1;
                  const isCompleted = frascosEnCiclo >= frascoNum;
                  const isTenth = frascoNum === 10;

                  return (
                    <div
                      key={frascoNum}
                      className={`flex flex-col items-center justify-center py-2 rounded-lg border text-center transition-colors ${
                        isCompleted
                          ? 'border-accent/40 bg-accent/15 text-accent font-bold'
                          : isTenth
                          ? 'border-dashed border-accent/40 bg-accent/5 text-muted-foreground'
                          : 'border-border/40 bg-surface-raised/30 text-muted-foreground/60'
                      }`}
                      title={isTenth ? `Frasco 10: ¡Bono especial +${JAR_BONUS_CYCLE_POINTS.toLocaleString('es-CL')} pts!` : `Frasco ${frascoNum}`}
                    >
                      {isTenth ? (
                        <Gift size={12} className={isCompleted ? 'text-accent' : 'text-accent/60'} />
                      ) : (
                        <span className="text-[10px] font-mono leading-none">{frascoNum}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

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
            <h3 className="text-sm font-semibold text-foreground">Saldo a Favor</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Acreditas {JAR_RETURN_POINTS} puntos (${JAR_RETURN_CLP.toLocaleString('es-CL')} CLP) por frasco en tu Billetera, más un bono de +{JAR_BONUS_CYCLE_POINTS.toLocaleString('es-CL')} puntos al acumular 10 envases.
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
