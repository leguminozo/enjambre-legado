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
  
  // Consentimientos
  const [mapaComunitario, setMapaComunitario] = useState(false);
  const [alertasFitosanitarias, setAlertasFitosanitarias] = useState(true);
  const [catalogoInfraestructura, setCatalogoInfraestructura] = useState(false);
  const [acopioCooperativo, setAcopioCooperativo] = useState(false);

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
          consentimientos: {
            mapa_comunitario: mapaComunitario,
            alertas_fitosanitarias: alertasFitosanitarias,
            catalogo_infraestructura: catalogoInfraestructura,
            acopio_cooperativo: acopioCooperativo
          }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 overflow-y-auto">
      <Card className="bg-card border-border w-full max-w-lg shadow-lg my-8">
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
                Nombre o Razón Social <span className="text-destructive">*</span>
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
                  Región <span className="text-destructive">*</span>
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

            <div className="border-t border-border pt-4 mt-2">
              <h3 className="text-sm font-medium text-foreground mb-3">Consentimientos de Privacidad</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Usted decide qué nivel de visibilidad y participación desea tener en la red territorial.
              </p>
              
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={mapaComunitario}
                      onChange={(e) => setMapaComunitario(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Mapa Comunitario</span>
                    <span className="text-xs text-muted-foreground">Acepto aparecer en el mapa comunitario (solo con ubicación aproximada, nunca exacta).</span>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={alertasFitosanitarias}
                      onChange={(e) => setAlertasFitosanitarias(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Alertas Fitosanitarias</span>
                    <span className="text-xs text-muted-foreground">Deseo recibir y emitir notificaciones sobre aplicaciones de plaguicidas en mi sector.</span>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={catalogoInfraestructura}
                      onChange={(e) => setCatalogoInfraestructura(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Catálogo de Infraestructura</span>
                    <span className="text-xs text-muted-foreground">Deseo participar en el sistema de reservas y arriendos compartidos (salas de extracción, etc.).</span>
                  </div>
                </label>
                
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={acopioCooperativo}
                      onChange={(e) => setAcopioCooperativo(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">Acopio Cooperativo</span>
                    <span className="text-xs text-muted-foreground">Tengo interés en participar en compras conjuntas o venta de miel en volumen.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-border">
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
