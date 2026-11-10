'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flower2, Plus, Search, Sliders, Check } from 'lucide-react';
import { ViewShell } from '@/components/layout/ViewShell';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { TaxaSearchModal } from '@/components/fenologia/TaxaSearchModal';
import { CalibracionModal } from '@/components/fenologia/CalibracionModal';

interface Especie {
  id: string;
  nombre_comun: string;
  nombre_cientifico: string;
  familia: string | null;
  gdd_umbral: number | null;
  gdd_stddev: number | null;
  tbase_c?: number;
  t_base?: number;
  ventana_ini?: number | null;
  ventana_fin?: number | null;
  mes_inicio_floracion?: number | null;
  mes_fin_floracion?: number | null;
  origen?: 'nativa' | 'endemica' | 'introducida' | 'naturalizada';
  habito?: 'arbol' | 'arbusto' | 'herbacea' | 'enredadera' | 'palmera' | 'otro';
  relevancia_apicola?: 'nectar' | 'polen' | 'mixta' | 'propoleo' | 'melada';
  monitoreo_activo?: boolean;
  foto_url?: string | null;
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

type FilterType = 'todas' | 'nativas' | 'introducidas' | 'monitoreadas';

export function EspeciesNativasView() {
  const apiFetch = useApiFetch();
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('todas');

  // Modales
  const [isTaxaModalOpen, setIsTaxaModalOpen] = useState(false);
  const [calibracionEspecie, setCalibracionEspecie] = useState<Especie | null>(null);

  const cargar = useCallback(async () => {
    const res = await apiFetch('/api/fenologia/especies/todas');
    if (res.ok) {
      const j = await res.json();
      setEspecies(j.data ?? []);
    }
    setLoading(false);
  }, [apiFetch]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const toggleMonitoreo = async (esp: Especie, e: React.MouseEvent) => {
    e.stopPropagation();
    const nuevoEstado = !esp.monitoreo_activo;
    // Optimistic update
    setEspecies((prev) =>
      prev.map((item) => (item.id === esp.id ? { ...item, monitoreo_activo: nuevoEstado } : item))
    );
    await apiFetch(`/api/fenologia/especies/${esp.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ monitoreo_activo: nuevoEstado }),
    });
  };

  const filteredEspecies = useMemo(() => {
    return especies.filter((esp) => {
      // Búsqueda por texto
      const q = search.toLowerCase().trim();
      const matchSearch =
        !q ||
        esp.nombre_comun.toLowerCase().includes(q) ||
        esp.nombre_cientifico.toLowerCase().includes(q) ||
        (esp.familia && esp.familia.toLowerCase().includes(q));

      if (!matchSearch) return false;

      // Filtro por categoría
      if (filterType === 'nativas') {
        return esp.origen === 'nativa' || esp.origen === 'endemica' || !esp.origen;
      }
      if (filterType === 'introducidas') {
        return esp.origen === 'introducida' || esp.origen === 'naturalizada';
      }
      if (filterType === 'monitoreadas') {
        return esp.monitoreo_activo !== false;
      }
      return true;
    });
  }, [especies, search, filterType]);

  const stats = useMemo(() => {
    const nativas = especies.filter((e) => e.origen === 'nativa' || e.origen === 'endemica' || !e.origen).length;
    const introducidas = especies.filter((e) => e.origen === 'introducida' || e.origen === 'naturalizada').length;
    const monitoreadas = especies.filter((e) => e.monitoreo_activo !== false).length;
    return { total: especies.length, nativas, introducidas, monitoreadas };
  }, [especies]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <ViewShell
        variant="compact"
        eyebrow="Bosque · Botánica"
        title="Catálogo Botánico Melífero"
        subtitle="Colección botánica de flora nativa y no nativa de Chile: umbrales térmicos (GDD), hábitos y relevancia apícola."
        icon={<Flower2 size={20} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTaxaModalOpen(true)}
              className="btn btn-primary text-xs inline-flex items-center gap-1.5 min-h-10 px-3.5"
            >
              <Plus size={15} />
              <span>Añadir Especie</span>
            </button>
          </div>
        }
      />

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre común, científico o familia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('todas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'todas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Todas ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('nativas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'nativas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Nativas ({stats.nativas})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('introducidas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'introducidas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            Introducidas ({stats.introducidas})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('monitoreadas')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
              filterType === 'monitoreadas'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface-raised border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            En Oráculo ({stats.monitoreadas})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando catálogo botánico…</p>
      ) : filteredEspecies.length === 0 ? (
        <div className="card p-8 border border-border rounded-xl text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No se encontraron especies con los filtros seleccionados.
          </p>
          <button
            type="button"
            onClick={() => setIsTaxaModalOpen(true)}
            className="btn btn-outline text-xs inline-flex items-center gap-1.5 mx-auto"
          >
            <Flower2 size={14} className="text-primary" />
            <span>Incorporar una nueva especie botánica</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEspecies.map((esp) => {
            const mesIni =
              esp.ventana_ini ?? esp.mes_inicio_floracion
                ? MESES[(esp.ventana_ini ?? esp.mes_inicio_floracion!) - 1]
                : '—';
            const mesFin =
              esp.ventana_fin ?? esp.mes_fin_floracion
                ? MESES[(esp.ventana_fin ?? esp.mes_fin_floracion!) - 1]
                : '—';
            const tbaseVal = esp.tbase_c ?? esp.t_base ?? 5.0;

            const esNativa = esp.origen === 'nativa' || esp.origen === 'endemica' || !esp.origen;

            return (
              <div
                key={esp.id}
                className="card p-5 border border-border bg-surface-raised space-y-3.5 rounded-xl hover:border-border/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      {esp.foto_url ? (
                        <img
                          src={esp.foto_url}
                          alt={esp.nombre_comun}
                          className="w-12 h-12 rounded-xl object-cover border border-border/60 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-surface-sunken border border-border/60 flex items-center justify-center text-lg shrink-0">
                          🌿
                        </div>
                      )}
                      <div>
                        <h3 className="text-base font-semibold text-foreground leading-tight">
                          {esp.nombre_comun}
                        </h3>
                        <p className="text-xs italic text-muted-foreground font-mono">
                          {esp.nombre_cientifico}
                        </p>
                        {esp.familia && (
                          <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                            {esp.familia}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => void toggleMonitoreo(esp, e)}
                      title={esp.monitoreo_activo ? 'Activa en el Oráculo' : 'Inactiva en el Oráculo'}
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border transition-colors shrink-0 ${
                        esp.monitoreo_activo
                          ? 'bg-success/10 text-success border-success/30'
                          : 'bg-muted/40 text-muted-foreground border-border'
                      }`}
                    >
                      {esp.monitoreo_activo ? 'En Oráculo' : 'Archivada'}
                    </button>
                  </div>

                  {/* Badges de atributos botánicos */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${
                        esNativa
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-warning/10 text-warning border-warning/20'
                      }`}
                    >
                      {esp.origen ?? 'Nativa'}
                    </span>
                    {esp.habito && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-surface-sunken text-muted-foreground border border-border/50">
                        {esp.habito}
                      </span>
                    )}
                    {esp.relevancia_apicola && (
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-wider bg-accent/15 text-accent border border-accent/30 font-medium">
                        {esp.relevancia_apicola}
                      </span>
                    )}
                  </div>

                  {/* Datos Fenológicos */}
                  <div className="text-xs space-y-1.5 border-t border-border/50 pt-2.5 mt-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ventana de floración</span>
                      <span className="font-medium text-foreground">
                        {mesIni} – {mesFin}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Temperatura base</span>
                      <span className="font-datos text-foreground">{tbaseVal}°C</span>
                    </div>
                  </div>
                </div>

                {/* Footer de Tarjeta con Umbral GDD y Calibración */}
                <div className="border-t border-border/50 pt-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">
                      Umbral GDD
                    </span>
                    <span className="font-datos text-sm font-semibold text-foreground">
                      {esp.gdd_umbral != null ? `${esp.gdd_umbral}°d` : 'Sin calibrar'}
                      {esp.gdd_stddev != null && (
                        <span className="text-xs text-muted-foreground font-normal ml-1">
                          ±{esp.gdd_stddev}
                        </span>
                      )}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCalibracionEspecie(esp)}
                    className="btn btn-outline text-xs min-h-8 px-2.5 inline-flex items-center gap-1.5"
                    title="Calibrar umbral GDD"
                  >
                    <Sliders size={13} className="text-primary" />
                    <span>Calibrar</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Búsqueda Taxonómica Asistida */}
      <TaxaSearchModal
        isOpen={isTaxaModalOpen}
        onClose={() => setIsTaxaModalOpen(false)}
        onEspecieCreada={cargar}
      />

      {/* Modal Contextual de Calibración Térmica */}
      <CalibracionModal
        especie={calibracionEspecie}
        isOpen={Boolean(calibracionEspecie)}
        onClose={() => setCalibracionEspecie(null)}
        onSaved={cargar}
      />
    </div>
  );
}
