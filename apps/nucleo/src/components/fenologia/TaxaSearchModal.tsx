'use client';

import { useState, useEffect, useTransition } from 'react';
import { Search, Loader2, Sparkles, Check, X, AlertCircle, ChevronRight } from 'lucide-react';
import { overlayBackdropClassName } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface TaxaItem {
  nombre_cientifico: string;
  nombre_comun: string;
  familia: string | null;
  foto_url: string | null;
  inat_taxon_id?: number;
}

function TaxaPhoto({ url, alt, className }: { url: string | null; alt: string; className?: string }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return (
      <div
        className={`w-11 h-11 rounded-lg bg-surface-raised border border-border/50 flex items-center justify-center text-muted-foreground text-xs shrink-0 select-none ${className ?? ''}`}
      >
        🌿
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      onError={() => setHasError(true)}
      className={`w-11 h-11 rounded-lg object-cover border border-border/50 shrink-0 ${className ?? ''}`}
      loading="lazy"
    />
  );
}

interface TaxaSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEspecieCreada: () => Promise<void> | void;
}

export function TaxaSearchModal({ isOpen, onClose, onEspecieCreada }: TaxaSearchModalProps) {
  const apiFetch = useApiFetch();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TaxaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTaxon, setSelectedTaxon] = useState<TaxaItem | null>(null);

  // Formulario de confirmación y ajuste
  const [nombreComun, setNombreComun] = useState('');
  const [nombreCientifico, setNombreCientifico] = useState('');
  const [familia, setFamilia] = useState('');
  const [origen, setOrigen] = useState<'nativa' | 'endemica' | 'introducida' | 'naturalizada'>('nativa');
  const [habito, setHabito] = useState<'arbol' | 'arbusto' | 'herbacea' | 'enredadera' | 'palmera' | 'otro'>('arbol');
  const [relevanciaApicola, setRelevanciaApicola] = useState<'nectar' | 'polen' | 'mixta' | 'propoleo' | 'melada'>('mixta');
  const [tbase, setTbase] = useState('5.0');
  const [gddUmbral, setGddUmbral] = useState('');
  const [monitoreoActivo, setMonitoreoActivo] = useState(true);
  const [fotoUrl, setFotoUrl] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  // Búsqueda con debounce
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/fenologia/taxa-search?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const json = await res.json();
          setResults(json.data ?? []);
        }
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [query, apiFetch]);

  const seleccionarTaxon = (item: TaxaItem) => {
    setSelectedTaxon(item);
    setNombreComun(item.nombre_comun);
    setNombreCientifico(item.nombre_cientifico);
    setFamilia(item.familia || '');
    setFotoUrl(item.foto_url || '');

    // Heurística inicial de origen: si el nombre o taxón suele ser maleza o frutal común
    const lowerName = item.nombre_cientifico.toLowerCase();
    if (
      lowerName.includes('rubus') ||
      lowerName.includes('taraxacum') ||
      lowerName.includes('trifolium') ||
      lowerName.includes('brassica') ||
      lowerName.includes('eucalyptus')
    ) {
      setOrigen('introducida');
    } else {
      setOrigen('nativa');
    }
  };

  const guardarEspecie = () => {
    setErrorMsg(null);
    if (!nombreCientifico.trim() || !nombreComun.trim()) {
      setErrorMsg('El nombre científico y común son requeridos.');
      return;
    }

    startSaving(async () => {
      try {
        const payload = {
          nombre_cientifico: nombreCientifico.trim(),
          nombre_comun: nombreComun.trim(),
          familia: familia.trim() || null,
          tbase_c: Number(tbase) || 5.0,
          gdd_umbral: gddUmbral ? Number(gddUmbral) : null,
          origen,
          habito,
          relevancia_apicola: relevanciaApicola,
          monitoreo_activo: monitoreoActivo,
          foto_url: fotoUrl.trim() || null,
          fuente: 'activa' as const,
        };

        const res = await apiFetch('/api/fenologia/especies', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          await onEspecieCreada();
          onClose();
        } else {
          const err = await res.json().catch(() => null);
          setErrorMsg(err?.message ?? 'No se pudo guardar la especie botánica.');
        }
      } catch {
        setErrorMsg('Error de conexión al guardar la especie.');
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayBackdropClassName}`}>
      <div className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h3 className="font-display text-lg text-foreground">
              Añadir Especie Botánica
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm p-1 rounded-lg hover:bg-surface-raised transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {!selectedTaxon ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Buscador Taxonómico (Flora Nativa e Introducida de Chile)
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ej. Diente de león, Ulmo, Rubus ulmifolius, Quillay…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-9 pr-10 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Conectado al catálogo abierto de biodiversidad botánica con nombres aceptados y fotos de referencia.
                </p>
              </div>

              {results.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto border border-border/60 rounded-xl p-2 bg-surface-sunken/40">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => seleccionarTaxon(r)}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:border-border hover:bg-surface-raised cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <TaxaPhoto url={r.foto_url} alt={r.nombre_comun} />
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-foreground group-hover:text-primary transition-colors truncate">
                            {r.nombre_comun}
                          </div>
                          <div className="text-xs text-muted-foreground italic truncate">
                            {r.nombre_cientifico} {r.familia ? `· ${r.familia}` : ''}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-surface-raised border border-border/50 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-all flex items-center gap-1 shrink-0">
                        Elegir
                        <ChevronRight size={13} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  ))}
                </div>
              ) : query.length >= 2 && !isSearching ? (
                <div className="text-center py-8 text-sm text-muted-foreground bg-surface-sunken/30 rounded-xl border border-dashed border-border">
                  <p>No se encontraron resultados automáticos para «{query}».</p>
                  <button
                    type="button"
                    onClick={() => {
                      seleccionarTaxon({
                        nombre_cientifico: query,
                        nombre_comun: query,
                        familia: null,
                        foto_url: null,
                      });
                    }}
                    className="mt-3 text-xs text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    Crear registro manual con este nombre →
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            /* Formulario de confirmación y propiedades de la especie */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-surface-sunken border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <TaxaPhoto url={fotoUrl} alt={nombreComun} className="w-12 h-12" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{nombreComun}</h4>
                    <p className="text-xs text-muted-foreground italic truncate">{nombreCientifico}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTaxon(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Cambiar taxón
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="space-y-1">
                  <span className="text-muted-foreground uppercase font-medium">Nombre Común</span>
                  <input
                    type="text"
                    value={nombreComun}
                    onChange={(e) => setNombreComun(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-muted-foreground uppercase font-medium">Nombre Científico</span>
                  <input
                    type="text"
                    value={nombreCientifico}
                    onChange={(e) => setNombreCientifico(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground font-mono"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-muted-foreground uppercase font-medium">Familia Botánica</span>
                  <input
                    type="text"
                    value={familia}
                    onChange={(e) => setFamilia(e.target.value)}
                    placeholder="Ej. Cunoniaceae, Asteraceae…"
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-muted-foreground uppercase font-medium">Origen Biogeográfico</span>
                  <select
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value as typeof origen)}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                  >
                    <option value="nativa">Nativa</option>
                    <option value="endemica">Endémica de Chile</option>
                    <option value="introducida">Introducida / No nativa</option>
                    <option value="naturalizada">Naturalizada silvestre</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-muted-foreground uppercase font-medium">Hábito de Crecimiento</span>
                  <select
                    value={habito}
                    onChange={(e) => setHabito(e.target.value as typeof habito)}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                  >
                    <option value="arbol">Árbol</option>
                    <option value="arbusto">Arbusto</option>
                    <option value="herbacea">Herbácea</option>
                    <option value="enredadera">Enredadera / Trepadora</option>
                    <option value="palmera">Palmera</option>
                    <option value="otro">Otro</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-muted-foreground uppercase font-medium">Relevancia Melífera</span>
                  <select
                    value={relevanciaApicola}
                    onChange={(e) => setRelevanciaApicola(e.target.value as typeof relevanciaApicola)}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground"
                  >
                    <option value="nectar">Nectarífera principal</option>
                    <option value="polen">Polinífera</option>
                    <option value="mixta">Mixta (Néctar y Polen)</option>
                    <option value="propoleo">Propóleo / Resinas</option>
                    <option value="melada">Melada de bosque</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-muted-foreground uppercase font-medium">Temperatura Base (°C)</span>
                  <input
                    type="number"
                    step="0.5"
                    value={tbase}
                    onChange={(e) => setTbase(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground font-mono"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-muted-foreground uppercase font-medium">Umbral GDD (Opcional)</span>
                  <input
                    type="number"
                    placeholder="Sin calibrar (ej. 450)"
                    value={gddUmbral}
                    onChange={(e) => setGddUmbral(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground font-mono"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-border/50">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={monitoreoActivo}
                    onChange={(e) => setMonitoreoActivo(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary w-4 h-4 bg-background"
                  />
                  <div>
                    <span className="text-xs font-medium text-foreground">
                      Monitorear activamente en el Oráculo Fenológico
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Calculará pronóstico térmico diario en la vista de radar del bosque.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline text-xs min-h-9 px-3"
            disabled={isSaving}
          >
            Cancelar
          </button>
          {selectedTaxon && (
            <button
              type="button"
              onClick={guardarEspecie}
              disabled={isSaving}
              className="btn btn-primary text-xs min-h-9 px-4 inline-flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              <span>{isSaving ? 'Guardando…' : 'Incorporar al Catálogo'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
