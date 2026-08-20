'use client';

import { useState } from 'react';
import { Button, toast, ImmersiveModal } from '@enjambre/ui';
import { Check } from 'lucide-react';
import { useAuthStore } from '@enjambre/auth';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { validarRUT, formatearRUT } from '@/lib/rut';
import { TERRITORIAL_ROL_OPTIONS } from '@/lib/territorial-rol';

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
  const [rol, setRol] = useState(() => {
    const raw =
      (isRescue ? metaString(meta.territorial_rol) || authUser?.territorial_rol : '') ||
      'api_residente';
    return ROLES_VALIDOS.some((o) => o.value === raw) ? raw : 'api_residente';
  });
  const [comuna, setComuna] = useState(isRescue ? metaString(meta.territorial_comuna) : '');
  const [region, setRegion] = useState(isRescue ? metaString(meta.territorial_region) : '');
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
  const [catalogoInfraestructura, setCatalogoInfraestructura] = useState(
    consent.catalogo_infraestructura === true,
  );
  const [acopioCooperativo, setAcopioCooperativo] = useState(consent.acopio_cooperativo === true);

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
    <ImmersiveModal
      open
      onClose={onClose}
      size="lg"
      eyebrow="Territorio"
      title="Inscribirse en Catastro Territorial"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" disabled={loading} onClick={() => void handleSubmit({ preventDefault() {} } as React.FormEvent)}>
            <Check className="h-4 w-4 mr-2" />
            Confirmar Inscripción
          </Button>
        </>
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
                  <span className="text-xs text-muted-foreground">Tus datos se entregan en custodia: puedes corregirlos, descargarlos y retirar consentimientos.</span>
                </div>
              </label>
            </div>

          </form>
    </ImmersiveModal>
  );
}
