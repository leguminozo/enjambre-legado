'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, toast } from '@enjambre/ui';
import { X, Check } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface ActorResumen {
  id: string;
  nombre_actor: string;
  rol: string;
}

interface PredioResumen {
  id: string;
  nombre?: string;
  comuna: string;
  zona: string;
  actores_registro?: {
    nombre_actor: string;
  };
}

interface ApiarioExternoFormProps {
  onClose: () => void;
  onSuccess: () => void;
  actores: ActorResumen[];
  predios: PredioResumen[];
  fixedActorId?: string;
  fixedActorName?: string;
}

export function ApiarioExternoForm({ actores, predios, fixedActorId, fixedActorName, onClose, onSuccess }: ApiarioExternoFormProps) {
  const apiFetch = useApiFetch();
  const [loading, setLoading] = useState(false);
  
  const [actorId, setActorId] = useState(fixedActorId || (actores.length > 0 ? actores[0].id : ''));
  const [predioId, setPredioId] = useState('');
  const [nColmenas, setNColmenas] = useState('');
  const [comunaOrigen, setComunaOrigen] = useState('');
  const [comunaDestino, setComunaDestino] = useState('');
  const [zonaDestino, setZonaDestino] = useState('');
  const [latAproximada, setLatAproximada] = useState('');
  const [lngAproximada, setLngAproximada] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState(new Date().toISOString().split('T')[0]);
  const [certSanitariaFecha, setCertSanitariaFecha] = useState('');
  const [bioseguridadDeclarada, setBioseguridadDeclarada] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorId || !nColmenas || !comunaOrigen || !comunaDestino || !zonaDestino || !fechaIngreso) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/registro-territorial/apiarios-externos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: actorId,
          predio_id: predioId || undefined,
          n_colmenas: parseInt(nColmenas),
          comuna_origen: comunaOrigen,
          comuna_destino: comunaDestino,
          zona_destino: zonaDestino,
          lat_aproximada: latAproximada ? parseFloat(latAproximada) : undefined,
          lng_aproximada: lngAproximada ? parseFloat(lngAproximada) : undefined,
          fecha_ingreso: fechaIngreso,
          cert_sanitaria_fecha: certSanitariaFecha || undefined,
          bioseguridad_declarada: bioseguridadDeclarada || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Error al declarar apiario externo');
      }

      toast.success('Ingreso declarado correctamente');
      onSuccess();
    } catch {
      toast.error('Ocurrió un error al declarar el apiario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="bg-card border-border w-full max-w-lg shadow-lg my-8">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg font-semibold text-foreground">
              Declarar Ingreso Trashumante
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Registre apiarios externos entrando al territorio
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
            {!fixedActorId && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Apicultor Trashumante <span className="text-destructive">*</span>
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
                <label className="text-sm font-medium text-foreground">Apicultor Trashumante</label>
                <div className="w-full rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground">
                  {fixedActorName || 'Mi Perfil'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  N° de Colmenas <span className="text-destructive">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={nColmenas}
                  onChange={(e) => setNColmenas(e.target.value)}
                  placeholder="Ej. 120"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Fecha Ingreso <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={fechaIngreso}
                  onChange={(e) => setFechaIngreso(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Predio Facilitador de Destino (Opcional)
              </label>
              <select
                value={predioId}
                onChange={(e) => setPredioId(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No asociado / Desconocido</option>
                {predios.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre ? p.nombre : `Predio en ${p.comuna}`} ({p.actores_registro?.nombre_actor || 'Sin dueño'})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Comuna Origen
                </label>
                <input
                  type="text"
                  value={comunaOrigen}
                  onChange={(e) => setComunaOrigen(e.target.value)}
                  placeholder="Ej. Los Ángeles"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Comuna Destino (Chiloé)
                </label>
                <input
                  type="text"
                  value={comunaDestino}
                  onChange={(e) => setComunaDestino(e.target.value)}
                  placeholder="Ej. Castro"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Zona / Sector Destino
              </label>
              <input
                type="text"
                value={zonaDestino}
                onChange={(e) => setZonaDestino(e.target.value)}
                placeholder="Ej. Sector Nercón, Parcela 4"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Latitud (Aprox)
                </label>
                <input
                  type="number"
                  step="any"
                  value={latAproximada}
                  onChange={(e) => setLatAproximada(e.target.value)}
                  placeholder="-42.48"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Longitud (Aprox)
                </label>
                <input
                  type="number"
                  step="any"
                  value={lngAproximada}
                  onChange={(e) => setLngAproximada(e.target.value)}
                  placeholder="-73.76"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Fecha Certificado Sanitario SAG (Opcional)
              </label>
              <input
                type="date"
                value={certSanitariaFecha}
                onChange={(e) => setCertSanitariaFecha(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Declaración de Bioseguridad (Opcional)
              </label>
              <textarea
                value={bioseguridadDeclarada}
                onChange={(e) => setBioseguridadDeclarada(e.target.value)}
                placeholder="Ej. Las colmenas fueron tratadas con acaricida el mes pasado, se cuenta con certificado de varroa negativo..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary h-20 resize-none"
              />
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
                Declarar Ingreso
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
