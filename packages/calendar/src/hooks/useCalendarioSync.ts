import { useState, useEffect, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CalendarioEvent,
  CreateCalendarioEventInput,
  UpdateCalendarioEventInput,
} from '../types';
import {
  categoryToType,
  resolveEventToolLink,
  USER_CATEGORIES,
} from '../types';

function withTool(evt: CalendarioEvent): CalendarioEvent {
  const tool = resolveEventToolLink(evt.type);
  return {
    ...evt,
    toolHref: evt.toolHref ?? tool.href,
    toolLabel: evt.toolLabel ?? tool.label,
  };
}

function defaultColor(category: string): string {
  return (
    USER_CATEGORIES.find((c) => c.value === category)?.color ?? '#5AC8FA'
  );
}

export function useCalendarioSync(
  supabase: SupabaseClient,
  userRole: string = 'admin',
  viewStart?: Date,
  viewEnd?: Date,
  userId?: string | null,
  empresaId?: string | null,
) {
  const [events, setEvents] = useState<CalendarioEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isTerritorial = userRole === 'territorial';
      const isAdmin = userRole === 'admin' || userRole === 'gerente';
      const isApicultor = isTerritorial || userRole === 'apicultor' || isAdmin;
      const isRep = !isTerritorial && (isAdmin || userRole === 'rep_ventas' || userRole === 'vendedor');
      const isMarketing = !isTerritorial && (isAdmin || userRole === 'marketing');

      const promises: PromiseLike<CalendarioEvent[]>[] = [];
      const vsIso = viewStart ? viewStart.toISOString() : undefined;
      const veIso = viewEnd ? viewEnd.toISOString() : undefined;
      const vsDate = viewStart
        ? viewStart.toISOString().slice(0, 10)
        : undefined;
      const veDate = viewEnd ? viewEnd.toISOString().slice(0, 10) : undefined;

      // 0. Eventos de agenda propios (soft-fail si falta migración)
      {
        let q = supabase.from('calendario_eventos').select('*');
        if (vsIso && veIso) {
          // Overlap: starts before viewEnd AND ends after viewStart
          q = q.lte('starts_at', veIso).gte('ends_at', vsIso);
        }
        // Defensa en profundidad: roles no-admin filtran explícitamente por su userId
        if (!isAdmin && userId) {
          q = q.eq('user_id', userId);
        }
        promises.push(
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await q;
            if (err) {
              // tabla inexistente / RLS: no tumbar todo el calendario
              console.warn('[Calendario] calendario_eventos:', err.message);
              return [] as CalendarioEvent[];
            }
            return (data || []).map((row) =>
              withTool({
                id: `own-${row.id}`,
                type: categoryToType(String(row.category ?? 'personal')),
                title: row.title,
                startDate: new Date(row.starts_at),
                endDate: new Date(row.ends_at),
                allDay: Boolean(row.all_day),
                notes: row.notes ?? undefined,
                location: row.location ?? undefined,
                color: row.color ?? defaultColor(String(row.category)),
                editable: true,
                source: {
                  table: 'calendario_eventos',
                  originalId: row.id,
                  rawData: row as Record<string, unknown>,
                },
              }),
            );
          })(),
        );
      }

      if (isRep) {
        let q = supabase.from('eventos').select('*');
        if (vsDate && veDate) {
          q = q.lte('fecha_inicio', veDate).gte('fecha_fin', vsDate);
        }
        promises.push(
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await q;
            if (err) throw err;
            return (data || []).map((row) =>
              withTool({
                id: `feria-${row.id}`,
                type: 'feria',
                title: row.nombre || 'Feria sin nombre',
                startDate: new Date(row.fecha_inicio),
                endDate: row.fecha_fin
                  ? new Date(row.fecha_fin)
                  : undefined,
                allDay: true,
                editable: isAdmin || userRole === 'rep_ventas',
                source: {
                  table: 'eventos',
                  originalId: row.id,
                  rawData: row as Record<string, unknown>,
                },
              }),
            );
          })(),
        );
      }

      if (isApicultor) {
        promises.push(
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await supabase
              .from('calendario_tasks')
              .select('*');
            if (err) throw err;
            const year = viewStart
              ? viewStart.getFullYear()
              : new Date().getFullYear();
            const monthMap: Record<string, number> = {
              Enero: 0,
              Febrero: 1,
              Marzo: 2,
              Abril: 3,
              Mayo: 4,
              Junio: 5,
              Julio: 6,
              Agosto: 7,
              Septiembre: 8,
              Octubre: 9,
              Noviembre: 10,
              Diciembre: 11,
            };
            return (data || [])
              .map((row) => {
                const mIndex = monthMap[row.month as string] ?? 0;
                const week = Number(row.week) || 1;
                const d = new Date(year, mIndex, 1 + (week - 1) * 7);
                return withTool({
                  id: `task-${row.id}`,
                  type: 'apicultura',
                  title: row.title || 'Tarea apícola',
                  startDate: d,
                  allDay: true,
                  editable: false,
                  source: {
                    table: 'calendario_tasks',
                    originalId: row.id,
                    rawData: row as Record<string, unknown>,
                  },
                });
              })
              .filter((e) => {
                if (!viewStart || !viewEnd) return true;
                return e.startDate >= viewStart && e.startDate <= viewEnd;
              });
          })(),
        );
      }

      if (isMarketing) {
        let cmpQ = supabase.from('marketing_campaigns').select('*');
        if (vsIso && veIso)
          cmpQ = cmpQ.gte('created_at', vsIso).lte('created_at', veIso);

        let pstQ = supabase.from('marketing_posts').select('*');
        if (vsDate && veDate)
          pstQ = pstQ.gte('post_date', vsDate).lte('post_date', veDate);

        promises.push(
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await cmpQ;
            if (err) throw err;
            return (data || []).map((row) =>
              withTool({
                id: `mkt-camp-${row.id}`,
                type: 'marketing',
                title: `Campaña: ${row.name}`,
                startDate: new Date(row.created_at),
                allDay: true,
                editable: false,
                source: {
                  table: 'marketing_campaigns',
                  originalId: row.id,
                  rawData: row as Record<string, unknown>,
                },
              }),
            );
          })(),
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await pstQ;
            if (err) throw err;
            return (data || []).map((row) =>
              withTool({
                id: `mkt-post-${row.id}`,
                type: 'marketing',
                title: `Post: ${row.type}`,
                startDate: new Date(row.post_date),
                allDay: true,
                editable: false,
                source: {
                  table: 'marketing_posts',
                  originalId: row.id,
                  rawData: row as Record<string, unknown>,
                },
              }),
            );
          })(),
        );
      }

      if (isApicultor) {
        let cosQ = supabase
          .from('cosechas')
          .select('id, fecha, kg, colmena_id');
        if (vsDate && veDate)
          cosQ = cosQ.gte('fecha', vsDate).lte('fecha', veDate);

        let insQ = supabase
          .from('inspecciones')
          .select('id, date, inspector, colmena_id');
        if (vsDate && veDate)
          insQ = insQ.gte('date', vsDate).lte('date', veDate);

        promises.push(
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await cosQ;
            if (err) {
              console.warn('[Calendario] cosechas:', err.message);
              return [] as CalendarioEvent[];
            }
            return (data || []).map((row) =>
              withTool({
                id: `cosecha-${row.id}`,
                type: 'cosecha',
                title: `Recolección${row.kg != null ? ` ${row.kg} kg` : ''}`,
                startDate: new Date(row.fecha),
                allDay: true,
                editable: false,
                source: {
                  table: 'cosechas',
                  originalId: row.id,
                  rawData: row as Record<string, unknown>,
                },
              }),
            );
          })(),
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await insQ;
            if (err) {
              console.warn('[Calendario] inspecciones:', err.message);
              return [] as CalendarioEvent[];
            }
            return (data || []).map((row) =>
              withTool({
                id: `insp-${row.id}`,
                type: 'inspeccion',
                title: `Inspección${row.inspector ? ` · ${row.inspector}` : ''}`,
                startDate: new Date(row.date),
                allDay: true,
                editable: false,
                source: {
                  table: 'inspecciones',
                  originalId: row.id,
                  rawData: row as Record<string, unknown>,
                },
              }),
            );
          })(),
        );
      }

      if (isTerritorial) {
        // Alertas fitosanitarias programadas en el territorio (avisos preventivos de vecinos/aplicadores)
        let alertaQ = supabase
          .from('alertas_fitosanitarias')
          .select('id, producto, tipo_producto, comuna, zona, fecha_programada, periodo_carencia_horas, radio_km, observaciones, estado')
          .neq('estado', 'cancelada');
        if (vsIso && veIso) {
          alertaQ = alertaQ.gte('fecha_programada', vsIso).lte('fecha_programada', veIso);
        }
        promises.push(
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await alertaQ;
            if (err) {
              console.warn('[Calendario] alertas_fitosanitarias:', err.message);
              return [] as CalendarioEvent[];
            }
            return (data || []).map((row) => {
              const start = new Date(row.fecha_programada);
              const carenciaHoras = Number(row.periodo_carencia_horas) || 4;
              const end = new Date(start.getTime() + carenciaHoras * 3600 * 1000);
              return withTool({
                id: `alerta-${row.id}`,
                type: 'tratamiento',
                title: `⚠️ Aviso Fitosanitario: ${row.producto} (${row.zona || row.comuna})`,
                startDate: start,
                endDate: end,
                allDay: false,
                notes: `Aviso preventivo (${row.tipo_producto || 'agroquímico'}). Radio de influencia: ${row.radio_km || 3} km. Carencia de resguardo: ${carenciaHoras}h.${row.observaciones ? ` Observaciones: ${row.observaciones}` : ''}`,
                location: `${row.zona ? `${row.zona}, ` : ''}${row.comuna || 'Chiloé'}`,
                color: '#FF453A',
                editable: false,
                toolHref: '/territorio/alertas',
                toolLabel: 'Alertas Fitosanitarias',
                source: {
                  table: 'calendario_tasks',
                  originalId: row.id,
                  rawData: row as Record<string, unknown>,
                },
              });
            });
          })(),
        );

        // Movimientos e ingresos de trashumancia registrados en el territorio
        let trashQ = supabase
          .from('apiarios_externos')
          .select('id, comuna_origen, comuna_destino, n_colmenas, fecha_ingreso, predio_nombre, rup_origen, bioseguridad_declarada, estado')
          .neq('estado', 'cancelado');
        if (vsDate && veDate) {
          trashQ = trashQ.gte('fecha_ingreso', vsDate).lte('fecha_ingreso', veDate);
        }
        promises.push(
          (async (): Promise<CalendarioEvent[]> => {
            const { data, error: err } = await trashQ;
            if (err) {
              console.warn('[Calendario] apiarios_externos:', err.message);
              return [] as CalendarioEvent[];
            }
            return (data || []).map((row) =>
              withTool({
                id: `trash-${row.id}`,
                type: 'transhumancia',
                title: `🚛 Ingreso Trashumante: ${row.comuna_origen || 'Origen'} → ${row.comuna_destino || 'Destino'} (${row.n_colmenas || 0} colm.)`,
                startDate: new Date(row.fecha_ingreso),
                allDay: true,
                notes: `Declaración de ingreso territorial. RUP origen: ${row.rup_origen || 'En trámite'}. Bioseguridad declarada: ${row.bioseguridad_declarada ? 'Sí' : 'No'}.`,
                location: `${row.predio_nombre ? `${row.predio_nombre}, ` : ''}${row.comuna_destino}`,
                color: '#64D2FF',
                editable: false,
                toolHref: '/territorio/trashumancia',
                toolLabel: 'Trashumancia y Predios',
                source: {
                  table: 'calendario_tasks',
                  originalId: row.id,
                  rawData: row as Record<string, unknown>,
                },
              }),
            );
          })(),
        );
      }

      const results = await Promise.allSettled(promises);
      const allEvents: CalendarioEvent[] = [];

      for (const res of results) {
        if (res.status === 'fulfilled') {
          allEvents.push(...res.value);
        } else {
          console.error('[Calendario] fetch partial error:', res.reason);
        }
      }

      allEvents.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      setEvents(allEvents);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Error desconocido al sincronizar calendario'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [supabase, userRole, viewStart, viewEnd, userId, empresaId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, [fetchEvents]);

  const createEvent = async (
    input: CreateCalendarioEventInput,
  ): Promise<{ ok: true; id: string } | { ok: false; error: string }> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const uid = input.userId ?? user?.id;
      if (!uid) {
        return { ok: false, error: 'Debes iniciar sesión para crear eventos' };
      }
      if (!(input.endsAt >= input.startsAt)) {
        return { ok: false, error: 'La hora de fin debe ser ≥ inicio' };
      }
      const activeEmpresaId = input.empresaId ?? empresaId ?? null;
      const { data, error: err } = await supabase
        .from('calendario_eventos')
        .insert({
          title: input.title.trim(),
          notes: input.notes?.trim() || null,
          location: input.location?.trim() || null,
          starts_at: input.startsAt.toISOString(),
          ends_at: input.endsAt.toISOString(),
          all_day: Boolean(input.allDay),
          category: input.category ?? 'personal',
          color: input.color ?? defaultColor(input.category ?? 'personal'),
          empresa_id: activeEmpresaId,
          user_id: uid,
        })
        .select('id')
        .single();
      if (err) throw err;
      await fetchEvents();
      return { ok: true, id: data.id as string };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo crear el evento';
      if (/relation .* does not exist|schema cache/i.test(message)) {
        return {
          ok: false,
          error:
            'El servicio de eventos no está disponible en este momento. Intenta nuevamente más tarde.',
        };
      }
      return { ok: false, error: message };
    }
  };

  const updateEvent = async (
    input: UpdateCalendarioEventInput,
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const payload: Record<string, unknown> = {};
      if (input.title !== undefined) payload.title = input.title.trim();
      if (input.notes !== undefined) payload.notes = input.notes?.trim() || null;
      if (input.location !== undefined)
        payload.location = input.location?.trim() || null;
      if (input.startsAt !== undefined)
        payload.starts_at = input.startsAt.toISOString();
      if (input.endsAt !== undefined)
        payload.ends_at = input.endsAt.toISOString();
      if (input.allDay !== undefined) payload.all_day = input.allDay;
      if (input.category !== undefined) {
        payload.category = input.category;
        payload.color = input.color ?? defaultColor(input.category);
      }
      if (input.color !== undefined) payload.color = input.color;

      const { error: err } = await supabase
        .from('calendario_eventos')
        .update(payload)
        .eq('id', input.id);
      if (err) throw err;
      await fetchEvents();
      return { ok: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo actualizar el evento';
      return { ok: false, error: message };
    }
  };

  const deleteEvent = async (
    id: string,
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      const { error: err } = await supabase
        .from('calendario_eventos')
        .delete()
        .eq('id', id);
      if (err) throw err;
      await fetchEvents();
      return { ok: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'No se pudo eliminar el evento';
      return { ok: false, error: message };
    }
  };

  const updateEventDate = async (event: CalendarioEvent, newDate: Date) => {
    if (event.source.table === 'calendario_eventos') {
      const duration =
        (event.endDate?.getTime() ?? event.startDate.getTime() + 3_600_000) -
        event.startDate.getTime();
      const startsAt = new Date(newDate);
      if (event.allDay) {
        startsAt.setHours(0, 0, 0, 0);
      } else {
        startsAt.setHours(
          event.startDate.getHours(),
          event.startDate.getMinutes(),
          0,
          0,
        );
      }
      const endsAt = new Date(startsAt.getTime() + Math.max(duration, 15 * 60_000));
      const res = await updateEvent({
        id: event.source.originalId,
        startsAt,
        endsAt,
      });
      return res.ok;
    }

    try {
      const vsIso = newDate.toISOString();
      const dateOnly = vsIso.slice(0, 10);
      const table = event.source.table;
      const id = event.source.originalId;
      let updatePayload: Record<string, string> = {};
      if (table === 'eventos') {
        updatePayload = { fecha_inicio: dateOnly };
      } else if (table === 'marketing_campaigns') {
        updatePayload = { created_at: vsIso };
      } else if (table === 'marketing_posts') {
        updatePayload = { post_date: dateOnly };
      } else if (table === 'cosechas') {
        updatePayload = { fecha: dateOnly };
      } else if (table === 'inspecciones') {
        updatePayload = { date: dateOnly };
      } else {
        return false;
      }
      const { error: upErr } = await supabase
        .from(table)
        .update(updatePayload)
        .eq('id', id);
      if (upErr) throw upErr;
      await fetchEvents();
      return true;
    } catch (err) {
      console.error('[Calendario] updateEventDate failed:', err);
      return false;
    }
  };

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
    updateEventDate,
    createEvent,
    updateEvent,
    deleteEvent,
  };
}
