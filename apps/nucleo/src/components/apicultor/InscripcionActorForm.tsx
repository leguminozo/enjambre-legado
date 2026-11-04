'use client';

import { useState, useEffect } from 'react';
import { Button, toast, ImmersiveModal } from '@enjambre/ui';
import { Check, Sparkles } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { validarRUT, formatearRUT } from '@/lib/rut';
import { TERRITORIAL_ROL_OPTIONS } from '@/lib/territorial-rol';
import { CHILE_REGIONES, getComunasPorRegion } from '@enjambre/logistica';

interface UnclaimedActor {
  id: string;
  nombre_actor: string;
  comuna: string;
  region: string;
  rol: string;
  n_apiarios: number;
  n_colmenas: number;
  apiarios_nombres: string[];
}

interface InscripcionActorFormProps {
  onClose: () => void;
  onSuccess: () => void;
  /** self-rescue: prefill signup metadata. admin: catastro vacío. */
  mode?: 'self-rescue' | 'admin';
}

const ROLES_VALIDOS = TERRITORIAL_ROL_OPTIONS;

function metaString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function InscripcionActorForm({
  onClose,
  onSuccess,
  mode = 'admin',
}: InscripcionActorFormProps) {
  const apiFetch = useApiFetch();
  const authUser = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const meta = (session?.user.user_metadata ?? {}) as Record<string, unknown>;
  const isRescue = mode === 'self-rescue';

  const [loading, setLoading] = useState(false);
  const [nombreActor, setNombreActor] = useState(
    isRescue ? (authUser?.full_name || metaString(meta.full_name)) : '',
  );
  const [sugerencias, setSugerencias] = useState<UnclaimedActor[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [actorReclamado, setActorReclamado] = useState<UnclaimedActor | null>(null);
  const [rol, setRol] = useState(() => {
    const raw =
      (isRescue ? metaString(meta.territorial_rol) || authUser?.territorial_rol : '') ||
      'api_residente';
    return ROLES_VALIDOS.some((o) => o.value === raw) ? raw : 'api_residente';
  });
  const [comuna, setComuna] = useState(isRescue ? metaString(meta.territorial_comuna) : '');
  const [region, setRegion] = useState(isRescue ? metaString(meta.territorial_region) : '');

  const comunasDisponibles = getComunasPorRegion(region);

  function handleRegionChange(newRegion: string) {
    setRegion(newRegion);
    setComuna('');
  }

  // Autocompletado inteligente de asentamientos comunitarios precargados (KMZ / Catastro)
  useEffect(() => {
    if (actorReclamado) {
      setSugerencias([]);
      return;
    }
    const q = nombreActor.trim();
    if (q.length < 3) {
      setSugerencias([]);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const res = await apiFetch(
          `/api/registro-territorial/actores/buscar-unclaimed?q=${encodeURIComponent(q)}`,
        );
        if (res.ok) {
          const json = (await res.json()) as { data?: UnclaimedActor[] };
          setSugerencias(json.data ?? []);
        }
      } catch {
        // Fallo no intrusivo en búsqueda de sugerencias
      } finally {
        setBuscando(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [nombreActor, actorReclamado, apiFetch]);

  function handleReclamar(sug: UnclaimedActor) {
    setActorReclamado(sug);
    setNombreActor(sug.nombre_actor);
    if (sug.region) setRegion(sug.region);
    if (sug.comuna) setComuna(sug.comuna);
    if (sug.rol && ROLES_VALIDOS.some((r) => r.value === sug.rol)) {
      setRol(sug.rol);
    }
    setSugerencias([]);
  }

  function handleDesvincular() {
    setActorReclamado(null);
  }

  const [rut, setRut] = useState('');
  const [telefono, setTelefono] = useState('');
  const [rup, setRup] = useState('');
  const [aceptaCarta, setAceptaCarta] = useState(
    isRescue ? meta.territorial_acepta_carta === true : false,
  );
  const [aceptaPoliticaDatos, setAceptaPoliticaDatos] = useState(
    isRescue ? meta.territorial_acepta_politica_datos === true : false,
  );

  const consent =
    isRescue && meta.territorial_consentimientos && typeof meta.territorial_consentimientos === 'object'
      ? (meta.territorial_consentimientos as Record<string, unknown>)
      : {};
  const [mapaComunitario, setMapaComunitario] = useState(consent.mapa_comunitario === true);
  const [alertasFitosanitarias, setAlertasFitosanitarias] = useState(
    consent.alertas_fitosanitarias !== false,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreActor || !comuna || !region) {
      toast.error('Complete todos los campos requeridos');
      return;
    }
    if (rut && !validarRUT(rut)) {
      toast.error('El RUT ingresado no es válido');
      return;
    }
    if (!aceptaCarta || !aceptaPoliticaDatos) {
      toast.error('Debes aceptar la Carta Constitutiva y la política de datos para inscribirte');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/registro-territorial/actores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reclamar_actor_id: actorReclamado ? actorReclamado.id : undefined,
          nombre_actor: nombreActor,
          rol,
          comuna,
          region,
          rut: rut ? formatearRUT(rut) : undefined,
          telefono: telefono.trim() || undefined,
          rup: rup.trim() || undefined,
          acepta_carta: aceptaCarta,
          acepta_politica_datos: aceptaPoliticaDatos,
          consentimientos: {
            mapa_comunitario: mapaComunitario,
            alertas_fitosanitarias: alertasFitosanitarias,
          }
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Error al inscribir actor en el registro');
      }

      if (actorReclamado) {
        toast.success('¡Asentamiento vinculado con éxito! Se desbloquearon tus colmenas.');
      } else {
        toast.success('Inscripción completada correctamente');
      }
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ocurrió un error al registrar en el catastro territorial');
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
      title="Inscribirse en Catastro Territorial"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 w-full">
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={loading} className="w-full sm:w-auto" onClick={() => void handleSubmit({ preventDefault() {} } as React.FormEvent)}>
            <Check className="h-4 w-4 mr-2" />
            Confirmar Inscripción
          </Button>
        </div>
      }
    >
      <p className="text-sm text-muted-foreground -mt-2 mb-4">
        Regístrese para articular la bioseguridad del enjambre apícola
      </p>
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
                {ROLES_VALIDOS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Nombre o Razón Social <span className="text-destructive">*</span>
                </label>
                {buscando && (
                  <span className="text-[11px] text-muted-foreground animate-pulse">
                    Buscando en catastro...
                  </span>
                )}
              </div>
              <input
                type="text"
                value={nombreActor}
                onChange={(e) => {
                  setNombreActor(e.target.value);
                  if (actorReclamado) setActorReclamado(null);
                }}
                placeholder="Ej. Víctor Ariel Ojeda"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />

              {actorReclamado ? (
                <div className="rounded-lg border border-primary/40 bg-primary/5 p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        Asentamiento comunitario vinculado
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDesvincular}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline"
                    >
                      Cambiar
                    </button>
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {actorReclamado.nombre_actor}
                  </div>
                  <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                    <span>{actorReclamado.comuna}, {actorReclamado.region}</span>
                    <span>•</span>
                    <span>{actorReclamado.n_apiarios} {actorReclamado.n_apiarios === 1 ? 'apiario' : 'apiarios'}</span>
                    <span>•</span>
                    <span>{actorReclamado.n_colmenas} colmenas registradas</span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 italic pt-1 border-t border-border/50">
                    Al confirmar, desbloquearás de inmediato todos los apiarios y colmenas de este registro.
                  </p>
                </div>
              ) : sugerencias.length > 0 ? (
                <div className="rounded-lg border border-border bg-card/90 p-3 space-y-2.5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Asentamiento detectado en el catastro</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Detectamos registros con nombres coincidentes. Puedes vincular tu asentamiento con 1 clic para no tener que cargarlo de cero:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {sugerencias.map((sug) => (
                      <div
                        key={sug.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-md border border-border/60 bg-background hover:border-primary/50 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{sug.nombre_actor}</p>
                          <p className="text-xs text-muted-foreground">
                            {sug.comuna} · {sug.n_apiarios} {sug.n_apiarios === 1 ? 'apiario' : 'apiarios'} · {sug.n_colmenas} colmenas
                          </p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="shrink-0 text-xs h-7"
                          onClick={() => handleReclamar(sug)}
                        >
                          Reclamar registro
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  RUT <span className="text-muted-foreground text-xs">(recomendado)</span>
                </label>
                <input
                  type="text"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  onBlur={() => rut && setRut(formatearRUT(rut))}
                  placeholder="12.345.678-9"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {rut && !validarRUT(rut) && (
                  <p className="text-xs text-destructive">RUT no válido</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Teléfono <span className="text-muted-foreground text-xs">(recomendado)</span>
                </label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="+56 9 ..."
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                RUP (Registro Único Pecuario SAG) <span className="text-muted-foreground text-xs">— opcional</span>
              </label>
              <input
                type="text"
                value={rup}
                onChange={(e) => setRup(e.target.value)}
                placeholder="Número de tu registro SAG, si lo tienes"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Región <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={region}
                  onChange={(e) => handleRegionChange(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option value="">Selecciona una región</option>
                  {CHILE_REGIONES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Comuna <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  value={comuna}
                  onChange={(e) => setComuna(e.target.value)}
                  disabled={!region}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {region ? 'Selecciona una comuna' : 'Primero selecciona una región'}
                  </option>
                  {comunasDisponibles.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-2 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={aceptaCarta}
                    onChange={(e) => setAceptaCarta(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    Acepto la <a href="/carta" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Carta Constitutiva Apícola Territorial</a> <span className="text-destructive">*</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Infraestructura colectiva, autónoma y no extractiva: consentimiento informado y beneficio recíproco.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={aceptaPoliticaDatos}
                    onChange={(e) => setAceptaPoliticaDatos(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-background"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    Acepto la política de datos y privacidad <span className="text-destructive">*</span>
                  </span>
                  <span className="text-xs text-muted-foreground">Tus datos quedan bajo resguardo: puedes corregirlos, descargarlos y retirar consentimientos.</span>
                </div>
              </label>
            </div>

          </form>
    </ImmersiveModal>
  );
}
