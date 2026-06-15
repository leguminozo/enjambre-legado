import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings2, CheckCircle2, Save, Trash2, KeyRound } from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { Card, CardHeader, CardTitle, CardContent, Button, Spinner } from "@enjambre/ui";

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
      <Card className="max-w-2xl">
        <CardContent className="flex justify-center py-12">
          <Spinner className="w-8 h-8 text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (empresaQuery.isError) {
    return (
      <Card className="max-w-2xl border-destructive/30">
        <CardContent className="p-6">
          <p className="text-sm text-destructive font-medium">{empresaQuery.error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const emp = empresaQuery.data;
  if (!emp) return null;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 size={18} /> Configuración SII Empresa
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-surface-sunken rounded-xl text-sm border border-border flex flex-wrap gap-4 items-center">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">RUT</span>
            <span className="font-mono text-foreground font-bold text-base">{emp.rut}</span>
          </div>
          <div className="w-px h-8 bg-border hidden sm:block" />
          <div className="flex flex-col flex-1">
            <span className="text-xs text-muted-foreground font-medium">Razón Social</span>
            <span className="text-foreground font-semibold line-clamp-1">{emp.razon_social}</span>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground font-medium">Régimen tributario</label>
            <select
              value={settingsForm.regimen}
              onChange={(e) => setSettingsForm((prev) => ({ ...prev, regimen: e.target.value }))}
              className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {Object.entries(regimenLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Acteco (código SII)</label>
              <input
                value={settingsForm.acteco}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, acteco: e.target.value }))}
                placeholder="Ej: 731000"
                type="number"
                className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Ambiente SII</label>
              <select
                value={settingsForm.sii_ambiente}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, sii_ambiente: e.target.value }))}
                className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="certificacion">Certificación (Maullín)</option>
                <option value="produccion">Producción (Palena)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Fecha inicio actividades</label>
              <input
                value={settingsForm.fecha_inicio_actividades}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, fecha_inicio_actividades: e.target.value }))}
                type="date"
                className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground font-medium">Ingresos brutos año anterior (CLP)</label>
              <input
                value={settingsForm.ingresos_brutos_anio_anterior}
                onChange={(e) => setSettingsForm((prev) => ({ ...prev, ingresos_brutos_anio_anterior: e.target.value }))}
                placeholder="Ej: 5000000"
                type="number"
                className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            onClick={handleSave}
            disabled={updateEmpresa.isPending}
          >
            {updateEmpresa.isPending ? <Spinner className="w-4 h-4 mr-2" /> : <Save size={16} className="mr-2" />} 
            Guardar cambios
          </Button>
          {updateEmpresa.isSuccess && (
            <span className="text-sm text-primary flex items-center gap-1.5 font-medium bg-primary/10 px-3 py-1.5 rounded-full">
              <CheckCircle2 size={16} /> Guardado
            </span>
          )}
          {updateEmpresa.isError && <span className="text-sm text-destructive font-medium">{updateEmpresa.error.message}</span>}
        </div>

        <div className="border-t border-border pt-6 mt-4">
          <h4 className="text-sm font-bold text-foreground mb-1 font-display flex items-center gap-2">
            <KeyRound size={16} /> Clave SII (credenciales portal)
          </h4>
          <p className="text-xs text-muted-foreground mb-4 font-sans">
            Se almacena encriptada. Se usa para obtener token SII y consultar RCV.
          </p>

          {emp.has_clave_sii && !showSiiClave ? (
            <div className="flex items-center gap-4 bg-surface-sunken p-4 rounded-xl border border-border">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20">
                <CheckCircle2 size={14} /> Clave configurada
              </span>
              <button
                onClick={() => setShowSiiClave(true)}
                className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Cambiar
              </button>
              <button
                onClick={() => deleteSiiClave.mutate()}
                disabled={deleteSiiClave.isPending}
                className="text-sm text-destructive hover:text-destructive/80 font-medium disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {deleteSiiClave.isPending ? <Spinner className="w-3 h-3 text-destructive" /> : <Trash2 size={14} />} 
                Eliminar
              </button>
            </div>
          ) : (
            <div className="grid gap-3 max-w-sm bg-surface-sunken p-4 rounded-xl border border-border">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Nueva clave SII</label>
                <input
                  value={siiClave}
                  onChange={(e) => setSiiClave(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <Button
                  onClick={() => saveSiiClave.mutate(siiClave)}
                  disabled={saveSiiClave.isPending || !siiClave || siiClave.length < 4}
                  size="sm"
                >
                  {saveSiiClave.isPending ? <Spinner className="w-4 h-4 mr-2" /> : null} 
                  Guardar clave
                </Button>
                {emp.has_clave_sii && (
                  <button
                    onClick={() => {
                      setShowSiiClave(false);
                      setSiiClave("");
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground font-medium"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              {saveSiiClave.isError && <p className="text-sm text-destructive font-medium mt-1">{saveSiiClave.error.message}</p>}
              {saveSiiClave.isSuccess && (
                <p className="text-sm text-primary flex items-center gap-1.5 font-medium mt-1">
                  <CheckCircle2 size={16} /> Clave guardada
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
