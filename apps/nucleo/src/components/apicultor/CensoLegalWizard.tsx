'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  UserRound, Leaf, MapPin, FileCheck2, CheckCircle2, Circle, Plus,
  Pencil, X, ShieldCheck,
} from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { validarRUT, formatearRUT } from '@/lib/rut';
import { Badge, Button, Spinner, toast } from '@enjambre/ui';

export interface ActorLegal {
  id: string;
  rol: string;
  nombre_actor: string;
  comuna: string;
  region?: string | null;
  rup?: string | null;
  rut?: string | null;
  telefono?: string | null;
  practicas_sanitarias?: string | null;
  metodo_control_varroa?: string | null;
  declaracion_existencia_animal?: boolean | null;
  acepta_carta?: boolean | null;
  acepta_politica_datos?: boolean | null;
  completo?: boolean | null;
  estado: string;
  nivel_acreditacion: string;
}

interface ApiarioRegistro {
  id: string;
  nombre?: string | null;
  comuna: string;
  zona: string;
  n_colmenas: number;
  categoria: string;
  activo: boolean;
  lat_aproximada?: number | null;
  lng_aproximada?: number | null;
}

interface CensoLegalWizardProps {
  actor: ActorLegal;
  onSaved: () => void;
}

const CATEGORIA_LABELS: Record<string, string> = {
  produccion: 'Producción',
  polinizacion: 'Polinización',
  seleccion_cria: 'Selección y Cría',
  otro: 'Otro',
};

