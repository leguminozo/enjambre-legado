'use client';

import * as React from 'react';
import { OmniCalendar, useOmniSync } from '@enjambre/calendar';
import type { OmniEvent } from '@enjambre/calendar';
import { createClient } from '@enjambre/auth/browser';
import { useAuthStore } from '@enjambre/auth';
import { 
  ViewLoading, 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  Button,
  Input,
  toast,
  friendlyError
} from '@enjambre/ui';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, parseISO } from 'date-fns';

export default function CalendarioPage() {
  const supabase = createClient();
  const { session } = useAuthStore();
  const userRole = session?.user?.app_metadata?.role || 'admin'; 
  
  const [currentDate, setCurrentDate] = React.useState(new Date());
  
  // Calcular el rango visible (mes actual + semanas superpuestas)
  const viewStart = React.useMemo(() => {
    return startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
  }, [currentDate]);
  
  const viewEnd = React.useMemo(() => {
    return endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
  }, [currentDate]);

  const { events, isLoading, error, updateEventDate } = useOmniSync(supabase, userRole, viewStart, viewEnd);

  // Estado del Modal
  const [selectedEvent, setSelectedEvent] = React.useState<OmniEvent | null>(null);
  const [editDate, setEditDate] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleEventClick = (evt: OmniEvent) => {
    setSelectedEvent(evt);
    // Inicializar el input date con la fecha del evento (formato yyyy-MM-dd)
    setEditDate(format(evt.startDate, 'yyyy-MM-dd'));
  };

  const handleSaveDate = async () => {
    if (!selectedEvent || !editDate) return;
    setIsUpdating(true);
    try {
      const newDate = parseISO(editDate);
      const success = await updateEventDate(selectedEvent, newDate);
      if (success) {
        toast.success('Fecha actualizada correctamente');
        setSelectedEvent(null);
      } else {
        toast.error('No se pudo actualizar la fecha');
      }
    } catch (err) {
      toast.error(friendlyError(err, 'Error al actualizar'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-destructive">
        <p>Error cargando el calendario: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-full max-h-screen flex flex-col p-4 md:p-6 pb-20 md:pb-6 overflow-hidden">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-display font-bold mb-2">OmniCalendar</h1>
        <p className="text-muted-foreground">
          Visión centralizada del tiempo en el enjambre.
        </p>
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden">
        {isLoading && events.length === 0 ? (
          <ViewLoading label="Sincronizando cronograma..." />
        ) : (
          <OmniCalendar 
            events={events}
            currentDate={currentDate}
            onMonthChange={setCurrentDate}
            isLoading={isLoading}
            onEventClick={handleEventClick}
          />
        )}
      </div>

      {/* Modal de Detalle / Edición */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Detalle de Evento</DialogTitle>
            <DialogDescription className="capitalize">
              {selectedEvent?.type} - {selectedEvent?.source.table}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="py-4 flex flex-col gap-4">
              <div>
                <span className="text-sm text-muted-foreground block mb-1">Título</span>
                <p className="font-medium text-lg">{selectedEvent.title}</p>
              </div>

              {selectedEvent.editable ? (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Cambiar Fecha</span>
                  <div className="flex items-center gap-2">
                    <Input 
                      type="date" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-sm text-muted-foreground block mb-1">Fecha Programada</span>
                  <p>{format(selectedEvent.startDate, 'dd/MM/yyyy')}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedEvent(null)}>
              Cerrar
            </Button>
            {selectedEvent?.editable && (
              <Button onClick={handleSaveDate} disabled={isUpdating || !editDate}>
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
