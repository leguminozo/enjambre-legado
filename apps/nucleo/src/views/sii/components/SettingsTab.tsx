import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings2,
  CheckCircle2,
  Save,
  Trash2,
  KeyRound,
  Circle,
  ShieldCheck,
  AlertTriangle,
  FileKey,
  Upload,
  Layers,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  HexagonLoader,
  ViewLoading,
  DatePicker,
  Badge,
} from "@enjambre/ui";

interface EmpresaSettings {
  id: string;
  rut: string;
  razon_social: string;
  giro: string | null;
  direccion: string | null;
  comuna: string | null;
  ciudad: string | null;
  region: string | null;
  email: string | null;
  telefono: string | null;
  regimen: string;
  acteco: string | number | null;
  sii_ambiente: string;
  fecha_inicio_actividades: string | null;
  ingresos_brutos_anio_anterior: number | null;
  has_clave_sii: boolean;
}

interface ChecklistItem {
  id: string;
  categoria: string;
  titulo: string;
  cumplido: boolean;
  critico: boolean;
  fase: string;
  detalle?: string;
}

interface CertificacionChecklist {
  listoCertificacion: boolean;
  listoProduccion: boolean;
  certCriticosPendientes: number;
  criticosPendientes: number;
  minFolios: number;
  items: ChecklistItem[];
  ambiente: string;
}

interface CafRow {
  id: string;
  tipo_dte: number;
  folio_desde: number;
  folio_hasta: number;
  folio_actual: number;
  activo: boolean;
  fecha_autorizacion: string;
  folios_restantes?: number;
}

interface CertRow {
  id: string;
  nombre: string;
  vigencia_inicio: string;
  vigencia_fin: string;
  activo: boolean;
  estado?: string;
  has_password?: boolean;
  dias_para_vencer?: number | null;
}

const emptyForm = {
  rut: "",
  razon_social: "",
  giro: "",
  direccion: "",
  comuna: "",
  ciudad: "",
  region: "",
  email: "",
  telefono: "",
  regimen: "",
  acteco: "",
  sii_ambiente: "certificacion",
  fecha_inicio_actividades: "",
  ingresos_brutos_anio_anterior: "",
};