export function CensoLegalWizard({ actor, onSaved }: CensoLegalWizardProps) {
  const apiFetch = useApiFetch();
  const [pasoAbierto, setPasoAbierto] = useState<string | null>('identidad');

  // ---- Paso 1: Identidad legal ----
  const [rut, setRut] = useState(actor.rut ?? '');
  const [telefono, setTelefono] = useState(actor.telefono ?? '');
  const [rup, setRup] = useState(actor.rup ?? '');
  const [declaracionExistencia, setDeclaracionExistencia] = useState(actor.declaracion_existencia_animal ?? false);
  const [savingIdentidad, setSavingIdentidad] = useState(false);

  // ---- Paso 2: Actividad y sanidad ----
  const [practicas, setPracticas] = useState(actor.practicas_sanitarias ?? '');
  const [metodoVarroa, setMetodoVarroa] = useState(actor.metodo_control_varroa ?? '');
  const [savingActividad, setSavingActividad] = useState(false);

  // Sincronizar estado local cuando se actualiza el actor en la base de datos
  useEffect(() => {
    setRut(actor.rut ?? '');
    setTelefono(actor.telefono ?? '');
    setRup(actor.rup ?? '');
    setDeclaracionExistencia(actor.declaracion_existencia_animal ?? false);
    setPracticas(actor.practicas_sanitarias ?? '');
    setMetodoVarroa(actor.metodo_control_varroa ?? '');
  }, [
    actor.rut,
    actor.telefono,
    actor.rup,
    actor.declaracion_existencia_animal,
    actor.practicas_sanitarias,
    actor.metodo_control_varroa,
  ]);

  // ---- Aceptación de Carta y política (suscritas en el alta) ----
  const [aceptaCartaLocal] = useState(actor.acepta_carta ?? true);
  const [aceptaPoliticaLocal] = useState(actor.acepta_politica_datos ?? true);

  // ---- Paso 3: Apiarios ----
  const [showApiarioForm, setShowApiarioForm] = useState(false);
  const [apiarioNombre, setApiarioNombre] = useState('');
  const [apiarioZona, setApiarioZona] = useState('');
  const [apiarioComuna, setApiarioComuna] = useState(actor.comuna);
  const [apiarioColmenas, setApiarioColmenas] = useState(10);
  const [apiarioCategoria, setApiarioCategoria] = useState('produccion');
  const [apiarioLat, setApiarioLat] = useState('');
  const [apiarioLng, setApiarioLng] = useState('');
  const [savingApiario, setSavingApiario] = useState(false);
  const [editandoApiario, setEditandoApiario] = useState<ApiarioRegistro | null>(null);

  const {
    data: apiariosData,
    isLoading: loadingApiarios,
    refetch: refetchApiarios,
  } = useQuery<{ data: ApiarioRegistro[] }>({
    queryKey: ['censo-apiarios', actor.id],
    queryFn: async () => {
      const res = await apiFetch(`/api/registro-territorial/apiarios?actor_id=${actor.id}`);
      if (!res.ok) throw new Error('Error cargando tus apiarios');
      return res.json();
    },
  });
  const apiarios = apiariosData?.data ?? [];

  // ---- Estado de completitud ----
  const rutOk = validarRUT(rut);
  const tieneIdentidad = rutOk && telefono.trim().length >= 6 && declaracionExistencia;
  const tieneActividad = practicas.trim().length > 0 && metodoVarroa.trim().length > 0;
  const tieneApiarios = apiarios.length > 0;
  const aceptaTodo = aceptaCartaLocal && aceptaPoliticaLocal;
  const todoListo = tieneIdentidad && tieneActividad && tieneApiarios && aceptaTodo;

  const guardarActor = async (body: Record<string, unknown>) => {
    const res = await apiFetch(`/api/registro-territorial/actores/${actor.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string | { issues?: { message?: string }[] };
        message?: string;
      };
      let msg = 'Error guardando tu inscripción';
      if (typeof data.error === 'string') msg = data.error;
      else if (data.message) msg = data.message;
      else if (
        data.error &&
        typeof data.error === 'object' &&
        Array.isArray(data.error.issues) &&
        data.error.issues[0]?.message
      ) {
        msg = data.error.issues[0].message;
      }
      throw new Error(msg);
    }
  };

  const guardarIdentidad = async () => {
    if (!rutOk) {
      toast.error('El RUT ingresado no es válido');
      return;
    }
    if (telefono.trim().length < 6) {
      toast.error('Ingresa un teléfono de contacto válido');
      return;
    }
    if (!declaracionExistencia) {
      toast.error('Debes declarar tu existencia animal ante el SAG para completar el censo');
      return;
    }
    setSavingIdentidad(true);
    try {
      await guardarActor({
        rut: formatearRUT(rut),
        telefono: telefono.trim(),
        rup: rup.trim() || null,
        declaracion_existencia_animal: declaracionExistencia,
      });
      toast.success('Identidad guardada');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error guardando identidad');
    } finally {
      setSavingIdentidad(false);
    }
  };

  const guardarActividad = async () => {
    if (practicas.trim().length < 10) {
      toast.error('Describe brevemente tus prácticas sanitarias');
      return;
    }
    if (metodoVarroa.trim().length < 3) {
      toast.error('Indica tu método de control de varroa');
      return;
    }
    setSavingActividad(true);
    try {
      await guardarActor({
        practicas_sanitarias: practicas.trim(),
        metodo_control_varroa: metodoVarroa.trim(),
      });
      toast.success('Actividad y sanidad guardadas');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error guardando actividad');
    } finally {
      setSavingActividad(false);
    }
  };

  const guardarApiario = async () => {
    if (!apiarioZona.trim()) {
      toast.error('Indica el sector o paraje del apiario');
      return;
    }
    if (apiarioColmenas < 1) {
      toast.error('El número de colmenas debe ser al menos 1');
      return;
    }
    setSavingApiario(true);
    try {
      const lat = apiarioLat ? parseFloat(apiarioLat) : undefined;
      const lng = apiarioLng ? parseFloat(apiarioLng) : undefined;
      if (lat !== undefined && (Number.isNaN(lat) || lat < -90 || lat > 90)) {
        toast.error('Latitud aproximada inválida (entre -90 y 90)');
        setSavingApiario(false);
        return;
      }
      if (lng !== undefined && (Number.isNaN(lng) || lng < -180 || lng > 180)) {
        toast.error('Longitud aproximada inválida (entre -180 y 180)');
        setSavingApiario(false);
        return;
      }
      const body = {
        nombre: apiarioNombre.trim() || null,
        comuna: apiarioComuna.trim(),
        zona: apiarioZona.trim(),
        n_colmenas: apiarioColmenas,
        categoria: apiarioCategoria,
        lat_aproximada: lat,
        lng_aproximada: lng,
      };
      const res = await apiFetch(
        editandoApiario
          ? `/api/registro-territorial/apiarios/${editandoApiario.id}`
          : '/api/registro-territorial/apiarios',
        {
          method: editandoApiario ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error guardando apiario');
      }
      toast.success(editandoApiario ? 'Apiario actualizado' : 'Apiario declarado');
      setShowApiarioForm(false);
      setEditandoApiario(null);
      setApiarioNombre('');
      setApiarioZona('');
      setApiarioColmenas(10);
      setApiarioCategoria('produccion');
      setApiarioLat('');
      setApiarioLng('');
      refetchApiarios().catch(() => toast.error('Error actualizando apiarios'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error guardando apiario');
    } finally {
      setSavingApiario(false);
    }
  };

  const desactivarApiario = async (apiario: ApiarioRegistro) => {
    try {
      const res = await apiFetch(`/api/registro-territorial/apiarios/${apiario.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activo: !apiario.activo }),
      });
      if (!res.ok) throw new Error('Error actualizando apiario');
      refetchApiarios().catch(() => toast.error('Error actualizando apiarios'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error actualizando apiario');
    }
  };

  const completarInscripcion = async () => {
    if (!todoListo) {
      toast.error('Faltan datos requeridos por el censo. Revisa los pasos anteriores.');
      return;
    }
    try {
      if (!actor.acepta_carta || !actor.acepta_politica_datos) {
        await guardarActor({
          acepta_carta: aceptaCartaLocal,
          acepta_politica_datos: aceptaPoliticaLocal,
        });
      }
      const res = await apiFetch(`/api/registro-territorial/actores/${actor.id}/completar-censo`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Error completando inscripción');
      }
      toast.success('¡Inscripción completada! Ya puedes declarar trashumancia y predios.');
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error completando inscripción');
    }
  };

  const pasos: { id: string; titulo: string; desc: string; done: boolean; icon: LucideIcon }[] = [
    {
      id: 'identidad',
      titulo: 'Identidad legal',
      desc: 'RUT, teléfono, RUP y declaración de existencia animal',
      done: tieneIdentidad,
      icon: UserRound,
    },
    {
      id: 'actividad',
      titulo: 'Actividad y sanidad',
      desc: 'Prácticas sanitarias y método de control de varroa',
      done: tieneActividad,
      icon: Leaf,
    },
    {
      id: 'apiarios',
      titulo: 'Mis apiarios',
      desc: 'Cada apiario con su sector, comuna y número de colmenas',
      done: tieneApiarios,
      icon: MapPin,
    },
    {
      id: 'completar',
      titulo: 'Completar inscripción',
      desc: 'Revisa el checklist y firma tu inscripción en el censo',
      done: todoListo,
      icon: FileCheck2,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <ShieldCheck size={18} />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Inscripción legal en el censo
          </h3>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Lo que exige la Ley N.º 21.489 y la ordenanza municipal apícola para operar en la comuna.
          Guarda cada paso por separado — puedes entrar y salir cuando quieras.
        </p>

        <div className="flex flex-wrap gap-2">
          {pasos.map((p) => (
            <Badge key={p.id} variant={p.done ? 'success' : 'default'}>
              {p.done ? '✓ ' : ''}{p.titulo}
            </Badge>
          ))}
        </div>
      </div>

      {pasos.map(({ id, titulo, desc, done, icon: Icon }) => (
        <div key={id} className="bg-card border border-border rounded-2xl overflow-hidden">
          <button
            type="button"
            onClick={() => setPasoAbierto(pasoAbierto === id ? null : id)}
            className="w-full flex items-center gap-3 p-5 text-left hover:bg-surface-raised/50 transition-colors"
          >
            {done ? (
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
            )}
            <Icon size={18} className="text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{titulo}</p>
              <p className="text-xs text-muted-foreground truncate">{desc}</p>
            </div>
            <span className="text-xs text-muted-foreground">{pasoAbierto === id ? '▲' : '▼'}</span>
          </button>

          {pasoAbierto === id && (
            <div className="px-5 pb-5 space-y-4 border-t border-border/60 pt-4">
              {/* ---------- PASO 1: IDENTIDAD ---------- */}
              {id === 'identidad' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                      RUT *
                    </label>
                    <input
                      type="text"
                      value={rut}
                      onChange={(e) => setRut(e.target.value)}
                      onBlur={() => rut && setRut(formatearRUT(rut))}
                      placeholder="12.345.678-9"
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                    {rut && !rutOk && (
                      <p className="text-xs text-destructive mt-1">RUT no válido</p>
                    )}
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                      Teléfono de contacto *
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+56 9 ..."
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                      RUP (Registro Único Pecuario SAG) <span className="normal-case text-muted-foreground/60">— recomendado</span>
                    </label>
                    <input
                      type="text"
                      value={rup}
                      onChange={(e) => setRup(e.target.value)}
                      placeholder="Número de tu registro SAG, si lo tienes"
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <label className="sm:col-span-2 flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={declaracionExistencia}
                      onChange={(e) => setDeclaracionExistencia(e.target.checked)}
                      className="mt-1 flex-shrink-0 w-4 h-4 rounded border-border/60 bg-background text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground">
                        Declaro haber realizado la declaración de existencia animal ante el SAG *
                      </span>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                        Requisito de la ordenanza para la inscripción de apicultores residentes.
                      </p>
                    </div>
                  </label>
                  <div className="sm:col-span-2">
                    <Button onClick={guardarIdentidad} disabled={savingIdentidad} size="sm">
                      {savingIdentidad ? 'Guardando…' : 'Guardar identidad'}
                    </Button>
                  </div>
                </div>
              )}

              {/* ---------- PASO 2: ACTIVIDAD ---------- */}
              {id === 'actividad' && (
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                      Prácticas sanitarias *
                    </label>
                    <textarea
                      value={practicas}
                      onChange={(e) => setPracticas(e.target.value)}
                      rows={3}
                      placeholder="Ej: revisión sanitaria estacional, limpieza de pisos, manejo de alimento, recambio de reinas..."
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                      Método de control de varroa *
                    </label>
                    <textarea
                      value={metodoVarroa}
                      onChange={(e) => setMetodoVarroa(e.target.value)}
                      rows={2}
                      placeholder="Ej: tratamiento acaricida en otoño (principio activo), control de primavera, alternancia de principios activos..."
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <Button onClick={guardarActividad} disabled={savingActividad} size="sm">
                      {savingActividad ? 'Guardando…' : 'Guardar actividad y sanidad'}
                    </Button>
                  </div>
                </div>
              )}

              {/* ---------- PASO 3: APIARIOS ---------- */}
              {id === 'apiarios' && (
                <div className="space-y-4">
                  {loadingApiarios ? (
                    <div className="flex justify-center py-6"><Spinner /></div>
                  ) : apiarios.length === 0 ? (
                    <p className="text-sm text-muted-foreground border border-dashed border-border/60 rounded-xl p-4 text-center">
                      Aún no has declarado apiarios. Agrega el primero: la ley exige la ubicación (sector o paraje) y el número de colmenas de cada uno.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {apiarios.map((a) => (
                        <div key={a.id} className="p-4 bg-surface-raised/40 border border-border/50 rounded-xl space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground text-sm truncate">
                                {a.nombre || 'Apiario sin nombre'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {a.zona} · {a.comuna}
                              </p>
                            </div>
                            <Badge variant={a.activo ? 'success' : 'default'}>{a.activo ? 'Activo' : 'Inactivo'}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-3">
                            <span>🐝 {a.n_colmenas} colmenas</span>
                            <span>{CATEGORIA_LABELS[a.categoria] ?? a.categoria}</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditandoApiario(a);
                                setApiarioNombre(a.nombre ?? '');
                                setApiarioZona(a.zona);
                                setApiarioComuna(a.comuna);
                                setApiarioColmenas(a.n_colmenas);
                                setApiarioCategoria(a.categoria);
                                setApiarioLat(a.lat_aproximada?.toString() ?? '');
                                setApiarioLng(a.lng_aproximada?.toString() ?? '');
                                setShowApiarioForm(true);
                              }}
                            >
                              <Pencil size={14} className="mr-1" /> Editar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => desactivarApiario(a)}>
                              <X size={14} className="mr-1" /> {a.activo ? 'Desactivar' : 'Activar'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showApiarioForm && (
                    <div className="border border-border/60 rounded-xl p-4 space-y-4">
                      <p className="text-sm font-semibold text-foreground">
                        {editandoApiario ? 'Editar apiario' : 'Declarar apiario'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Nombre</label>
                          <input
                            type="text"
                            value={apiarioNombre}
                            onChange={(e) => setApiarioNombre(e.target.value)}
                            placeholder="Ej: Apiario Pureo Sur"
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Sector / Paraje *</label>
                          <input
                            type="text"
                            value={apiarioZona}
                            onChange={(e) => setApiarioZona(e.target.value)}
                            placeholder="Ej: sector río, km 8..."
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Comuna *</label>
                          <input
                            type="text"
                            value={apiarioComuna}
                            onChange={(e) => setApiarioComuna(e.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">N° Colmenas *</label>
                            <input
                              type="number"
                              min={1}
                              value={apiarioColmenas}
                              onChange={(e) => setApiarioColmenas(Number(e.target.value))}
                              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Categoría</label>
                            <select
                              value={apiarioCategoria}
                              onChange={(e) => setApiarioCategoria(e.target.value)}
                              className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors appearance-none"
                            >
                              <option value="produccion">Producción</option>
                              <option value="polinizacion">Polinización</option>
                              <option value="seleccion_cria">Selección y Cría</option>
                              <option value="otro">Otro</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                            Latitud aprox. <span className="normal-case text-muted-foreground/60">(opcional)</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={apiarioLat}
                            onChange={(e) => setApiarioLat(e.target.value)}
                            placeholder="-42.48"
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                            Longitud aprox. <span className="normal-case text-muted-foreground/60">(opcional)</span>
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={apiarioLng}
                            onChange={(e) => setApiarioLng(e.target.value)}
                            placeholder="-73.76"
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={guardarApiario} disabled={savingApiario} size="sm">
                          {savingApiario ? 'Guardando…' : editandoApiario ? 'Actualizar' : 'Declarar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowApiarioForm(false);
                            setEditandoApiario(null);
                            setApiarioNombre('');
                            setApiarioZona('');
                            setApiarioColmenas(10);
                            setApiarioCategoria('produccion');
                            setApiarioLat('');
                            setApiarioLng('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  )}

                  {!showApiarioForm && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditandoApiario(null);
                        setApiarioComuna(actor.comuna);
                        setShowApiarioForm(true);
                      }}
                    >
                      <Plus size={14} className="mr-1" /> Declarar apiario
                    </Button>
                  )}
                </div>
              )}

              {/* ---------- PASO 4: COMPLETAR ---------- */}
              {id === 'completar' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {[
                      { ok: rutOk && telefono.trim().length >= 6, label: 'RUT y teléfono de contacto' },
                      { ok: declaracionExistencia, label: 'Declaración de existencia animal ante el SAG' },
                      { ok: Boolean(actor.rup), label: 'RUP SAG (recomendado)' },
                      { ok: practicas.trim().length > 0, label: 'Prácticas sanitarias declaradas' },
                      { ok: metodoVarroa.trim().length > 0, label: 'Método de control de varroa declarado' },
                      { ok: apiarios.length > 0, label: 'Al menos un apiario declarado con sector y colmenas' },
                      { ok: true, label: 'Carta Constitutiva y privacidad (aceptadas en el alta)' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-2 text-sm">
                        {item.ok ? (
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />
                        )}
                        <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground pt-1">
                    ✓ Tus consentimientos de la Carta Constitutiva y política de privacidad ya quedaron suscritos al crear tu cuenta.
                  </p>

                  <Button onClick={completarInscripcion} disabled={!todoListo} size="sm">
                    <FileCheck2 size={15} className="mr-1" /> Completar inscripción
                  </Button>
                  {!todoListo && (
                    <p className="text-xs text-muted-foreground">
                      Completa los pasos anteriores (identidad, sanidad y al menos un apiario) para habilitar el botón.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
