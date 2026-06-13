import React, { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, UserPlus, Search, X, Loader2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { toast } from "@enjambre/ui";
import { CRMDashboard, STATUS_COLORS, Cliente } from "../types";

interface ClientesTabProps {
  dashboard: CRMDashboard;
  onSelectCliente?: (clienteId: string) => void;
}

export function ClientesTab({ dashboard, onSelectCliente }: ClientesTabProps) {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const [searchQ, setSearchQ] = useState("");
  const [showNewCliente, setShowNewCliente] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string | null>(null);

  const [newClienteForm, setNewClienteForm] = useState({
    name: "",
    type: "Particular" as const,
    email: "",
    telefono: "",
    empresa: "",
    fuente: "feria" as const,
  });

  const createCliente = useMutation({
    mutationFn: async (form: typeof newClienteForm) => {
      const res = await apiFetch("/api/crm/clientes", {
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
      toast("Cliente creado", { type: "success" });
      queryClient.invalidateQueries({ queryKey: ["crm"] });
      setShowNewCliente(false);
      setNewClienteForm({ name: "", type: "Particular", email: "", telefono: "", empresa: "", fuente: "feria" });
    },
    onError: (err) => toast(err.message, { type: "error" }),
  });

  const filteredClientes = useMemo(() => {
    if (!searchQ) return dashboard.clientes;
    const q = searchQ.toLowerCase();
    return dashboard.clientes.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.empresa?.toLowerCase().includes(q)
    );
  }, [dashboard.clientes, searchQ]);

  const handleSelect = (cliente: Cliente) => {
    setSelectedClienteId(selectedClienteId === cliente.id ? null : cliente.id);
    if (onSelectCliente) {
      onSelectCliente(cliente.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Buscar por nombre, email o empresa..."
            className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <button
          onClick={() => setShowNewCliente(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
        >
          <UserPlus size={16} />
          Nuevo
        </button>
      </div>

      {showNewCliente && (
        <div className="p-4 bg-card border border-border rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-foreground">Nuevo Cliente</span>
            <button onClick={() => setShowNewCliente(false)} className="text-muted-foreground hover:text-foreground">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nombre *"
              value={newClienteForm.name}
              onChange={(e) => setNewClienteForm((f) => ({ ...f, name: e.target.value }))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <select
              value={newClienteForm.type}
              onChange={(e) => setNewClienteForm((f) => ({ ...f, type: e.target.value as typeof newClienteForm.type }))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="Particular">Particular</option>
              <option value="B2B">B2B</option>
              <option value="Gourmet">Gourmet</option>
              <option value="Retail">Retail</option>
              <option value="Exportacion">Exportación</option>
              <option value="D2C">D2C</option>
            </select>
            <input
              type="email"
              placeholder="Email"
              value={newClienteForm.email}
              onChange={(e) => setNewClienteForm((f) => ({ ...f, email: e.target.value }))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="text"
              placeholder="Teléfono"
              value={newClienteForm.telefono}
              onChange={(e) => setNewClienteForm((f) => ({ ...f, telefono: e.target.value }))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="text"
              placeholder="Empresa"
              value={newClienteForm.empresa}
              onChange={(e) => setNewClienteForm((f) => ({ ...f, empresa: e.target.value }))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <select
              value={newClienteForm.fuente}
              onChange={(e) => setNewClienteForm((f) => ({ ...f, fuente: e.target.value as typeof newClienteForm.fuente }))}
              className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="feria">Feria</option>
              <option value="referido">Referido</option>
              <option value="web">Web</option>
              <option value="visita">Visita</option>
              <option value="cold_call">Cold Call</option>
              <option value="red_social">Red Social</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewCliente(false)}
              className="px-3 py-2 rounded-lg text-xs font-semibold border border-border hover:border-accent/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => createCliente.mutate(newClienteForm)}
              disabled={createCliente.isPending || !newClienteForm.name}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {createCliente.isPending ? <Loader2 size={14} className="animate-spin text-accent-foreground" /> : <UserPlus size={14} />}
              Crear
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {filteredClientes.map((cliente) => {
          const isSelected = selectedClienteId === cliente.id;
          return (
            <div
              key={cliente.id}
              className={`flex items-center gap-3 p-3 rounded-xl bg-card border transition-colors cursor-pointer ${
                isSelected ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
              }`}
              onClick={() => handleSelect(cliente)}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-accent shrink-0 border border-border/50">
                <Users size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground truncate">{cliente.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${
                      STATUS_COLORS[cliente.status ?? "prospecto"] ?? STATUS_COLORS.prospecto
                    }`}
                  >
                    {cliente.status ?? "prospecto"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 truncate">
                  {cliente.type && `${cliente.type} · `}
                  {cliente.email && `${cliente.email} · `}
                  {cliente.total_spent != null ? `$${Number(cliente.total_spent).toLocaleString("es-CL")}` : "Sin compras"}
                </div>
              </div>
              <div className="text-right shrink-0">
                {cliente.fuente && <span className="text-xs text-muted-foreground font-medium block">{cliente.fuente}</span>}
                {cliente.ultimo_contacto && (
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {new Date(cliente.ultimo_contacto).toLocaleDateString("es-CL")}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {filteredClientes.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm bg-card border border-border rounded-2xl">
            <Users size={32} className="mx-auto mb-2 opacity-50 text-muted-foreground" />
            {searchQ ? `Sin resultados para "${searchQ}"` : "Sin clientes registrados"}
          </div>
        )}
      </div>
    </div>
  );
}
