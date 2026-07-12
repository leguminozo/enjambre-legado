import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Plus, X, Clock, Loader2, MapPin } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { toast, DatePicker } from "@enjambre/ui";
import {
  CRMDashboard,
  TIPO_ICONS,
  RESULTADO_COLORS,
} from "../types";

interface InteraccionesTabProps {
  dashboard: CRMDashboard;
  selectedClienteId?: string | null;
}

type ClienteDireccion = {
  id: string;
  etiqueta: string;
  nombre: string;
  direccion: string;
  comuna: string;
  region: string;
  telefono: string;
  codigo_postal: string | null;
  instrucciones: string | null;
  es_predeterminada: boolean;
};

export function InteraccionesTab({ dashboard, selectedClienteId }: InteraccionesTabProps) {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const [showNewInteraccion, setShowNewInteraccion] = useState(false);
  const [newInteraccionForm, setNewInteraccionForm] = useState({
    cliente_id: "",
    tipo: "llamada" as const,
    notas: "",
    resultado: "pendiente" as const,
    proximo_seguimiento: "",
  });

  // Pre-fill client ID if passed from parent
  useEffect(() => {
    if (selectedClienteId) {
      setNewInteraccionForm((f) => ({ ...f, cliente_id: selectedClienteId }));
      setShowNewInteraccion(true);
    }
  }, [selectedClienteId]);

  const createInteraccion = useMutation({
    mutationFn: async (form: typeof newInteraccionForm) => {
      const res = await apiFetch("/api/crm/interacciones", {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Create failed" }));
        throw new Error(err.message ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast("Interacción registrada", { type: "success" });
      queryClient.invalidateQueries({ queryKey: ["crm"] });
      setShowNewInteraccion(false);
      setNewInteraccionForm({
        cliente_id: "",
        tipo: "llamada",
        notas: "",
        resultado: "pendiente",
        proximo_seguimiento: "",
      });
    },
    onError: (err) => toast(err.message, { type: "error" }),
  });

  const { data: direccionesData, isLoading: isLoadingDirecciones } = useQuery<{ data: ClienteDireccion[] }>({
    queryKey: ["crm", "direcciones", selectedClienteId],
    queryFn: async () => {
      if (!selectedClienteId) return { data: [] };
      const res = await apiFetch(`/api/crm/clientes/${selectedClienteId}/direcciones`);
      if (!res.ok) throw new Error("Failed to fetch direcciones");
      return res.json();
    },
    enabled: !!selectedClienteId,
  });

  const direcciones = direccionesData?.data ?? [];
  const interaccionesToShow = selectedClienteId 
    ? dashboard.interacciones.filter(i => i.cliente_id === selectedClienteId)
    : dashboard.interacciones;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground font-medium">
          {dashboard.stats.interaccionesTotal} interacciones
        </span>
        <button
          onClick={() => setShowNewInteraccion(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <Plus size={16} />
          Registrar
        </button>
      </div>

      {showNewInteraccion && (
        <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Nueva Interacción</span>
            <button onClick={() => setShowNewInteraccion(false)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <select
              value={newInteraccionForm.cliente_id}
              onChange={(e) => setNewInteraccionForm((f) => ({ ...f, cliente_id: e.target.value }))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Seleccionar cliente</option>
              {dashboard.clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              value={newInteraccionForm.tipo}
              onChange={(e) =>
                setNewInteraccionForm((f) => ({ ...f, tipo: e.target.value as typeof newInteraccionForm.tipo }))
              }
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="llamada">Llamada</option>
              <option value="email">Email</option>
              <option value="visita">Visita</option>
              <option value="feria">Feria</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="reunion">Reunión</option>
              <option value="seguimiento">Seguimiento</option>
              <option value="otro">Otro</option>
            </select>
            <select
              value={newInteraccionForm.resultado}
              onChange={(e) =>
                setNewInteraccionForm((f) => ({
                  ...f,
                  resultado: e.target.value as typeof newInteraccionForm.resultado,
                }))
              }
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="pendiente">Pendiente</option>
              <option value="positivo">Positivo</option>
              <option value="neutral">Neutral</option>
              <option value="negativo">Negativo</option>
              <option value="seguimiento">Seguimiento</option>
            </select>
            <DatePicker
              value={newInteraccionForm.proximo_seguimiento}
              onChange={(val) => setNewInteraccionForm((f) => ({ ...f, proximo_seguimiento: val }))}
              className="w-auto min-w-[200px]"
            />
          </div>
          <textarea
            value={newInteraccionForm.notas}
            onChange={(e) => setNewInteraccionForm((f) => ({ ...f, notas: e.target.value }))}
            placeholder="Notas de la interacción..."
            rows={3}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-y"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewInteraccion(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:border-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => createInteraccion.mutate(newInteraccionForm)}
              disabled={createInteraccion.isPending || !newInteraccionForm.cliente_id}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {createInteraccion.isPending ? (
                <Loader2 size={14} className="animate-spin text-accent-foreground" />
              ) : (
                <Plus size={14} />
              )}
              Registrar
            </button>
          </div>
        </div>
      )}
      
      {selectedClienteId && (isLoadingDirecciones ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-secondary/50 rounded-xl">
          <Loader2 size={14} className="animate-spin" /> Cargando direcciones...
        </div>
      ) : direcciones.length > 0 ? (
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <MapPin size={16} className="text-accent" />
            Libreta de Direcciones
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {direcciones.map((dir) => (
              <div key={dir.id} className="p-3 bg-card border border-border rounded-xl space-y-1 relative overflow-hidden">
                {dir.es_predeterminada && (
                  <div className="absolute top-0 right-0 bg-accent/10 text-accent px-2 py-0.5 rounded-bl-lg text-[10px] font-bold uppercase tracking-wider">
                    Predeterminada
                  </div>
                )}
                <div className="font-semibold text-sm text-foreground pr-24">{dir.etiqueta}</div>
                <div className="text-xs text-muted-foreground">{dir.nombre} • {dir.telefono}</div>
                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {dir.direccion}, {dir.comuna}, {dir.region}
                </div>
                {dir.instrucciones && (
                  <div className="text-[11px] text-accent/80 mt-1 italic line-clamp-1">
                    "{dir.instrucciones}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null)}

      <div className="space-y-2 pt-2">
        {interaccionesToShow.map((inter) => {
          const cliente = dashboard.clientes.find((c) => c.id === inter.cliente_id);
          return (
            <div
              key={inter.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="text-muted-foreground mt-0.5 shrink-0">
                {TIPO_ICONS[inter.tipo] ?? <MessageSquare size={14} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{cliente?.name ?? "Cliente"}</span>
                  <span className={`text-xs font-bold uppercase ${RESULTADO_COLORS[inter.resultado ?? "pendiente"] ?? ""}`}>
                    {inter.resultado ?? "pendiente"}
                  </span>
                </div>
                {inter.notas && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{inter.notas}</p>}
                {inter.proximo_seguimiento && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-accent font-semibold font-mono">
                    <Clock size={12} />
                    Seguimiento: {new Date(inter.proximo_seguimiento).toLocaleDateString("es-CL")}
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground font-mono shrink-0 ml-2">
                {new Date(inter.created_at).toLocaleDateString("es-CL")}
              </div>
            </div>
          );
        })}
        {interaccionesToShow.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm bg-card border border-border rounded-2xl">
            <MessageSquare size={32} className="mx-auto mb-2 opacity-50 text-muted-foreground" />
            Sin interacciones {selectedClienteId ? "para este cliente" : "registradas"}
          </div>
        )}
      </div>
    </div>
  );
}
