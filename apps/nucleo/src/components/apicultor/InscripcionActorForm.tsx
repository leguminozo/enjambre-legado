'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, toast } from '@enjambre/ui';
import { X, Check } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface InscripcionActorFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function InscripcionActorForm({ onClose, onSuccess }: InscripcionActorFormProps) {
  const apiFetch = useApiFetch();
  const [loading, setLoading] = useState(false);
  const [nombreActor, setNombreActor] = useState('');
  const [rol, setRol] = useState('api_residente');
  const [comuna, setComuna] = useState('');
  const [region, setRegion] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreActor || !comuna || !region) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/registro-territorial/actores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_actor: nombreActor,
          rol,
          comuna,
          region,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al inscribir actor en el registro');
      }

      toast.success('Inscripción completada correctamente');
      onSuccess();
    } catch {
      toast.error('Ocurrió un error al registrar en el catastro territorial');
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
              Inscribirse en Catastro Territorial
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Regístrese para articular la bioseguridad del enjambre apícola
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
                Rol en el Territorio
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="api_residente">Apicultor/a Residente</option>
                <option value="api_trashumante">Apicultor/a Trashumante</option>
                <option value="api_mixto">Apicultor/a Mixto</option>
                <option value="predio_agricultor">Predio Agrícola / Facilitador</option>
                <option value="brigada_sanitaria">Brigada Sanitaria</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Nombre o Razón Social
              </label>
              <input
                type="text"
                value={nombreActor}
                onChange={(e) => setNombreActor(e.target.value)}
                placeholder="Ej. Apiario Nativos de Chiloé"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
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
                  placeholder="Ej. Castro"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Región
                </label>
                <input
                  type="text"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  placeholder="Ej. Los Lagos"
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
                Confirmar Inscripción
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