export function SettingsTab() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();
  const p12InputRef = useRef<HTMLInputElement>(null);

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

  const checklistQuery = useQuery({
    queryKey: ["sii", "certificacion", "checklist"],
    queryFn: async (): Promise<CertificacionChecklist> => {
      const res = await apiFetch("/api/sii/certificacion/checklist");
      if (!res.ok) throw new Error("Error cargando checklist de certificación");
      const json = await res.json();
      return json.data;
    },
    retry: false,
  });

  const cafQuery = useQuery({
    queryKey: ["sii", "caf"],
    queryFn: async (): Promise<CafRow[]> => {
      const res = await apiFetch("/api/sii/caf");
      if (!res.ok) throw new Error("Error cargando CAF");
      const json = await res.json();
      return json.data ?? [];
    },
    retry: false,
  });

  const certsQuery = useQuery({
    queryKey: ["sii", "certificados"],
    queryFn: async (): Promise<CertRow[]> => {
      const res = await apiFetch("/api/sii/certificados");
      if (!res.ok) throw new Error("Error cargando certificados");
      const json = await res.json();
      return json.data ?? [];
    },
    retry: false,
  });

  const [settingsForm, setSettingsForm] = useState(emptyForm);
  const [siiClave, setSiiClave] = useState("");
  const [showSiiClave, setShowSiiClave] = useState(false);
  const [cafXml, setCafXml] = useState("");
  const [certForm, setCertForm] = useState({
    nombre: "",
    vigencia_inicio: "",
    vigencia_fin: "",
    p12_password: "",
    p12_base64: "",
    fileName: "",
  });

  useEffect(() => {
    if (empresaQuery.data) {
      const emp = empresaQuery.data;
      setSettingsForm({
        rut: emp.rut || "",
        razon_social: emp.razon_social || "",
        giro: emp.giro || "",
        direccion: emp.direccion || "",
        comuna: emp.comuna || "",
        ciudad: emp.ciudad || "",
        region: emp.region || "",
        email: emp.email || "",
        telefono: emp.telefono || "",
        regimen: emp.regimen || "",
        acteco: emp.acteco != null ? String(emp.acteco) : "",
        sii_ambiente: emp.sii_ambiente || "certificacion",
        fecha_inicio_actividades: emp.fecha_inicio_actividades
          ? emp.fecha_inicio_actividades.slice(0, 10)
          : "",
        ingresos_brutos_anio_anterior: emp.ingresos_brutos_anio_anterior
          ? String(emp.ingresos_brutos_anio_anterior)
          : "",
      });
    }
  }, [empresaQuery.data]);

  const invalidateSii = () => queryClient.invalidateQueries({ queryKey: ["sii"] });

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
    onSuccess: invalidateSii,
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
      invalidateSii();
      setSiiClave("");
      setShowSiiClave(false);
    },
  });

  const deleteSiiClave = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/empresa/sii-clave", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error eliminando clave SII");
      }
      return res.json();
    },
    onSuccess: invalidateSii,
  });

  const importCaf = useMutation({
    mutationFn: async (xml: string) => {
      const res = await apiFetch("/api/sii/caf/import-xml", {
        method: "POST",
        body: JSON.stringify({ xml, activar: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error importando CAF");
      }
      return res.json();
    },
    onSuccess: () => {
      setCafXml("");
      invalidateSii();
    },
  });

  const toggleCaf = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "activar" | "desactivar" }) => {
      const res = await apiFetch(`/api/sii/caf/${id}/${action}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error actualizando CAF");
      }
      return res.json();
    },
    onSuccess: invalidateSii,
  });

  const uploadCert = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/certificados/upload", {
        method: "POST",
        body: JSON.stringify({
          nombre: certForm.nombre || certForm.fileName || "certificado",
          vigencia_inicio: certForm.vigencia_inicio,
          vigencia_fin: certForm.vigencia_fin,
          p12_base64: certForm.p12_base64,
          p12_password: certForm.p12_password,
          activar: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error subiendo certificado");
      }
      return res.json();
    },
    onSuccess: () => {
      setCertForm({
        nombre: "",
        vigencia_inicio: "",
        vigencia_fin: "",
        p12_password: "",
        p12_base64: "",
        fileName: "",
      });
      if (p12InputRef.current) p12InputRef.current.value = "";
      invalidateSii();
    },
  });

  const toggleCert = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "activar" | "desactivar" }) => {
      const res = await apiFetch(`/api/sii/certificados/${id}/${action}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error actualizando certificado");
      }
      return res.json();
    },
    onSuccess: invalidateSii,
  });

  const deleteCert = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/sii/certificados/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error eliminando certificado");
      }
      return res.json();
    },
    onSuccess: invalidateSii,
  });

  const handleSave = () => {
    const emp = empresaQuery.data;
    if (!emp) return;

    const patch: Record<string, unknown> = {};
    const pairs: [keyof typeof settingsForm, keyof EmpresaSettings | string][] = [
      ["rut", "rut"],
      ["razon_social", "razon_social"],
      ["giro", "giro"],
      ["direccion", "direccion"],
      ["comuna", "comuna"],
      ["ciudad", "ciudad"],
      ["region", "region"],
      ["email", "email"],
      ["telefono", "telefono"],
      ["regimen", "regimen"],
      ["sii_ambiente", "sii_ambiente"],
    ];
    for (const [formKey, empKey] of pairs) {
      const next = settingsForm[formKey];
      const prev = String((emp as unknown as Record<string, unknown>)[empKey] ?? "");
      if (next !== prev) patch[formKey] = next || null;
    }
    if (settingsForm.acteco !== String(emp.acteco ?? "")) {
      patch.acteco = settingsForm.acteco || null;
    }
    if (settingsForm.fecha_inicio_actividades !== (emp.fecha_inicio_actividades ?? "").slice(0, 10)) {
      patch.fecha_inicio_actividades = settingsForm.fecha_inicio_actividades || null;
    }
    if (settingsForm.ingresos_brutos_anio_anterior !== String(emp.ingresos_brutos_anio_anterior ?? "")) {
      patch.ingresos_brutos_anio_anterior = settingsForm.ingresos_brutos_anio_anterior
        ? Number(settingsForm.ingresos_brutos_anio_anterior)
        : 0;
    }

    if (Object.keys(patch).length === 0) return;
    updateEmpresa.mutate(patch);
  };

  const onP12File = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      setCertForm((prev) => ({
        ...prev,
        p12_base64: base64,
        fileName: file.name,
        nombre: prev.nombre || file.name.replace(/\.p12$/i, ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const regimenLabels: Record<string, string> = {
    pro_pyme_transparente: "Pyme Transparente (Art. 14 D N°8)",
    pro_pyme_general: "Pro Pyme General (Art. 14 D N°3)",
    semi_integrado: "Semi Integrado",
    general: "General",
  };

  if (empresaQuery.isLoading) {
    return (
      <Card className="max-w-3xl">
        <CardContent>
          <ViewLoading variant="view" label="Configuración SII" hideLabel />
        </CardContent>
      </Card>
    );
  }

  if (empresaQuery.isError) {
    return (
      <Card className="max-w-3xl border-destructive/30">
        <CardContent className="p-6">
          <p className="text-sm text-destructive font-medium">{empresaQuery.error.message}</p>
        </CardContent>
      </Card>
    );
  }

  const emp = empresaQuery.data;
  if (!emp) return null;
  const checklist = checklistQuery.data;

  const field = (
    label: string,
    key: keyof typeof settingsForm,
    opts?: { mono?: boolean; placeholder?: string; type?: string },
  ) => (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground font-medium">{label}</label>
      <input
        value={settingsForm[key]}
        onChange={(e) => setSettingsForm((prev) => ({ ...prev, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
        type={opts?.type ?? "text"}
        className={`w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${
          opts?.mono ? "font-mono" : ""
        }`}
      />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      {/* Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={18} /> Checklist certificación / go-live SII
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {checklistQuery.isLoading && <ViewLoading variant="view" label="Checklist SII" hideLabel />}
          {checklistQuery.isError && (
            <p className="text-sm text-destructive font-medium">
              {(checklistQuery.error as Error).message}
            </p>
          )}
          {checklist && (
            <>
              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    checklist.listoCertificacion
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-warning/10 text-warning border-warning/20"
                  }`}
                >
                  {checklist.listoCertificacion ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  Maullín:{" "}
                  {checklist.listoCertificacion ? "lista" : `${checklist.certCriticosPendientes} crítico(s)`}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    checklist.listoProduccion
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {checklist.listoProduccion ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                  Palena:{" "}
                  {checklist.listoProduccion ? "lista" : `${checklist.criticosPendientes} pendiente(s)`}
                </span>
              </div>
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {checklist.items.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 px-3 py-2.5 bg-surface-sunken/40 text-sm">
                    {item.cumplido ? (
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
                    ) : (
                      <Circle
                        size={16}
                        className={`mt-0.5 shrink-0 ${item.critico ? "text-warning" : "text-muted-foreground"}`}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{item.titulo}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
                          {item.fase}
                        </span>
                      </div>
                      {item.detalle && (
                        <p className="text-xs text-muted-foreground mt-0.5">{item.detalle}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      {/* Identidad emisor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 size={18} /> Emisor · identidad y domicilio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-xs text-muted-foreground">
            Datos que van en el XML del DTE. Configurá todo acá — no hace falta SQL ni env para RUT/giro/dirección.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("RUT emisor", "rut", { mono: true, placeholder: "76.XXX.XXX-X" })}
            {field("Razón social", "razon_social", { placeholder: "OYZ SpA" })}
          </div>
          {field("Giro", "giro", { placeholder: "Elaboración de productos de miel" })}
          {field("Dirección", "direccion", { placeholder: "Calle, número" })}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {field("Comuna", "comuna")}
            {field("Ciudad", "ciudad")}
            {field("Región", "region")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field("Email", "email", { type: "email" })}
            {field("Teléfono", "telefono")}
          </div>

          <div className="border-t border-border pt-5 grid gap-4">
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
              {field("Acteco (código SII)", "acteco", { placeholder: "731000", type: "number" })}
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
                <DatePicker
                  value={settingsForm.fecha_inicio_actividades}
                  onChange={(val) =>
                    setSettingsForm((prev) => ({ ...prev, fecha_inicio_actividades: val }))
                  }
                  className="w-full"
                />
              </div>
              {field("Ingresos brutos año anterior (CLP)", "ingresos_brutos_anio_anterior", {
                type: "number",
                placeholder: "5000000",
              })}
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleSave} disabled={updateEmpresa.isPending}>
              {updateEmpresa.isPending ? (
                <HexagonLoader size="sm" className="mr-2" />
              ) : (
                <Save size={16} className="mr-2" />
              )}
              Guardar emisor
            </Button>
            {updateEmpresa.isSuccess && (
              <span className="text-sm text-primary flex items-center gap-1.5 font-medium bg-primary/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 size={16} /> Guardado
              </span>
            )}
            {updateEmpresa.isError && (
              <span className="text-sm text-destructive font-medium">{updateEmpresa.error.message}</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clave portal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound size={18} /> Clave portal SII
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Se almacena cifrada. Usada para token SII / RCV. Requiere material de cifrado en el servidor
            (SII_CLAVE_ENCRYPTION_KEY).
          </p>
          {emp.has_clave_sii && !showSiiClave ? (
            <div className="flex items-center gap-4 bg-surface-sunken p-4 rounded-xl border border-border">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border bg-primary/10 text-primary border-primary/20">
                <CheckCircle2 size={14} /> Clave configurada
              </span>
              <button
                type="button"
                onClick={() => setShowSiiClave(true)}
                className="text-sm text-muted-foreground hover:text-foreground font-medium"
              >
                Cambiar
              </button>
              <button
                type="button"
                onClick={() => deleteSiiClave.mutate()}
                disabled={deleteSiiClave.isPending}
                className="text-sm text-destructive font-medium flex items-center gap-1 disabled:opacity-50"
              >
                {deleteSiiClave.isPending ? <HexagonLoader size="sm" /> : <Trash2 size={14} />}
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
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  onClick={() => saveSiiClave.mutate(siiClave)}
                  disabled={saveSiiClave.isPending || siiClave.length < 4}
                >
                  {saveSiiClave.isPending ? <HexagonLoader size="sm" className="mr-2" /> : null}
                  Guardar clave
                </Button>
                {emp.has_clave_sii && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSiiClave(false);
                      setSiiClave("");
                    }}
                    className="text-sm text-muted-foreground"
                  >
                    Cancelar
                  </button>
                )}
              </div>
              {saveSiiClave.isError && (
                <p className="text-sm text-destructive">{saveSiiClave.error.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certificado P12 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileKey size={18} /> Certificado digital P12
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Subí el .p12 y su contraseña desde la app. La clave se cifra; el archivo va a storage privado.
          </p>
          {certsQuery.isLoading && <ViewLoading variant="inline" label="Certificados" hideLabel />}
          {(certsQuery.data ?? []).length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {(certsQuery.data ?? []).map((cert) => (
                <li key={cert.id} className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-surface-sunken/40 text-sm">
                  <span className="font-medium flex-1 min-w-[8rem]">{cert.nombre}</span>
                  <Badge variant={cert.activo ? "success" : "default"}>
                    {cert.estado ?? (cert.activo ? "activo" : "inactivo")}
                  </Badge>
                  {cert.has_password === false && (
                    <Badge variant="danger">sin clave</Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {String(cert.vigencia_inicio).slice(0, 10)} → {String(cert.vigencia_fin).slice(0, 10)}
                  </span>
                  {!cert.activo ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleCert.mutate({ id: cert.id, action: "activar" })}
                    >
                      Activar
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleCert.mutate({ id: cert.id, action: "desactivar" })}
                    >
                      Desactivar
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("¿Eliminar certificado?")) deleteCert.mutate(cert.id);
                    }}
                  >
                    <Trash2 size={14} />
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="grid gap-3 p-4 rounded-xl border border-border bg-surface-sunken">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Nombre</label>
                <input
                  value={certForm.nombre}
                  onChange={(e) => setCertForm((p) => ({ ...p, nombre: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="e-Cert / E-CERTCHILE"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Archivo .p12</label>
                <input
                  ref={p12InputRef}
                  type="file"
                  accept=".p12,.pfx"
                  onChange={(e) => onP12File(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-semibold"
                />
                {certForm.fileName && (
                  <p className="text-[11px] text-muted-foreground">{certForm.fileName} listo</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Vigencia inicio</label>
                <DatePicker
                  value={certForm.vigencia_inicio}
                  onChange={(val) => setCertForm((p) => ({ ...p, vigencia_inicio: val }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Vigencia fin</label>
                <DatePicker
                  value={certForm.vigencia_fin}
                  onChange={(val) => setCertForm((p) => ({ ...p, vigencia_fin: val }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Contraseña P12</label>
                <input
                  type="password"
                  value={certForm.p12_password}
                  onChange={(e) => setCertForm((p) => ({ ...p, p12_password: e.target.value }))}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <Button
              onClick={() => uploadCert.mutate()}
              disabled={
                uploadCert.isPending ||
                !certForm.p12_base64 ||
                !certForm.p12_password ||
                !certForm.vigencia_inicio ||
                !certForm.vigencia_fin
              }
            >
              {uploadCert.isPending ? (
                <HexagonLoader size="sm" className="mr-2" />
              ) : (
                <Upload size={16} className="mr-2" />
              )}
              Subir y activar certificado
            </Button>
            {uploadCert.isError && (
              <p className="text-sm text-destructive">{uploadCert.error.message}</p>
            )}
            {uploadCert.isSuccess && (
              <p className="text-sm text-primary flex items-center gap-1.5">
                <CheckCircle2 size={16} /> Certificado cargado
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* CAF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers size={18} /> Folios CAF
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Pegá el XML completo de autorización CAF del SII (incluye RSASK/RSAPUBK). Se activa por tipo DTE
            (39 boleta, 33 factura, 46 FC…).
          </p>
          {cafQuery.isLoading && <ViewLoading variant="inline" label="CAF" hideLabel />}
          {(cafQuery.data ?? []).length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {(cafQuery.data ?? []).map((caf) => {
                const rest =
                  caf.folios_restantes ??
                  Math.max(0, Number(caf.folio_hasta) - Number(caf.folio_actual));
                return (
                  <li
                    key={caf.id}
                    className="flex flex-wrap items-center gap-2 px-3 py-2.5 bg-surface-sunken/40 text-sm"
                  >
                    <span className="font-mono font-semibold">Tipo {caf.tipo_dte}</span>
                    <span className="text-muted-foreground text-xs">
                      {caf.folio_desde}–{caf.folio_hasta} · quedan {rest}
                    </span>
                    <Badge variant={caf.activo ? "success" : "default"}>
                      {caf.activo ? "activo" : "inactivo"}
                    </Badge>
                    {!caf.activo ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCaf.mutate({ id: caf.id, action: "activar" })}
                      >
                        Activar
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleCaf.mutate({ id: caf.id, action: "desactivar" })}
                      >
                        Desactivar
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground font-medium">XML AUTORIZACION / CAF</label>
            <textarea
              value={cafXml}
              onChange={(e) => setCafXml(e.target.value)}
              rows={6}
              placeholder={"<?xml version=\"1.0\"?>\n<AUTORIZACION>…</AUTORIZACION>"}
              className="w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <Button
              onClick={() => importCaf.mutate(cafXml)}
              disabled={importCaf.isPending || cafXml.trim().length < 20}
            >
              {importCaf.isPending ? (
                <HexagonLoader size="sm" className="mr-2" />
              ) : (
                <Upload size={16} className="mr-2" />
              )}
              Importar CAF y activar
            </Button>
            {importCaf.isError && (
              <p className="text-sm text-destructive">{importCaf.error.message}</p>
            )}
            {importCaf.isSuccess && (
              <p className="text-sm text-primary flex items-center gap-1.5">
                <CheckCircle2 size={16} /> CAF importado
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
