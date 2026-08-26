'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Eraser, RotateCcw } from 'lucide-react';
import {
  type SeasonalSettings,
  type SeasonKey,
  SEASON_KEYS,
  parseSeasonalSettings,
} from '@/lib/store-chrome';
import { useAutosaveEditor, useAutosaveState } from '@/components/tienda/save-status';

const SEASON_META: Record<SeasonKey, { label: string; months: string }> = {
  primavera: { label: 'Primavera', months: 'Sep — Nov' },
  verano: { label: 'Verano', months: 'Dic — Feb' },
  otono: { label: 'Otoño', months: 'Mar — May' },
  invierno: { label: 'Invierno', months: 'Jun — Ago' },
};

/** Mes del cliente (1-12) → temporada (mismo mapeo que tienda lib/shop/seasonal). */
function currentSeasonKey(now: Date = new Date()): SeasonKey {
  const month = now.getMonth() + 1;
  if (month >= 9 && month <= 11) return 'primavera';
  if (month >= 12 || month <= 2) return 'verano';
  if (month >= 3 && month <= 5) return 'otono';
  return 'invierno';
}

function seasonHasContent(s: SeasonalSettings[SeasonKey]): boolean {
  return !!(s.label_es || s.label_en || s.message_es || s.message_en || s.floraciones);
}

interface SeasonalSettingsEditorProps {
  content: Record<string, unknown>;
  onSave: (content: Record<string, unknown>) => void;
}

/**
 * Contenido estacional (Club Legado del Bosque + copy de temporada).
 * Campos vacíos = la tienda usa el default calculado por mes; lo que se
 * completa aquí gana sobre el default mientras no esté vacío.
 */
export function SeasonalSettingsEditor({ content, onSave }: SeasonalSettingsEditorProps) {
  const { local, setLocal } = useAutosaveState('seasonal_settings', content, parseSeasonalSettings, (next) => onSave(next));
  const [openSeason, setOpenSeason] = useState<SeasonKey | null>(() => currentSeasonKey());

  const patch = (season: SeasonKey, field: keyof SeasonalSettings[SeasonKey], value: string) => {
    setLocal((prev) => ({ ...prev, [season]: { ...prev[season], [field]: value } }));
  };

  const hasOverrides = useMemo(
    () => SEASON_KEYS.some((k) => seasonHasContent(local[k])),
    [local],
  );

  const clearSeason = (season: SeasonKey) => {
    setLocal((prev) => ({ ...prev, [season]: parseSeasonalSettings(null)[season] }));
  };

  const resetAll = () => {
    setLocal(parseSeasonalSettings(null));
  };

  const inputClass =
    'w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent';
  const labelClass = 'text-[10px] font-bold uppercase tracking-wider text-muted-foreground';

  return (
    <div className="space-y-4 pb-8">
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-surface-raised flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Contenido por temporada
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Deja los campos vacíos para usar el contenido automático de cada
              temporada (según el mes). Lo que completes aquí tiene prioridad sobre el
              valor por defecto en la tienda (Club Legado del Bosque).
            </p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            disabled={!hasOverrides}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-accent/50 transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <RotateCcw size={13} />
            Restablecer todo
          </button>
        </div>

        {SEASON_KEYS.map((season) => {
          const s = local[season];
          const open = openSeason === season;
          const filled = seasonHasContent(s);
          return (
            <div key={season} className="border-b border-border last:border-b-0">
              <div className="flex items-center gap-2 px-3 py-2.5">
                <button
                  type="button"
                  onClick={() => setOpenSeason(open ? null : season)}
                  className="flex-1 min-w-0 flex items-center gap-3 text-left min-h-11"
                  aria-expanded={open}
                >
                  <ChevronDown
                    size={15}
                    className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-foreground">
                      {SEASON_META[season].label}
                    </span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                      {SEASON_META[season].months}
                      {filled ? ' · personalizado' : ''}
                    </span>
                  </span>
                  {filled ? (
                    <span
                      className="shrink-0 h-2 w-2 rounded-full bg-accent"
                      title="Campos personalizados activos"
                    />
                  ) : null}
                </button>
                {filled ? (
                  <button
                    type="button"
                    onClick={() => clearSeason(season)}
                    title="Limpiar esta temporada (volver al default)"
                    className="shrink-0 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors"
                  >
                    <Eraser size={14} />
                  </button>
                ) : null}
              </div>

              {open ? (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label htmlFor={`seasonal-${season}-label-es`} className={labelClass}>
                        Etiqueta de temporada (ES)
                      </label>
                      <input
                        id={`seasonal-${season}-label-es`}
                        name={`seasonal-${season}-label-es`}
                        type="text"
                        autoComplete="off"
                        value={s.label_es}
                        onChange={(e) => patch(season, 'label_es', e.target.value)}
                        placeholder="Primavera"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor={`seasonal-${season}-label-en`} className={labelClass}>
                        Etiqueta (EN)
                      </label>
                      <input
                        id={`seasonal-${season}-label-en`}
                        name={`seasonal-${season}-label-en`}
                        type="text"
                        autoComplete="off"
                        value={s.label_en}
                        onChange={(e) => patch(season, 'label_en', e.target.value)}
                        placeholder="Spring"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={`seasonal-${season}-message-es`} className={labelClass}>
                      Mensaje (ES)
                    </label>
                    <textarea
                      id={`seasonal-${season}-message-es`}
                      name={`seasonal-${season}-message-es`}
                      rows={3}
                      value={s.message_es}
                      onChange={(e) => patch(season, 'message_es', e.target.value)}
                      placeholder="El bosque despierta…"
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={`seasonal-${season}-message-en`} className={labelClass}>
                      Mensaje (EN)
                    </label>
                    <textarea
                      id={`seasonal-${season}-message-en`}
                      name={`seasonal-${season}-message-en`}
                      rows={3}
                      value={s.message_en}
                      onChange={(e) => patch(season, 'message_en', e.target.value)}
                      placeholder="The forest awakens…"
                      className={`${inputClass} resize-y`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor={`seasonal-${season}-floraciones`} className={labelClass}>
                      Floraciones disponibles
                    </label>
                    <input
                      id={`seasonal-${season}-floraciones`}
                      name={`seasonal-${season}-floraciones`}
                      type="text"
                      autoComplete="off"
                      value={s.floraciones}
                      onChange={(e) => patch(season, 'floraciones', e.target.value)}
                      placeholder="Ulmo, Tiaca, Coigue"
                      className={inputClass}
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Separadas por coma. Vacío = floraciones por defecto de la temporada.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
