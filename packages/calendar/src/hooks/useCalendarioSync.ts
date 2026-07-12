import { useState, useEffect, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalendarioEvent } from '../types';

export function useCalendarioSync(
  supabase: SupabaseClient, 
  userRole: string = 'admin',
  viewStart?: Date,
  viewEnd?: Date
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

      const promises = [];
      const vsIso = viewStart ? viewStart.toISOString() : undefined;
      const veIso = viewEnd ? viewEnd.toISOString() : undefined;

      // 1. Ferias / Eventos (rep_ventas, admin)
      if (isRep) {
        let q = supabase.from('eventos').select('*');
        if (vsIso && veIso) {
          q = q.gte('fecha_fin', vsIso).lte('fecha_inicio', veIso);
        }
        promises.push(
          q.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map(row => ({
              id: `feria-${row.id}`,
              type: 'feria' as const,
              title: row.nombre || 'Feria Sin Nombre',
              startDate: new Date(row.fecha_inicio),
              endDate: row.fecha_fin ? new Date(row.fecha_fin) : undefined,
              editable: isAdmin || userRole === 'rep_ventas',
              source: { table: 'eventos' as const, originalId: row.id, rawData: row }
            }));
          })
        );
      }

      // 2. Tareas del Calendario Apícola (apicultor, admin)
      if (isApicultor) {
        promises.push(
          supabase.from('calendario_tasks').select('*').then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map(row => {
              const year = viewStart ? viewStart.getFullYear() : new Date().getFullYear();
              const monthMap: Record<string, number> = {
                'Enero': 0, 'Febrero': 1, 'Marzo': 2, 'Abril': 3, 'Mayo': 4, 'Junio': 5,
                'Julio': 6, 'Agosto': 7, 'Septiembre': 8, 'Octubre': 9, 'Noviembre': 10, 'Diciembre': 11
              };
              const mIndex = monthMap[row.month] ?? 0;
              const d = new Date(year, mIndex, 1 + ((row.week - 1) * 7));
              
              return {
                id: `task-${row.id}`,
                type: 'apicultura' as const,
                title: row.title || 'Tarea Apícola',
                startDate: d,
                editable: isApicultor,
                source: { table: 'calendario_tasks' as const, originalId: row.id, rawData: row }
              };
            }).filter(e => {
               if (!viewStart || !viewEnd) return true;
               return e.startDate >= viewStart && e.startDate <= viewEnd;
            });
          })
        );
      }

      // 3. Marketing (marketing, admin)
      if (isMarketing) {
        let cmpQ = supabase.from('marketing_campaigns').select('*');
        if (vsIso && veIso) cmpQ = cmpQ.gte('created_at', vsIso).lte('created_at', veIso);
        
        let pstQ = supabase.from('marketing_posts').select('*');
        if (vsIso && veIso) pstQ = pstQ.gte('post_date', vsIso).lte('post_date', veIso);

        promises.push(
          cmpQ.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map(row => ({
              id: `mkt-camp-${row.id}`,
              type: 'marketing' as const,
              title: `Campaña: ${row.name}`,
              startDate: new Date(row.created_at),
              editable: isMarketing,
              source: { table: 'marketing_campaigns' as const, originalId: row.id, rawData: row }
            }));
          }),
          pstQ.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map(row => ({
              id: `mkt-post-${row.id}`,
              type: 'marketing' as const,
              title: `Post: ${row.type}`,
              startDate: new Date(row.post_date),
              editable: isMarketing,
              source: { table: 'marketing_posts' as const, originalId: row.id, rawData: row }
            }));
          })
        );
      }

      // 4. Histórico / Registros (apicultor, admin)
      if (isApicultor) {
        let cosQ = supabase.from('cosechas').select('id, fecha, kg, colmena_id');
        if (vsIso && veIso) cosQ = cosQ.gte('fecha', vsIso).lte('fecha', veIso);

        let insQ = supabase.from('inspecciones').select('id, date, inspector, colmena_id');
        if (vsIso && veIso) insQ = insQ.gte('date', vsIso).lte('date', veIso);

        promises.push(
          cosQ.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map(row => ({
              id: `cosecha-${row.id}`,
              type: 'historico' as const,
              title: `Cosecha ${row.kg ? row.kg + 'kg' : ''}`,
              startDate: new Date(row.fecha),
              editable: isAdmin,
              source: { table: 'cosechas' as const, originalId: row.id, rawData: row }
            }));
          }),
          insQ.then(({ data, error }) => {
            if (error) throw error;
            return (data || []).map(row => ({
              id: `insp-${row.id}`,
              type: 'inspeccion' as const,
              title: `Inspección ${row.inspector || ''}`,
              startDate: new Date(row.date),
              editable: isApicultor,
              source: { table: 'inspecciones' as const, originalId: row.id, rawData: row }
            }));
          })
        );
      }

      const results = await Promise.allSettled(promises);
      const allEvents: CalendarioEvent[] = [];
      
      for (const res of results) {
        if (res.status === 'fulfilled') {
          allEvents.push(...res.value);
        } else {
          console.error("Error fetching some events for Calendario:", res.reason);
        }
      }

      setEvents(allEvents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error fetching events'));
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
      let table: string = event.source.table;
      let id = event.source.originalId;

      let updatePayload: Record<string, string> = {};
      if (table === 'eventos') {
        updatePayload = { fecha_inicio: vsIso };
      } else if (table === 'marketing_campaigns') {
        updatePayload = { created_at: vsIso };
      } else if (table === 'marketing_posts') {
        updatePayload = { post_date: vsIso };
      } else if (table === 'cosechas') {
        updatePayload = { fecha: vsIso };
      } else if (table === 'inspecciones') {
        updatePayload = { date: vsIso };
      } else {
        return false;
      }

      const { error } = await supabase.from(table).update(updatePayload).eq('id', id);
      if (error) throw error;

      await fetchEvents();
      return true;
    } catch (err) {
      console.error("Failed to update event date:", err);
      return false;
    }
  };

  return {
    events,
    isLoading,
    error,
    refetch: fetchEvents,
    updateEventDate
  };
}
