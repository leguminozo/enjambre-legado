'use client';

import { useState } from 'react';
import { Button, toast, ImmersiveModal, Badge } from '@enjambre/ui';
import { Check, ShieldAlert, Clock, MapPin, Info } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { CHILE_COMUNAS_POR_REGION } from '@enjambre/logistica';

const COMUNAS_CHILOE_ALERTAS = [
  'Castro',
  'Ancud',
  'Quellón',
  'Dalcahue',
  'Chonchi',
  'Queilén',
  'Quemchi',
  'Puqueldón',
  'Quinchao',
  'Curaco de Vélez',
] as const;

const METODOS_APLICACION = [
  'Terrestre con tractor / barras',
  'Manual de espalda / lanza',
  'Nebulización / atomizador',
  'Dron agrícola (UAV)',
  'Aspersión mecánica',
  'Otro',
] as const;

interface AlertaFitosanitariaFormProps {
  actorId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AlertaFitosanitariaForm({ actorId: propActorId, onClose, onSuccess }: AlertaFitosanitariaFormProps) {
  const apiFetch = useApiFetch();
  const [loading, setLoading] = useState(false);
  const [producto, setProducto] = useState('');
  const [comuna, setComuna] = useState('Chonchi');
  const [zona, setZona] = useState('');
  const [tipoProducto, setTipoProducto] = useState<'insecticida' | 'fungicida' | 'herbicida' | 'acaricida' | 'fertilizante' | 'otro'>('insecticida');
  const [metodoAplicacion, setMetodoAplicacion] = useState<string>('Terrestre con tractor / barras');
  const [fechaProgramada, setFechaProgramada] = useState(new Date().toISOString().slice(0, 16));
  const [periodoCarenciaHoras, setPeriodoCarenciaHoras] = useState<number>(24);
  const [radioKm, setRadioKm] = useState<number>(3);
  const [origenAviso, setOrigenAviso] = useState<'local' | 'ordenanza_comunal' | 'sipec_sag'>('local');
  const [observaciones, setObservaciones] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!producto.trim() || !comuna.trim() || !zona.trim()) {
      toast.error('Complete el producto, la comuna y el sector / zona');
      return;
    }

