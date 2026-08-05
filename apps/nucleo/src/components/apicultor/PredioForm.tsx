'use client';

import { useState } from 'react';
import { Button, toast, ImmersiveModal } from '@enjambre/ui';
import { Check } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface ActorResumen {
  id: string;
  nombre_actor: string;
  rol: string;
}

interface PredioFormProps {
  actores: ActorResumen[];
  fixedActorId?: string;
  fixedActorName?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function PredioForm({ actores, fixedActorId, fixedActorName, onClose, onSuccess }: PredioFormProps) {
  const apiFetch = useApiFetch();
  const [loading, setLoading] = useState(false);

  const [actorId, setActorId] = useState(fixedActorId || '');
  const [nombre, setNombre] = useState('');
  const [comuna, setComuna] = useState('');
  const [zona, setZona] = useState('');
  const [superficie, setSuperficie] = useState('');
  const [condiciones, setCondiciones] = useState('');

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!actorId || !comuna || !zona) {
      toast.error('Complete los campos obligatorios: Actor, Comuna y Zona');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        actor_id: actorId,
        nombre: nombre || undefined,
        comuna,
        zona,
        superficie_ha: superficie ? parseFloat(superficie) : undefined,
        condiciones: condiciones || undefined,
      };

      const res = await apiFetch('/api/registro-territorial/predios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Error al registrar el predio');
      }

      toast.success('Predio registrado exitosamente');
      onSuccess();
    } catch {
      toast.error('Ocurrió un error al registrar el predio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImmersiveModal
      open
      onClose={onClose}
      size="md"
      eyebrow="Territorio"
      title="Registrar Predio Facilitador"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={loading} onClick={() => void handleSubmit()}>
            <Check className="h-4 w-4 mr-2" />
            Registrar Predio
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Inscriba un terreno disponible para apicultura
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {!fixedActorId && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Actor Propietario <span className="text-destructive">*</span>
            </label>
            <select
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Seleccione un actor...</option>
              {actores.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre_actor} ({a.rol})
                </option>
              ))}
            </select>
          </div>
        )}
        {fixedActorId && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Actor Propietario</label>
            <div className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
              {fixedActorName || 'Mi Perfil'}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Nombre del Predio (opcional)</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Parcela Los Notros"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Comuna <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              placeholder="Ej. Castro"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Zona / Sector <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={zona}
              onChange={(e) => setZona(e.target.value)}
              placeholder="Ej. Nercón"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Superficie Disponible (hectáreas)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={superficie}
            onChange={(e) => setSuperficie(e.target.value)}
            placeholder="Ej. 1.5"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Condiciones de Uso (opcional)</label>
          <textarea
            value={condiciones}
            onChange={(e) => setCondiciones(e.target.value)}
            placeholder="Ej. Acceso solo fines de semana, máximo 50 colmenas..."
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none"
          />
        </div>
      </form>
    </ImmersiveModal>
  );
}
