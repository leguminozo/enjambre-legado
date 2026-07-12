import { useState, useEffect, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { OmniEvent } from '../types';

export function useOmniSync(
  supabase: SupabaseClient, 
  userRole: string = 'admin',
  viewStart?: Date,
  viewEnd?: Date
) {
  const [events, setEvents] = useState<OmniEvent[]>([]);
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
          // Filtrar si la feria termina después del inicio del mes y empieza antes del fin del mes
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

      // 2. Apicultura Tasks (apicultor, admin)
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

      // 4. Histórico (Cosechas, Lotes, Inspecciones) (apicultor, admin)
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
      const allEvents: OmniEvent[] = [];
      
      for (const res of results) {
        if (res.status === 'fulfilled') {
          allEvents.push(...res.value);
        } else {
          console.error("Error fetching some events for OmniCalendar:", res.reason);
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

  // Mutación bidireccional
  const updateEventDate = async (event: OmniEvent, newStartDate: Date, newEndDate?: Date) => {
    try {
      const { table, originalId } = event.source;
      
      let updatePayload: Record<string, string | number | null> = {};
      
      if (table === 'eventos') {
        updatePayload = {
          fecha_inicio: newStartDate.toISOString(),
          fecha_fin: newEndDate ? newEndDate.toISOString() : null
        };
      } else if (table === 'cosechas') {
        updatePayload = { fecha: newStartDate.toISOString().split('T')[0] as string };
      } else if (table === 'inspecciones') {
        updatePayload = { date: newStartDate.toISOString().split('T')[0] as string };
      } else if (table === 'marketing_posts') {
        updatePayload = { post_date: newStartDate.toISOString() };
      } else if (table === 'calendario_tasks') {
        // Reverse map date to week/month
        const monthMap = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        const month = monthMap[newStartDate.getMonth()] as string;
        const week = Math.ceil(newStartDate.getDate() / 7);
        updatePayload = { month, week };
      } else {
        throw new Error(`Edición de fechas no implementada para tabla: ${table}`);
      }

      const { error } = await supabase.from(table).update(updatePayload).eq('id', originalId);
      if (error) throw error;
      
      await fetchEvents(); // Refresh
      return true;
    } catch (err) {
      console.error('Error updating event:', err);
      return false;
    }
  };

  return {
    events,
    isLoading,
    error,
    refresh: fetchEvents,
    updateEventDate
  };
}