    setLoading(true);
    try {
      let resolvedActorId = propActorId;
      if (!resolvedActorId) {
        const resMe = await apiFetch('/api/registro-territorial/actores/me');
        const jsonMe = resMe.ok ? await resMe.json() : null;
        if (!jsonMe?.data?.id) {
          toast.error('Debes estar inscrito en el Registro Territorial para emitir avisos de aplicación');
          return;
        }
        resolvedActorId = jsonMe.data.id;
      }

      const res = await apiFetch('/api/registro-territorial/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: resolvedActorId,
          producto: producto.trim(),
          comuna: comuna.trim(),
          zona: zona.trim(),
          tipo_producto: tipoProducto,
          metodo_aplicacion: metodoAplicacion || undefined,
          fecha_programada: new Date(fechaProgramada).toISOString(),
          periodo_carencia_horas: Number(periodoCarenciaHoras) || 0,
          radio_km: Number(radioKm) || 3,
          origen_aviso: origenAviso,
          observaciones: observaciones.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al generar aviso preventivo');
      }

      toast.success(`Aviso fitosanitario emitido. Notificando a apicultores en un radio de ${radioKm} km.`);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ocurrió un error al publicar el aviso preventivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImmersiveModal
      open
      onClose={onClose}
      size="lg"
      eyebrow="Convivencia y Bioseguridad Territorial"
      title="Emitir Aviso Fitosanitario Preventivo"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={loading} className="w-full sm:w-auto font-medium" onClick={() => void handleSubmit()}>
            <Check className="h-4 w-4 mr-2" />
            {loading ? 'Emitiendo aviso...' : 'Publicar Aviso en la Red'}
          </Button>
        </div>
      }
    >
      <div className="rounded-xl border border-border bg-surface-raised p-3.5 mb-5 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <ShieldAlert className="h-4 w-4 text-warning" />
          <span>Protocolo de Protección Apícola (Ley 21.489 y Ordenanzas Comunales)</span>
        </div>
        <p>
          Este aviso preventivo permite a los apicultores de la zona resguardar sus piqueras o proveer alimento de rescate, previniendo envenenamientos masivos y pérdidas del colmenar.
        </p>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {/* Producto comercial y principio activo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center justify-between">
            <span>Producto Comercial e Ingrediente Activo</span>
            <span className="text-[11px] text-muted-foreground font-normal">Requerido por norma SAG</span>
          </label>
          <input
            type="text"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            placeholder="Ej. Confidor (Imidacloprid) / Karate con Zeon (Lambda-cihalotrina)"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Tipo de producto y método de aplicación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de Producto</label>
            <select
              value={tipoProducto}
              onChange={(e) => setTipoProducto(e.target.value as typeof tipoProducto)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="insecticida">Insecticida (Riesgo Crítico Apícola)</option>
              <option value="fungicida">Fungicida</option>
              <option value="herbicida">Herbicida</option>
              <option value="acaricida">Acaricida</option>
              <option value="fertilizante">Fertilizante Foliar</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Método de Aplicación</label>
            <select
              value={metodoAplicacion}
              onChange={(e) => setMetodoAplicacion(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {METODOS_APLICACION.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Fecha y Carencia */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span>Fecha y Hora Programada</span>
            </label>
            <input
              type="datetime-local"
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Recomendación: Aplicar al atardecer o antes del alba, cuando no hay abejas pecoreando.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Periodo de Carencia y Resguardo (Horas)
            </label>
            <div className="flex gap-2 mb-1.5">
              {[12, 24, 48, 72].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setPeriodoCarenciaHoras(h)}
                  className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                    periodoCarenciaHoras === h
                      ? 'border-primary bg-primary/20 text-primary font-semibold'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {h} hrs
                </button>
              ))}
            </div>
            <input
              type="number"
              min={0}
              max={168}
              value={periodoCarenciaHoras}
              onChange={(e) => setPeriodoCarenciaHoras(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="Horas de resguardo"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Radio y Origen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center justify-between">
              <span>Radio de Afectación Preventiva</span>
              <span className="text-[11px] text-primary font-semibold">{radioKm} km</span>
            </label>
            <div className="flex gap-2">
              {[1, 3, 5, 8].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setRadioKm(km)}
                  className={`flex-1 text-xs py-1.5 rounded-md border transition-all text-center ${
                    radioKm === km
                      ? 'border-primary bg-primary/20 text-primary font-semibold'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {km} km {km === 3 ? '(Estándar)' : ''}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Estándar de 3 km conforme al radio de vuelo y pecoreo de la abeja melífera.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Origen del Aviso</label>
            <select
              value={origenAviso}
              onChange={(e) => setOrigenAviso(e.target.value as typeof origenAviso)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="local">Aviso Voluntario de Buena Fe (Vecino / Productor)</option>
              <option value="ordenanza_comunal">Cumplimiento Ordenanza Municipal Tipo</option>
              <option value="sipec_sag">Registro Oficial SIPEC / SAG</option>
            </select>
          </div>
        </div>

        {/* Comuna y Sector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span>Comuna</span>
            </label>
            <div className="flex flex-wrap gap-1 mb-1">
              {COMUNAS_CHILOE_ALERTAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setComuna(c)}
                  className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                    comuna.toLowerCase() === c.toLowerCase()
                      ? 'border-primary bg-primary/20 text-primary font-medium'
                      : 'border-border/60 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              list="alerta-comunas-list"
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              placeholder="Ej. Chonchi"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <datalist id="alerta-comunas-list">
              {Object.values(CHILE_COMUNAS_POR_REGION).flat().map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sector / Predio / Zona</label>
            <input
              type="text"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder="Ej. Notuco - Fundo Los Mañíos"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Indique el sector o hito de referencia para orientar a los colmenares cercanos.
            </p>
          </div>
        </div>

        {/* Observaciones y recomendaciones */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Instrucciones de Resguardo y Observaciones</span>
          </label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            placeholder="Ej. Se aplicará con boquillas antideriva y viento menor a 6 km/h. Se recomienda mantener piqueras cerradas hasta las 09:00 del día posterior."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>
      </form>
    </ImmersiveModal>
  );
}
