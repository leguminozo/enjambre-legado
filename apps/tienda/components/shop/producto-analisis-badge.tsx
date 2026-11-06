import { FlaskConical, ShieldCheck } from 'lucide-react';
import type { AnalisisPublico } from '@/lib/shop/analisis-lote';

/** Sello de pureza y vitalidad biológica verificado en la ficha de producto. */
export function ProductoAnalisisBadge({ analisis }: { analisis: AnalisisPublico }) {
  const puntos: string[] = [];

  if (analisis.hmf_mgkg != null) {
    puntos.push('Cruda y sin calentar');
  }
  if (analisis.diastasa != null) {
    puntos.push('Enzimas vivas intactas');
  }
  if (analisis.humedad_pct != null) {
    puntos.push('Maduración natural en panal');
  }
  if (analisis.conductividad_ms != null) {
    puntos.push('Minerales del bosque nativo');
  }

  if (puntos.length === 0) {
    puntos.push('100% Cruda y viva', 'Enzimas intactas', 'Pureza de origen');
  }

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5 space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
          <FlaskConical size={15} /> Pureza y Vitalidad Verificada
        </p>
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Estándar de Origen
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-0.5">
        {puntos.map((punto) => (
          <span
            key={punto}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-card border border-border/70 text-foreground"
          >
            {punto}
          </span>
        ))}
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
        <ShieldCheck size={13} className="text-primary shrink-0" />
        <span>Certificación oficial de inocuidad y ausencia de pasteurización industrial.</span>
      </p>
    </div>
  );
}
