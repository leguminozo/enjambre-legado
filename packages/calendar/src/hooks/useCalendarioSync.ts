import { useState, useEffect, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarioEvent } from '../types';
import { resolveEventToolLink } from '../types';

function withTool(evt: CalendarioEvent): CalendarioEvent {
  const tool = resolveEventToolLink(evt.type);
  return {
    ...evt,
    toolHref: evt.toolHref ?? tool.href,
    toolLabel: evt.toolLabel ?? tool.label,
  };
}

export function useCalendarioSync(
  supabase: SupabaseClient,
  userRole: string = 'admin',
  viewStart?: Date,
  viewEnd?: Date,
) {
  const [events, setEvents] = useState<CalendarioEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const isAdmin = userRole === 'admin' || userRole === 'gerente';
      const isApicultor = userRole === 'apicultor' || isAdmin;
      const isRep = userRole === 'rep_ventas' || userRole === 'vendedor' || isAdmin;
      const isMarketing = userRole === 'marketing' || isAdmin;

      const promises: Promise<CalendarioEvent[]>[] = [];
      const vsIso = viewStart ? viewStart.toISOString() : undefined;
      const veIso = viewEnd ? viewEnd.toISOString() : undefined;
      // Date-only strings for date columns
      const vsDate = viewStart ? viewStart.toISOString().slice(0, 10) : undefined;
      const veDate = viewEnd ? viewEnd.toISOString().slice(0, 10) : undefined;

      // 1. Ferias / Eventos
      if (isRep) {
        let q = supabase.from('eventos').select('*');
        if (vsDate && veDate) {
          // overlap: event ends after viewStart AND starts before viewEnd
          q = q.lte('fecha_inicio', veDate).gte('fecha_fin', vsDate);
        }
        promises.push(
          q.then(({ data, error: err }) => {
            if (err) throw err;
            return (data || []).map((row) =>
              withTool({
                id: `feria-${row.id}`,
                type: 'feria',
                title: row.nombre || 'Feria sin nombre',
                startDate: new Date(row.fecha_inicio),
                endDate: row.fecha_fin ? new Date(row.fecha_fin) : undefined,
                editable: isAdmin || userRole === 'rep_ventas',
                source: { table: 'eventos', originalId: row.id, rawData: row },
              }),
            );
          }),
        );
      }

      // 2. Tareas apícolas (mes/semana del año visible)
      if (isApicultor) {
        promises.push(
          supabase.from('calendario_tasks').select('*').then(({ data, error: err }) => {
            if (err) throw err;
            const year = viewStart ? viewStart.getFullYear() : new Date().getFullYear();
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
                  editable: isApicultor,
                  source: {
                    table: 'calendario_tasks',
                    originalId: row.id,
                    rawData: row,
                  },
                });
              })
              .filter((e) => {
                if (!viewStart || !viewEnd) return true;
                return e.startDate >= viewStart && e.startDate <= viewEnd;
              });
          }),
        );
      }

      // 3. Marketing
      if (isMarketing) {
        let cmpQ = supabase.from('marketing_campaigns').select('*');
        if (vsIso && veIso) cmpQ = cmpQ.gte('created_at', vsIso).lte('created_at', veIso);

        let pstQ = supabase.from('marketing_posts').select('*');
        if (vsDate && veDate) pstQ = pstQ.gte('post_date', vsDate).lte('post_date', veDate);

        promises.push(
          cmpQ.then(({ data, error: err }) => {
            if (err) throw err;
            return (data || []).map((row) =>
              withTool({
                id: `mkt-camp-${row.id}`,
                type: 'marketing',
                title: `Campaña: ${row.name}`,
                startDate: new Date(row.created_at),
                editable: isMarketing,
                source: {
                  table: 'marketing_campaigns',
                  originalId: row.id,
                  rawData: row,
                },
              }),
            );
          }),
          pstQ.then(({ data, error: err }) => {
            if (err) throw err;
            return (data || []).map((row) =>
              withTool({
                id: `mkt-post-${row.id}`,
                type: 'marketing',
                title: `Post: ${row.type}`,
                startDate: new Date(row.post_date),
                editable: isMarketing,
                source: {
                  table: 'marketing_posts',
                  originalId: row.id,
                  rawData: row,
                },
              }),
            );
          }),
        );
      }

      // 4. Histórico / inspecciones
      if (isApicultor) {
        let cosQ = supabase.from('cosechas').select('id, fecha, kg, colmena_id');
        if (vsDate && veDate) cosQ = cosQ.gte('fecha', vsDate).lte('fecha', veDate);

        let insQ = supabase.from('inspecciones').select('id, date, inspector, colmena_id');
        if (vsDate && veDate) insQ = insQ.gte('date', vsDate).lte('date', veDate);

        promises.push(
          cosQ.then(({ data, error: err }) => {
            if (err) throw err;
            return (data || []).map((row) =>
              withTool({
                id: `cosecha-${row.id}`,
                type: 'historico',
                title: `Cosecha${row.kg != null ? ` ${row.kg} kg` : ''}`,
                startDate: new Date(row.fecha),
                editable: isAdmin,
                source: { table: 'cosechas', originalId: row.id, rawData: row },
              }),
            );
          }),
          insQ.then(({ data, error: err }) => {
            if (err) throw err;
            return (data || []).map((row) =>
              withTool({
                id: `insp-${row.id}`,
                type: 'inspeccion',
                title: `Inspección${row.inspector ? ` · ${row.inspector}` : ''}`,
                startDate: new Date(row.date),
                editable: isApicultor,
                source: {
                  table: 'inspecciones',
                  originalId: row.id,
                  rawData: row,
                },
              }),
            );
          }),
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

      allEvents.sort(
        (a, b) => a.startDate.getTime() - b.startDate.getTime(),
      );
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
  }, [supabase, userRole, viewStart, viewEnd]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
  }, [fetchEvents]);

  const updateEventDate = async (event: CalendarioEvent, newDate: Date) => {
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
  };
}
