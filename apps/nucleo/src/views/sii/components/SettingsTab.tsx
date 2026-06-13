import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, Loader2, CheckCircle2 } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";

interface EmpresaSettings {
  id: string;
  rut: string;
  razon_social: string;
  regimen: string;
  acteco: number | null;
  sii_ambiente: string;
  fecha_inicio_actividades: string | null;
  ingresos_brutos_anio_anterior: number | null;
  has_clave_sii: boolean;
}

export function SettingsTab() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();

  const empresaQuery = useQuery({
    queryKey: ["sii", "empresa"],
    queryFn: async (): Promise<EmpresaSettings> => {
      const res = await apiFetch("/api/sii/empresa");
      if (!res.ok) throw new Error("Error cargando datos empresa");
      const json = await res.json();
      return json.data;
    },
    retry: false,
  });

  const [settingsForm, setSettingsForm] = useState({
    regimen: "",
    acteco: "",
    sii_ambiente: "certificacion",
    fecha_inicio_actividades: "",
    ingresos_brutos_anio_anterior: "",
  });

  const [siiClave, setSiiClave] = useState("");
  const [showSiiClave, setShowSiiClave] = useState(false);

  // Sync form with query data on load
  useEffect(() => {
    if (empresaQuery.data) {
      const emp = empresaQuery.data;
      setSettingsForm({
        regimen: emp.regimen || "",
        acteco: emp.acteco ? String(emp.acteco) : "",
        sii_ambiente: emp.sii_ambiente || "certificacion",
        fecha_inicio_actividades: emp.fecha_inicio_actividades ? emp.fecha_inicio_actividades.slice(0, 10) : "",
        ingresos_brutos_anio_anterior: emp.ingresos_brutos_anio_anterior ? String(emp.ingresos_brutos_anio_anterior) : "",
      });
    }
  }, [empresaQuery.data]);

  const updateEmpresa = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await apiFetch("/api/sii/empresa", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error actualizando empresa");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const saveSiiClave = useMutation({
    mutationFn: async (clave: string) => {
      const res = await apiFetch("/api/sii/empresa/sii-clave", {
        method: "PUT",
        body: JSON.stringify({ clave }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error guardando clave SII");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
      setSiiClave("");
      setShowSiiClave(false);
    },
  });

  const deleteSiiClave = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/empresa/sii-clave", {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error eliminando clave SII");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const handleSave = () => {
    const emp = empresaQuery.data;
    if (!emp) return;

    const patch: Record<string, unknown> = {};
    if (settingsForm.regimen !== emp.regimen) patch.regimen = settingsForm.regimen;
    if (settingsForm.acteco !== String(emp.acteco ?? "")) {
      patch.acteco = settingsForm.acteco ? Number(settingsForm.acteco) : null;
    }
    if (settingsForm.sii_ambiente !== emp.sii_ambiente) patch.sii_ambiente = settingsForm.sii_ambiente;
    if (settingsForm.fecha_inicio_actividades !== (emp.fecha_inicio_actividades ?? "").slice(0, 10)) {
      patch.fecha_inicio_actividades = settingsForm.fecha_inicio_actividades || null;
    }
    if (settingsForm.ingresos_brutos_anio_anterior !== String(emp.ingresos_brutos_anio_anterior ?? "")) {
      patch.ingresos_brutos_anio_anterior = settingsForm.ingresos_brutos_anio_anterior ? Number(settingsForm.ingresos_brutos_anio_anterior) : 0;
    }

    if (Object.keys(patch).length === 0) return;
    updateEmpresa.mutate(patch);
  };

  const regimenLabels: Record<string, string> = {
    pro_pyme_transparente: "Pyme Transparente (Art. 14 D N°8)",
    pro_pyme_general: "Pro Pyme General (Art. 14 D N°3)",
    semi_integrado: "Semi Integrado",
    general: "General",
  };

  if (empresaQuery.isLoading) {
    return (
      <div className="flex justify-center py-8 bg-card border border-border rounded-2xl">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    );
  }

  if (empresaQuery.isError) {
    return (
      <div className="p-6 bg-card border border-border rounded-2xl">
        <p className="text-sm text-destructive">{empresaQuery.error.message}</p>
      </div>
    );
  }

  const emp = empresaQuery.data;
  if (!emp) return null;

  return (
    <section className="bg-card border border-border rounded-2xl p-6">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2 text-foreground">
        <Settings2 size={18} /> Configuración SII Empresa
      </h3>

      <div className="grid gap-4 max-w-lg">
        <div className="p-3 bg-secondary rounded-lg text-sm border border-border flex flex-wrap gap-x-4">
          <div>
            <span className="text-muted-foreground">RUT:</span>{" "}
            <span className="font-mono text-foreground font-semibold">{emp.rut}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Razon Social:</span>{" "}
            <span className="text-foreground font-semibold">{emp.razon_social}</span>
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Régimen tributario</label>
          <select
            value={settingsForm.regimen}
            onChange={(e) => setSettingsForm((prev) => ({ ...prev, regimen: e.target.value }))}
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
          >
            {Object.entries(regimenLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Acteco (código SII)</label>
            <input
              value={settingsForm.acteco}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, acteco: e.target.value }))}
              placeholder="Ej: 731000"
              type="number"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ambiente SII</label>
            <select
              value={settingsForm.sii_ambiente}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, sii_ambiente: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            >
              <option value="certificacion">Certificación (Maullín)</option>
              <option value="produccion">Producción (Palena)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Fecha inicio actividades</label>
            <input
              value={settingsForm.fecha_inicio_actividades}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, fecha_inicio_actividades: e.target.value }))}
              type="date"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Ingresos brutos año anterior (CLP)</label>
            <input
              value={settingsForm.ingresos_brutos_anio_anterior}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, ingresos_brutos_anio_anterior: e.target.value }))}
              placeholder="Ej: 5000000"
              type="number"
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={updateEmpresa.isPending}
            className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
          >
            {updateEmpresa.isPending ? <Loader2 className="animate-spin text-accent-foreground" size={18} /> : "Guardar cambios"}
          </button>
          {updateEmpresa.isSuccess && (
            <span className="text-sm text-primary flex items-center gap-1">
              <CheckCircle2 size={14} /> Guardado
            </span>
          )}
          {updateEmpresa.isError && <span className="text-sm text-destructive">{updateEmpresa.error.message}</span>}
        </div>

        <div className="border-t border-border pt-4 mt-4">
          <h4 className="text-sm font-bold text-foreground mb-3 font-display">Clave SII (credenciales portal)</h4>
          <p className="text-xs text-muted-foreground mb-3 font-sans">
            Se almacena encriptada. Se usa para obtener token SII y consultar RCV.
          </p>

          {emp.has_clave_sii && !showSiiClave ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border bg-primary/10 text-primary border-primary/20">
                <CheckCircle2 size={12} /> Clave configurada
              </span>
              <button
                onClick={() => setShowSiiClave(true)}
                className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
              >
                Cambiar
              </button>
              <button
                onClick={() => deleteSiiClave.mutate()}
                disabled={deleteSiiClave.isPending}
                className="text-xs text-destructive hover:underline disabled:opacity-50 transition-colors"
              >
                {deleteSiiClave.isPending ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          ) : (
            <div className="grid gap-3 max-w-sm">
              <input
                value={siiClave}
                onChange={(e) => setSiiClave(e.target.value)}
                type="password"
                placeholder="Ingresa tu clave SII"
                className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => saveSiiClave.mutate(siiClave)}
                  disabled={saveSiiClave.isPending || !siiClave || siiClave.length < 4}
                  className="px-4 py-2 bg-accent text-accent-foreground rounded-lg text-sm font-bold disabled:opacity-50"
                >
                  {saveSiiClave.isPending ? <Loader2 className="animate-spin text-accent-foreground" size={16} /> : "Guardar clave"}
                </button>
                {emp.has_clave_sii && (
                  <button
                    onClick={() => {
                      setShowSiiClave(false);
                      setSiiClave("");
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              {saveSiiClave.isError && <p className="text-sm text-destructive">{saveSiiClave.error.message}</p>}
              {saveSiiClave.isSuccess && (
                <p className="text-sm text-primary flex items-center gap-1">
                  <CheckCircle2 size={14} /> Clave guardada
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
