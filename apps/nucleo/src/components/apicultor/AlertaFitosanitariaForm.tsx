'use client';

import { useState } from 'react';
import { Button, toast, ImmersiveModal } from '@enjambre/ui';
import { Check } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface AlertaFitosanitariaFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AlertaFitosanitariaForm({ onClose, onSuccess }: AlertaFitosanitariaFormProps) {
  const apiFetch = useApiFetch();
  const [loading, setLoading] = useState(false);
  const [producto, setProducto] = useState('');
  const [comuna, setComuna] = useState('');
  const [zona, setZona] = useState('');
  const [tipoProducto, setTipoProducto] = useState('insecticida');
  const [fechaProgramada, setFechaProgramada] = useState(new Date().toISOString().slice(0, 16));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!producto || !comuna || !zona) {
      toast.error('Complete todos los campos de la alerta');
      return;
    }

    setLoading(true);
    try {
      const resMe = await apiFetch('/api/registro-territorial/actores/me');
      const jsonMe = resMe.ok ? await resMe.json() : null;
      if (!jsonMe?.data?.id) {
        // Sin actor inscrito no hay alerta posible: el BFF rechaza actor_id
        // ajeno/inválido para no-admin (fail-closed).
        toast.error('Debes estar inscrito en el Registro Territorial para emitir alertas');
        return;
      }
      const actorId = jsonMe.data.id;

      const res = await apiFetch('/api/registro-territorial/alertas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: actorId,
          producto,
          comuna,
          zona,
          tipo_producto: tipoProducto,
          fecha_programada: new Date(fechaProgramada).toISOString(),
          radio_km: 3,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al generar aviso preventivo');
      }

      toast.success('Aviso publicado. Se notificará a los apicultores en un radio de 3 km.');
      onSuccess();
    } catch {
      toast.error('Ocurrió un error al publicar el aviso preventivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImmersiveModal
      open
      onClose={onClose}
      size="md"
      eyebrow="Convivencia y Resguardo"
      title="Aviso Preventivo de Aplicación"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={loading} className="w-full sm:w-auto" onClick={() => void handleSubmit()}>
            <Check className="h-4 w-4 mr-2" />
            Publicar Aviso Preventivo
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Aviso temprano y de buena fe a tus vecinos apicultores para que resguarden sus piqueras.
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Producto o Agente</label>
          <input
            type="text"
            value={producto}
            onChange={(e) => setProducto(e.target.value)}
            placeholder="Ej. Aplicación insecticida foliar"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tipo de Producto</label>
            <select
              value={tipoProducto}
              onChange={(e) => setTipoProducto(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="insecticida">Insecticida</option>
              <option value="fungicida">Fungicida</option>
              <option value="herbicida">Herbicida</option>
              <option value="acaricida">Acaricida</option>
              <option value="fertilizante">Fertilizante</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Fecha y Hora Programada</label>
            <input
              type="datetime-local"
              value={fechaProgramada}
              onChange={(e) => setFechaProgramada(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Comuna</label>
            <input
              type="text"
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              placeholder="Ej. Chonchi"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Sector / Zona</label>
            <input
              type="text"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder="Ej. Huillinco - Norte"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </form>
    </ImmersiveModal>
  );
}
