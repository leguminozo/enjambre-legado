'use client';

import * as React from 'react';
import { Calendario, useCalendarioSync } from '@enjambre/calendar';
import type { CalendarioEvent } from '@enjambre/calendar';
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
import { es } from 'date-fns/locale';

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

  const { events, isLoading, error, updateEventDate } = useCalendarioSync(supabase, userRole, viewStart, viewEnd);

  // Estado del Modal
  const [selectedEvent, setSelectedEvent] = React.useState<CalendarioEvent | null>(null);
  const [editDate, setEditDate] = React.useState('');
  const [isUpdating, setIsUpdating] = React.useState(false);

  const handleEventClick = (evt: CalendarioEvent) => {
    setSelectedEvent(evt);
    setEditDate(format(evt.startDate, 'yyyy-MM-dd'));
  };

  const handleSaveDate = async () => {
    if (!selectedEvent || !editDate) return;
    setIsUpdating(true);
    try {
      const newDate = parseISO(editDate);
      const success = await updateEventDate(selectedEvent, newDate);
      if (success) {
        toast.success('Reprogramado correctamente');
        setSelectedEvent(null);
      } else {
        toast.error('No se pudo modificar la fecha');
      }
    } catch (err) {
      toast.error(friendlyError(err, 'Error al reprogramar'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-8 text-destructive bg-background font-sans">
        <p className="font-medium">Error al sincronizar el calendario: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="h-full max-h-screen flex flex-col p-6 md:p-8 pb-24 md:pb-8 overflow-hidden bg-background">
      <div className="mb-8 flex-shrink-0">
        <h1 className="text-4xl font-display font-bold tracking-wide text-crema mb-2">
          Calendario
        </h1>
        <p className="text-sm font-sans tracking-wide text-crema/60 uppercase">
          Planificación y registro de ciclos del enjambre
        </p>
      </div>

      <div className="flex-1 min-h-[400px] overflow-hidden">
        {isLoading && events.length === 0 ? (
          <ViewLoading label="Sincronizando calendario..." />
        ) : (
          <Calendario 
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
        <DialogContent className="border border-miel/20 bg-background text-crema shadow-glow max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-miel">Detalle del Registro</DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest text-crema/40">
              Origen: {selectedEvent?.source.table}
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="py-4 flex flex-col gap-5 font-sans">
              <div>
                <span className="text-xs text-crema/40 uppercase tracking-wider block mb-1">Actividad / Registro</span>
                <p className="font-medium text-lg text-crema">{selectedEvent.title}</p>
              </div>

              <div>
                <span className="text-xs text-crema/40 uppercase tracking-wider block mb-1">Categoría</span>
                <p className="capitalize text-sm text-miel font-semibold">{selectedEvent.type}</p>
              </div>

              {selectedEvent.editable ? (
                <div>
                  <span className="text-xs text-crema/40 uppercase tracking-wider block mb-1">Reprogramar Fecha</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Input 
                      type="date" 
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="border border-miel/20 focus:border-miel focus:ring-1 focus:ring-miel bg-card text-crema rounded-lg"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-xs text-crema/40 uppercase tracking-wider block mb-1">Fecha Registrada</span>
                  <p className="text-sm text-crema/90">{format(selectedEvent.startDate, "d 'de' MMMM, yyyy", { locale: es })}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedEvent(null)}
              className="border-miel/20 hover:bg-miel/10 text-crema hover:text-miel transition-all duration-elegant rounded-full"
            >
              Cerrar
            </Button>
            {selectedEvent?.editable && (
              <Button 
                onClick={handleSaveDate} 
                disabled={isUpdating || !editDate}
                className="bg-miel text-background font-bold hover:bg-miel-light transition-all duration-elegant rounded-full shadow-glow"
              >
                {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
