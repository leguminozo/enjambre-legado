'use client';

import { useEffect, useState } from 'react';
import { Button, toast, ImmersiveModal } from '@enjambre/ui';
import { Check, FileUp } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { supabase } from '@/lib/supabase';

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
  /** Gap 1B: apiario operativo prefijado (salida trashumante desde /colmenas). */
  initialApiarioId?: string;
}

export function ApiarioExternoForm({ actores, predios, fixedActorId, fixedActorName, initialApiarioId, onClose, onSuccess }: ApiarioExternoFormProps) {
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
  const [certSanitariaLab, setCertSanitariaLab] = useState('');
  const [certArchivo, setCertArchivo] = useState<File | null>(null);
  const [bioseguridadDeclarada, setBioseguridadDeclarada] = useState('');

  // Cruce bidireccional con la herramienta operativa: si el ingreso llega a un
  // apiario que ya existe en /colmenas, se liga desde el nacimiento.
  const [misApiarios, setMisApiarios] = useState<{ id: string; name: string | null }[]>([]);
  const [apiarioOperativoId, setApiarioOperativoId] = useState('');

  useEffect(() => {
    supabase
      .from('apiarios')
      .select('id, name')
      .order('name')
      .then(({ data }: { data: { id: string; name: string | null }[] | null }) =>
        setMisApiarios(data ?? []),
      );
  }, []);

  // Gap 1B: si vienes de "Declarar salida" en /colmenas, prellena al apiario.
  useEffect(() => {
    if (initialApiarioId) void elegirApiarioOperativo(initialApiarioId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialApiarioId]);

  const elegirApiarioOperativo = async (id: string) => {
    setApiarioOperativoId(id);
    if (!id) return;
    const { count } = await supabase
      .from('colmenas')
      .select('id', { count: 'exact', head: true })
      .eq('apiario_id', id);
    if (count && count > 0) setNColmenas(String(count));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actorId || !nColmenas || !comunaOrigen || !comunaDestino || !zonaDestino || !fechaIngreso) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    setLoading(true);
    try {
      // Subir el certificado sanitario al bucket privado (si se adjuntó)
      let certUrl: string | undefined;
      if (certArchivo) {
        const safeName = certArchivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${actorId}/${Date.now()}-${safeName}`;
        const { error: uploadErr } = await supabase.storage
          .from('certificados-sanitarios')
          .upload(path, certArchivo, { contentType: certArchivo.type || 'application/pdf' });
        if (uploadErr) throw new Error('Error al subir el certificado sanitario');
        certUrl = path;
      }

      const res = await apiFetch('/api/registro-territorial/apiarios-externos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor_id: actorId,
          predio_id: predioId || undefined,
          apiario_operativo_id: apiarioOperativoId || undefined,
          n_colmenas: parseInt(nColmenas),
          comuna_origen: comunaOrigen,
          comuna_destino: comunaDestino,
          zona_destino: zonaDestino,
          lat_aproximada: latAproximada ? parseFloat(latAproximada) : undefined,
          lng_aproximada: lngAproximada ? parseFloat(lngAproximada) : undefined,
          fecha_ingreso: fechaIngreso,
          cert_sanitaria_url: certUrl,
          cert_sanitaria_fecha: certSanitariaFecha || undefined,
          cert_sanitaria_lab: certSanitariaLab.trim() || undefined,
          bioseguridad_declarada: bioseguridadDeclarada || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al declarar apiario externo');
      }

      const json = await res.json().catch(() => null);
      if (json?.data?.estado === 'suspendido') {
        toast.warning('Declaración guardada pendiente de revisión: no cumple la distancia mínima legal al apiario registrado más cercano');
      } else {
        toast.success('Ingreso declarado correctamente');
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ocurrió un error al declarar el apiario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImmersiveModal
      open
      onClose={onClose}
      size="lg"
      eyebrow="Territorio"
      title="Declarar Ingreso Trashumante"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={loading} onClick={() => void handleSubmit({ preventDefault() {} } as React.FormEvent)}>
            <Check className="h-4 w-4 mr-2" />
            Declarar Ingreso
          </Button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Registre apiarios externos entrando al territorio
      </p>
      <p className="text-xs text-muted-foreground bg-surface-sunken border border-border rounded-lg px-3 py-2 mb-4 leading-relaxed">
        Al declarar, tu zona de destino aproximada (~1 km) será visible para la red durante la temporada. Tus coordenadas exactas nunca se publican.
      </p>
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

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                ¿Llega a un apiario que ya tienes en tu herramienta? <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <select
                value={apiarioOperativoId}
                onChange={(e) => void elegirApiarioOperativo(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">No / Lo crearé después</option>
                {misApiarios.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name || 'Apiario sin nombre'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Si lo asocias, el número de colmenas se prellena con tu conteo real y la declaración queda entrelazada con tus colmenas.
              </p>
            </div>

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

            <div className="border-t border-border pt-4 mt-2">
              <h3 className="text-sm font-medium text-foreground mb-1">
                Certificación Sanitaria
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Se pide certificado de laboratorio con antigüedad máxima de 30 días al ingreso (criterio territorial). No sustituye el FMC del SAG.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Fecha del Certificado
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
                    Laboratorio
                  </label>
                  <input
                    type="text"
                    value={certSanitariaLab}
                    onChange={(e) => setCertSanitariaLab(e.target.value)}
                    placeholder="Ej. Laboratorio Acreditado SAG"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <label className="text-sm font-medium text-foreground">
                  Adjuntar Certificado (PDF)
                </label>
                <label className="flex items-center gap-3 cursor-pointer border border-dashed border-border rounded-md px-3 py-2.5 hover:border-primary/50 transition-colors">
                  <FileUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground truncate flex-1">
                    {certArchivo ? certArchivo.name : 'Seleccionar archivo PDF'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => setCertArchivo(e.target.files?.[0] ?? null)}
                    className="hidden"
                  />
                </label>
                {certArchivo && (
                  <button
                    type="button"
                    onClick={() => setCertArchivo(null)}
                    className="text-xs text-destructive hover:underline"
                  >
                    Quitar archivo
                  </button>
                )}
              </div>
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

          </form>
    </ImmersiveModal>
  );
}
