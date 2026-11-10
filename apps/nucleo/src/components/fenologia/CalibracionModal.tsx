'use client';

import { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Sliders, Check, X, AlertCircle, Info, Calendar } from 'lucide-react';
import { overlayBackdropClassName } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface EspecieCalibrable {
  id: string;
  nombre_comun: string;
  nombre_cientifico: string;
  gdd_umbral: number | null;
  tbase_c?: number;
  t_base?: number;
  gdd_stddev?: number | null;
  foto_url?: string | null;
}

interface ObservacionSimple {
  id: string;
  fecha: string;
  fenofase_bbch: number;
  sector?: string | null;
}

interface CalibracionModalProps {
  especie: EspecieCalibrable | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function CalibracionModal({ especie, isOpen, onClose, onSaved }: CalibracionModalProps) {
  const [mounted, setMounted] = useState(false);
  const apiFetch = useApiFetch();
  const [umbral, setUmbral] = useState('');
  const [tbase, setTbase] = useState('5.0');
  const [stddev, setStddev] = useState('');
  const [observaciones, setObservaciones] = useState<ObservacionSimple[]>([]);
  const [loadingObs, setLoadingObs] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!especie) return;
    setUmbral(especie.gdd_umbral != null ? String(especie.gdd_umbral) : '');
    setTbase(String(especie.tbase_c ?? especie.t_base ?? 5.0));
    setStddev(especie.gdd_stddev != null ? String(especie.gdd_stddev) : '');

    // Cargar observaciones territoriales para esta especie
    setLoadingObs(true);
    apiFetch(`/api/fenologia/observaciones?especie_id=${especie.id}`)
      .then(async (res) => {
        if (res.ok) {
          const j = await res.json();
          setObservaciones(j.data ?? []);
        }
      })
      .catch(() => setObservaciones([]))
      .finally(() => setLoadingObs(false));
  }, [especie, apiFetch]);

  if (!isOpen || !especie || !mounted) return null;

  const handleGuardar = () => {
    setErrorMsg(null);
    startSaving(async () => {
      try {
        const payload = {
          gdd_umbral: umbral.trim() ? Number(umbral) : null,
          tbase_c: tbase.trim() ? Number(tbase) : 5.0,
          gdd_stddev: stddev.trim() ? Number(stddev) : null,
        };

        const res = await apiFetch(`/api/fenologia/especies/${especie.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await onSaved();
          onClose();
        } else {
          const err = await res.json().catch(() => null);
          setErrorMsg(err?.message ?? 'Error al actualizar el umbral térmico.');
        }
      } catch {
        setErrorMsg('Error de conexión.');
      }
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <button
        type="button"
        className={`fixed inset-0 ${overlayBackdropClassName}`}
        aria-label="Cerrar modal"
        onClick={onClose}
      />

      {/* Modal Card centrado */}
      <div className="relative z-10 w-full max-w-lg bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 animate-in zoom-in-95 fade-in-0 duration-200 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Sliders size={18} />
            </div>
            <div>
              <h3 className="font-display text-lg text-foreground">
                Calibración Térmica (GDD)
              </h3>
              <p className="text-xs text-muted-foreground">
                Ajuste del umbral de grados día acumulados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm p-1.5 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Especie info */}
        <div className="p-3.5 rounded-xl bg-surface-sunken border border-border flex items-center justify-between">
          <div>
            <h4 className="text-base font-semibold text-foreground">{especie.nombre_comun}</h4>
            <p className="text-xs text-muted-foreground italic font-mono">{especie.nombre_cientifico}</p>
          </div>
          {especie.foto_url && (
            <img
              src={especie.foto_url}
              alt={especie.nombre_comun}
              className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
            />
          )}
        </div>

        {/* Formulario de parámetros */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <label className="space-y-1">
            <span className="text-muted-foreground uppercase font-medium">Umbral GDD (°d)</span>
            <input
              type="number"
              step="0.1"
              placeholder="Ej: 564.8"
              value={umbral}
              onChange={(e) => setUmbral(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-datos text-sm"
              autoFocus
            />
          </label>

          <label className="space-y-1">
            <span className="text-muted-foreground uppercase font-medium">Temperatura Base (°C)</span>
            <input
              type="number"
              step="0.5"
              value={tbase}
              onChange={(e) => setTbase(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-datos text-sm"
            />
          </label>

          <label className="space-y-1 col-span-2">
            <span className="text-muted-foreground uppercase font-medium">Desviación Típica (± GDD)</span>
            <input
              type="number"
              step="0.1"
              placeholder="Ej: 42.5"
              value={stddev}
              onChange={(e) => setStddev(e.target.value)}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-datos text-sm"
            />
          </label>
        </div>

        {/* Evidencia de campo registrada */}
        <div className="space-y-2 pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground uppercase font-medium flex items-center gap-1.5">
              <Calendar size={13} className="text-accent" /> Evidencia de Campo Registrada
            </span>
            <span className="font-mono text-foreground font-medium">
              {observaciones.length} eventos
            </span>
          </div>

          {loadingObs ? (
            <p className="text-xs text-muted-foreground italic py-1">Cargando observaciones…</p>
          ) : observaciones.length === 0 ? (
            <div className="p-2.5 rounded-lg bg-surface-sunken/60 text-xs text-muted-foreground">
              Aún no hay registros de floración para esta especie. A medida que se añadan observaciones en terreno, la calibración se ajustará a la realidad territorial.
            </div>
          ) : (
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {observaciones.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-surface-sunken/80 border border-border/40 text-xs"
                >
                  <span className="text-foreground">
                    BBCH {o.fenofase_bbch} {o.sector ? `· ${o.sector}` : ''}
                  </span>
                  <span className="font-mono text-muted-foreground text-[11px]">{o.fecha}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-surface-raised border border-border/60 text-[11px] text-muted-foreground">
          <Info size={14} className="shrink-0 text-primary" />
          <span>
            El umbral GDD representa las unidades de calor requeridas (desde el 1 de julio) para alcanzar la floración efectiva en el hemisferio sur.
          </span>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline text-xs min-h-9 px-3.5"
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={isSaving}
            className="btn btn-primary text-xs min-h-9 px-4 inline-flex items-center gap-1.5"
          >
            <Check size={13} />
            <span>{isSaving ? 'Guardando…' : 'Guardar Calibración'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
