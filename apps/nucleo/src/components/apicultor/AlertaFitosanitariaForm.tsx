'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, toast } from '@enjambre/ui';
import { X, Check } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!producto || !comuna || !zona) {
      toast.error('Complete todos los campos de la alerta');
      return;
    }

    setLoading(true);
    try {
      const resMe = await apiFetch('/api/registro-territorial/actores/me');
      let actorId = '00000000-0000-0000-0000-000000000000';
      if (resMe.ok) {
        const jsonMe = await resMe.json();
        if (jsonMe?.data?.id) {
          actorId = jsonMe.data.id;
        }
      }

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
        throw new Error('Error al generar alerta fitosanitaria');
      }

      toast.success('Alerta emitida al enjambre territorial');
      onSuccess();
    } catch {
      toast.error('Ocurrió un error al emitir la alerta fitosanitaria');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="bg-card border-border w-full max-w-lg shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Emitir Alerta Fitosanitaria
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Aviso temprano al territorio para protección de apiarios
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Producto o Agente
              </label>
              <input
                type="text"
                value={producto}
                onChange={(e) => setProducto(e.target.value)}
                placeholder="Ej. Aplicación insecticida foliar"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Tipo de Producto
                </label>
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
                <label className="text-sm font-medium text-foreground">
                  Fecha y Hora Programada
                </label>
                <input
                  type="datetime-local"
                  value={fechaProgramada}
                  onChange={(e) => setFechaProgramada(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Comuna
                </label>
                <input
                  type="text"
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  placeholder="Ej. Chonchi"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Sector / Zona
                </label>
                <input
                  type="text"
                  value={zona}
                  onChange={(e) => setZona(e.target.value)}
                  placeholder="Ej. Huillinco - Norte"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-border text-foreground"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="h-4 w-4 mr-2" />
                Emitir Alerta
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
