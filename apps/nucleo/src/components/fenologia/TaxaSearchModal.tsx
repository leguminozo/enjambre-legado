'use client';

import { useState, useEffect, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Search, Loader2, Flower2, Check, X, AlertCircle, ChevronRight, Leaf, MapPin } from 'lucide-react';
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
        className={`w-12 h-12 rounded-xl bg-surface-raised border border-border/60 flex items-center justify-center text-muted-foreground text-sm shrink-0 select-none ${className ?? ''}`}
      >
        <Leaf className="w-5 h-5 text-muted-foreground opacity-60" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      onError={() => setHasError(true)}
      className={`w-12 h-12 rounded-xl object-cover border border-border/60 shrink-0 ${className ?? ''}`}
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
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

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

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[220] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <button
        type="button"
        className={`fixed inset-0 ${overlayBackdropClassName}`}
        aria-label="Cerrar modal"
        onClick={onClose}
      />

      {/* Modal Card ampliado para escritorio y centrado */}
      <div className="relative z-10 w-full max-w-4xl lg:max-w-5xl bg-card border border-border rounded-2xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 fade-in-0 duration-200 max-h-[90vh] flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 pb-3.5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Flower2 size={18} />
            </div>
            <div>
              <h3 className="font-display text-lg text-foreground">
                Añadir Especie Botánica
              </h3>
              <p className="text-xs text-muted-foreground">
                Integración con el catálogo taxonómico de flora melífera de Chile
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

        <div className="overflow-y-auto space-y-4 pr-1 flex-1">
          {!selectedTaxon ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Buscador Taxonómico (Flora Nativa e Introducida de Chile)
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Ej. Diente de león, Ulmo, Rubus ulmifolius, Quillay, Tiaca, Arrayán…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl pl-10 pr-10 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
                    autoFocus
                  />
                  {isSearching && (
                    <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Conectado al catálogo abierto de biodiversidad botánica con nombres aceptados y fotos de referencia.
                </p>
              </div>

              {results.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>Resultados encontrados: <strong className="text-foreground">{results.length}</strong></span>
                    <span>Selecciona una especie para calibrar sus parámetros</span>
                  </div>
                  {/* Grid de 2 columnas en desktop para aprovechar el espacio */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[50vh] overflow-y-auto border border-border/60 rounded-xl p-2.5 bg-surface-sunken/40">
                    {results.map((r, i) => (
                      <div
                        key={i}
                        onClick={() => seleccionarTaxon(r)}
                        className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:border-primary/50 hover:bg-surface-raised cursor-pointer transition-all group shadow-sm"
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
                        <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-surface-raised border border-border/50 text-muted-foreground group-hover:border-primary/40 group-hover:text-primary transition-all flex items-center gap-1 shrink-0 ml-2">
                          Elegir
                          <ChevronRight size={13} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : query.length >= 2 && !isSearching ? (
                <div className="text-center py-10 text-sm text-muted-foreground bg-surface-sunken/30 rounded-xl border border-dashed border-border p-6">
                  <Leaf className="w-8 h-8 text-muted-foreground opacity-50 mx-auto mb-2" />
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
            /* Formulario de confirmación y propiedades de la especie en 2 columnas en desktop */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-sunken border border-border">
                <div className="flex items-center gap-3.5 min-w-0">
                  <TaxaPhoto url={fotoUrl} alt={nombreComun} className="w-14 h-14" />
                  <div className="min-w-0">
                    <h4 className="text-base font-semibold text-foreground truncate">{nombreComun}</h4>
                    <p className="text-xs text-muted-foreground italic truncate font-mono">{nombreCientifico}</p>
                    {familia && <span className="text-[11px] text-primary">{familia}</span>}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTaxon(null)}
                  className="text-xs text-muted-foreground hover:text-foreground underline px-3 py-1.5 rounded-lg hover:bg-surface-raised transition"
                >
                  Cambiar especie
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Columna 1: Taxonomía e Identidad */}
                <div className="space-y-3.5 p-4 rounded-xl border border-border/60 bg-surface-sunken/30">
                  <h5 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                    Identidad Botánica
                  </h5>

                  <label className="block space-y-1">
                    <span className="text-muted-foreground uppercase font-medium">Nombre Común</span>
                    <input
                      type="text"
                      value={nombreComun}
                      onChange={(e) => setNombreComun(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                      required
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-muted-foreground uppercase font-medium">Nombre Científico</span>
                    <input
                      type="text"
                      value={nombreCientifico}
                      onChange={(e) => setNombreCientifico(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground font-mono text-sm"
                      required
                    />
                  </label>

                  <label className="block space-y-1">
                    <span className="text-muted-foreground uppercase font-medium">Familia Botánica</span>
                    <input
                      type="text"
                      value={familia}
                      onChange={(e) => setFamilia(e.target.value)}
                      placeholder="Ej. Myrtaceae, Winteraceae, Cunoniaceae…"
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="block space-y-1">
                      <span className="text-muted-foreground uppercase font-medium">Origen</span>
                      <select
                        value={origen}
                        onChange={(e) => setOrigen(e.target.value as typeof origen)}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground text-xs"
                      >
                        <option value="nativa">Nativa</option>
                        <option value="endemica">Endémica de Chile</option>
                        <option value="introducida">Introducida</option>
                        <option value="naturalizada">Naturalizada</option>
                      </select>
                    </label>

                    <label className="block space-y-1">
                      <span className="text-muted-foreground uppercase font-medium">Hábito</span>
                      <select
                        value={habito}
                        onChange={(e) => setHabito(e.target.value as typeof habito)}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground text-xs"
                      >
                        <option value="arbol">Árbol</option>
                        <option value="arbusto">Arbusto</option>
                        <option value="herbacea">Herbácea</option>
                        <option value="enredadera">Enredadera</option>
                        <option value="palmera">Palmera</option>
                        <option value="otro">Otro</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Columna 2: Modelo Fenológico y Parámetros Apícolas */}
                <div className="space-y-3.5 p-4 rounded-xl border border-border/60 bg-surface-sunken/30">
                  <h5 className="font-semibold text-foreground text-xs uppercase tracking-wider">
                    Oráculo Térmico y Apicultura
                  </h5>

                  <label className="block space-y-1">
                    <span className="text-muted-foreground uppercase font-medium">Relevancia Melífera</span>
                    <select
                      value={relevanciaApicola}
                      onChange={(e) => setRelevanciaApicola(e.target.value as typeof relevanciaApicola)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-foreground text-sm"
                    >
                      <option value="nectar">Nectarífera principal</option>
                      <option value="polen">Polinífera</option>
                      <option value="mixta">Mixta (Néctar y Polen)</option>
                      <option value="propoleo">Propóleo / Resinas</option>
                      <option value="melada">Melada de bosque</option>
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    <label className="block space-y-1">
                      <span className="text-muted-foreground uppercase font-medium">Temp. Base (°C)</span>
                      <input
                        type="number"
                        step="0.5"
                        value={tbase}
                        onChange={(e) => setTbase(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground font-mono text-sm"
                      />
                    </label>

                    <label className="block space-y-1">
                      <span className="text-muted-foreground uppercase font-medium">Umbral GDD (°d)</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Ej. 450.0"
                        value={gddUmbral}
                        onChange={(e) => setGddUmbral(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg px-2.5 py-2 text-foreground font-mono text-sm"
                      />
                    </label>
                  </div>

                  <div className="pt-2 border-t border-border/50">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={monitoreoActivo}
                        onChange={(e) => setMonitoreoActivo(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-4 h-4 bg-background mt-0.5"
                      />
                      <div>
                        <span className="text-xs font-medium text-foreground">
                          Monitorear activamente en el Oráculo Fenológico
                        </span>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Calculará pronóstico térmico diario según los grados día acumulados en Chiloé.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline text-xs min-h-9 px-4"
            disabled={isSaving}
          >
            Cancelar
          </button>
          {selectedTaxon && (
            <button
              type="button"
              onClick={guardarEspecie}
              disabled={isSaving}
              className="btn btn-primary text-xs min-h-9 px-5 inline-flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              <span>{isSaving ? 'Guardando…' : 'Incorporar al Catálogo'}</span>
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
