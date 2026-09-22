import { FlaskConical, ShieldCheck } from 'lucide-react';
import type { AnalisisPublico } from '@/lib/shop/analisis-lote';

/** Sello de análisis de laboratorio en la ficha de producto (datos del BFF). */
export function ProductoAnalisisBadge({ analisis }: { analisis: AnalisisPublico }) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5 space-y-2">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
        <FlaskConical size={15} /> Lote analizado en laboratorio
      </p>
      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-xs text-foreground">
        {analisis.humedad_pct != null && <span>Humedad {analisis.humedad_pct}%</span>}
        {analisis.hmf_mgkg != null && <span>HMF {analisis.hmf_mgkg} mg/kg</span>}
        {analisis.diastasa != null && <span>Diastasa {analisis.diastasa}</span>}
        {analisis.conductividad_ms != null && <span>Conductividad {analisis.conductividad_ms} mS/cm</span>}
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck size={13} className="text-primary shrink-0" />
        {analisis.laboratorio}
        {analisis.fecha ? ` · ${new Date(analisis.fecha).toLocaleDateString('es-CL')}` : ''} ·
        dentro de norma Codex para miel premium.
      </p>
    </div>
  );
}
