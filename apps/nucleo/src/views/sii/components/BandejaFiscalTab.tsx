import React, { useCallback, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Receipt,
  CheckCircle2,
  Send,
  Upload,
  FileText,
  Inbox,
  ClipboardPaste,
  AlertTriangle,
  RotateCcw,
  Table2,
} from "lucide-react";
import { useApiFetch } from "@/hooks/use-api-fetch";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader, CardTitle, CardContent, Button, HexagonLoader, ViewLoading, LoadingOverlay } from "@enjambre/ui";
import {
  BandejaGastoRow,
  FiscalUploadResult,
  GastoExtranjeroEstado,
  GastoParseado,
  ParseConfidenceView,
  ProveedorInfo,
  gastoEstadoBadge,
  sourceBadge,
} from "../types";
import { ResponsiveTabBar } from "@/components/layout/ResponsiveTabBar";

type ProcesarResult = {
  ok: true;
  alreadyProcessed: boolean;
  gastoId: string;
  facturaCompraId: string;
  idempotencyKey: string;
  emission?: { trackId: string; estadoSii: string };
  rcv?: { periodo: string; reconciledCount: number };
  warnings?: string[];
};

type EntradaMode = "pdf" | "texto" | "csv";

const ESTADO_FILTERS: { value: GastoExtranjeroEstado | ""; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "pendiente_revision", label: "Revisión" },
  { value: "parseado", label: "Parseados" },
  { value: "facturado", label: "Facturados" },
  { value: "enviado_sii", label: "Enviados" },
  { value: "aceptado_sii", label: "Aceptados" },
  { value: "rechazado_sii", label: "Rechazados" },
];

function ConfidenceBadge({ confidence }: { confidence: ParseConfidenceView }) {
  const pct = Math.round(confidence.score * 100);
  const tone =
    confidence.requiresReview
      ? "text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20"
      : "text-primary bg-primary/10 border-primary/20";

  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold uppercase tracking-wider">
          Confianza {pct}% · {confidence.parserId}
        </span>
        {confidence.requiresReview && (
          <span className="inline-flex items-center gap-1">
            <AlertTriangle size={12} /> Revisión requerida
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(confidence.campos).map(([campo, estado]) => (
          <span
            key={campo}
            className={`px-2 py-0.5 rounded-full border text-[0.65rem] ${
              estado === "ok"
                ? "border-primary/30 text-primary"
                : estado === "inferido"
                  ? "border-amber-500/30 text-amber-700 dark:text-amber-400"
                  : "border-destructive/30 text-destructive"
            }`}
          >
            {campo}: {estado}
          </span>
        ))}
      </div>
    </div>
  );
}

const ACCEPTED_FILE_TYPES = "application/pdf,image/png,image/jpeg,image/webp";

function GastoPreviewCard({ gasto }: { gasto: GastoParseado }) {
  return (
    <div className="bg-surface-sunken rounded-lg p-5 space-y-3 text-sm border border-border">
      <div className="flex items-center gap-2 text-primary font-bold text-lg">
        <CheckCircle2 size={18} /> {gasto.proveedorNombre}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-muted-foreground">
        <div className="flex flex-col">
          <span className="text-xs uppercase">RUT</span>
          <span className="text-foreground font-mono">{gasto.proveedorRut}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase">Giro</span>
          <span className="text-foreground">{gasto.proveedorGiro}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase">Concepto</span>
          <span className="text-foreground">{gasto.concepto}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs uppercase">Fecha</span>
          <span className="text-foreground">{gasto.fechaEmision}</span>
        </div>
        {gasto.numeroDocumento && (
          <div className="flex flex-col">
            <span className="text-xs uppercase">Documento</span>
            <span className="text-foreground font-mono">{gasto.numeroDocumento}</span>
          </div>
        )}
      </div>
      <div className="border-t border-border pt-4 mt-2 space-y-2">
        {gasto.monedaOriginal !== "CLP" && (
          <>
            <div className="flex justify-between text-muted-foreground">
              <span>Monto original:</span>
              <span className="text-foreground font-mono">
                {gasto.monedaOriginal}{" "}
                {gasto.montoOriginal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Tasa de cambio:</span>
              <span className="text-foreground font-mono">
                ${gasto.tasaCambio.toLocaleString("es-CL")}/USD
              </span>
            </div>
          </>
        )}
        <div className="flex justify-between font-bold text-lg text-foreground border-t border-border pt-2 mt-2">
          <span>Total a Facturar:</span>
          <span className="font-mono text-primary">{formatCurrency(gasto.montoTotal)}</span>
        </div>
      </div>
    </div>
  );
}

function ProcesarResultCard({
  result,
  onReset,
}: {
  result: ProcesarResult;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-4" data-testid="bandeja-resultado">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-primary font-bold">
          <CheckCircle2 size={18} />
          {result.alreadyProcessed ? "Gasto ya procesado" : "Pipeline completado"}
        </div>
        <div className="grid gap-1 text-muted-foreground font-mono text-xs">
          <div>Gasto: {result.gastoId}</div>
          <div>Factura compra: {result.facturaCompraId}</div>
          {result.emission && (
            <>
              <div>Track SII: {result.emission.trackId}</div>
              <div>Estado SII: {result.emission.estadoSii}</div>
            </>
          )}
          {result.rcv && (
            <div>
              RCV {result.rcv.periodo}: {result.rcv.reconciledCount} reconciliados
            </div>
          )}
        </div>
        {result.warnings?.map((w) => (
          <p key={w} className="text-xs text-amber-600 dark:text-amber-400">
            {w}
          </p>
        ))}
      </div>
      <Button variant="outline" onClick={onReset}>
        Procesar otro documento
      </Button>
    </div>
  );
}

export function BandejaFiscalTab() {
  const queryClient = useQueryClient();
  const apiFetch = useApiFetch();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [entradaMode, setEntradaMode] = useState<EntradaMode>("pdf");
  const [estadoFilter, setEstadoFilter] = useState<GastoExtranjeroEstado | "">("");
  const [isDragging, setIsDragging] = useState(false);

  const [receiptText, setReceiptText] = useState("");
  const [proveedorId, setProveedorId] = useState("");
  const [fiscalDocumentId, setFiscalDocumentId] = useState<string | null>(null);
  const [uploadMeta, setUploadMeta] = useState<FiscalUploadResult | null>(null);
  const [gastoParseado, setGastoParseado] = useState<GastoParseado | null>(null);
  const [parseConfidence, setParseConfidence] = useState<ParseConfidenceView | null>(null);
  const [forceConfirm, setForceConfirm] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [csvResult, setCsvResult] = useState<{ exitosos: number; fallidos: number } | null>(null);
  const [procesarResult, setProcesarResult] = useState<ProcesarResult | null>(null);

  const proveedoresQuery = useQuery({
    queryKey: ["sii", "proveedores"],
    queryFn: async (): Promise<ProveedorInfo[]> => {
      const res = await apiFetch("/api/sii/gastos-extranjero/proveedores");
      if (!res.ok) throw new Error("Error cargando proveedores");
      const json = await res.json();
      return json.data ?? [];
    },
    retry: false,
  });

  const bandejaQuery = useQuery({
    queryKey: ["sii", "bandeja", estadoFilter],
    queryFn: async (): Promise<BandejaGastoRow[]> => {
      const params = new URLSearchParams({ limit: "50" });
      if (estadoFilter) params.set("estado", estadoFilter);
      const res = await apiFetch(`/api/sii/gastos-extranjero/bandeja?${params}`);
      if (!res.ok) throw new Error("Error cargando bandeja fiscal");
      const json = await res.json();
      return json.data ?? [];
    },
    retry: false,
  });

  const parseFromText = useCallback(
    async (text: string, overrideProveedor?: string) => {
      const res = await apiFetch("/api/sii/gastos-extranjero/parse", {
        method: "POST",
        body: JSON.stringify({
          receipt_text: text,
          proveedor_id: overrideProveedor || proveedorId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Error parseando recibo");
      }
      const json = await res.json();
      if (json.confidence) setParseConfidence(json.confidence as ParseConfidenceView);
      return json.data as GastoParseado;
    },
    [apiFetch, proveedorId],
  );

  const uploadDocument = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/api/sii/gastos-extranjero/upload", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Error subiendo documento");
      return json.data as FiscalUploadResult;
    },
    onSuccess: async (data) => {
      setUploadMeta(data);
      setFiscalDocumentId(data.id);
      setProcesarResult(null);

      if (data.proveedor_detectado && !proveedorId) {
        setProveedorId(data.proveedor_detectado);
      }

      if (data.extracted_text && data.extracted_text.length >= 10) {
        setReceiptText(data.extracted_text);
        try {
          const parsed = await parseFromText(
            data.extracted_text,
            data.proveedor_detectado ?? undefined,
          );
          setGastoParseado(parsed);
        } catch {
          setGastoParseado(null);
        }
      }
    },
  });

  const parseGasto = useMutation({
    mutationFn: () => parseFromText(receiptText),
    onSuccess: (parsed) => {
      setGastoParseado(parsed);
      setProcesarResult(null);
    },
  });

  const procesarGasto = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        emit_to_sii: true,
        sync_rcv: true,
        receipt_raw: receiptText || undefined,
      };

      if (parseConfidence) body.parse_confidence = parseConfidence;
      if (forceConfirm) body.force_confirm = true;

      if (gastoParseado) {
        body.gasto = gastoParseado;
      } else if (fiscalDocumentId) {
        body.fiscal_document_id = fiscalDocumentId;
      } else if (receiptText) {
        body.receipt_text = receiptText;
        if (proveedorId) body.proveedor_id = proveedorId;
      } else {
        throw new Error("No hay documento para procesar");
      }

      const res = await apiFetch("/api/sii/gastos-extranjero/procesar", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Error procesando gasto");
      return json.data as ProcesarResult;
    },
    onSuccess: (result) => {
      setProcesarResult(result);
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const importCsv = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/sii/gastos-extranjero/import-csv", {
        method: "POST",
        body: JSON.stringify({ csv_text: csvText, emit_to_sii: true, force_confirm: forceConfirm }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Error importando CSV");
      return json.data as { exitosos: number; fallidos: number; total: number };
    },
    onSuccess: (data) => {
      setCsvResult({ exitosos: data.exitosos, fallidos: data.fallidos });
      queryClient.invalidateQueries({ queryKey: ["sii"] });
    },
  });

  const reintentarGasto = useMutation({
    mutationFn: async (gastoId: string) => {
      const res = await apiFetch(`/api/sii/gastos-extranjero/procesar/${gastoId}/reintentar`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Error reintentando emisión");
      return json.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sii"] }),
  });

  const resetEntrada = () => {
    setReceiptText("");
    setProveedorId("");
    setFiscalDocumentId(null);
    setUploadMeta(null);
    setGastoParseado(null);
    setParseConfidence(null);
    setForceConfirm(false);
    setCsvText("");
    setCsvResult(null);
    setProcesarResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    uploadDocument.mutate(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const onSubmitParse = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFiscalDocumentId(null);
    setUploadMeta(null);
    parseGasto.mutate();
  };

  const proveedores = proveedoresQuery.data ?? [];
  const bandeja = bandejaQuery.data ?? [];
  const showRevision = !procesarResult && gastoParseado;

  return (
    <div
      data-testid="bandeja-fiscal"
      className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Inbox size={18} /> Bandeja Fiscal — Entrada
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Sube un PDF o pega el texto del invoice. Revisa los montos antes de emitir la Factura de
            Compra tipo 46 al SII.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <ResponsiveTabBar
            variant="pill"
            layoutId="bandeja-entrada"
            tabs={[
              { id: "pdf", label: "PDF / Imagen", icon: <Upload size={14} />, testId: "bandeja-mode-pdf" },
              { id: "texto", label: "Pegar texto", icon: <ClipboardPaste size={14} />, testId: "bandeja-mode-texto" },
              { id: "csv", label: "CSV masivo", icon: <Table2 size={14} />, testId: "bandeja-mode-csv" },
            ]}
            activeId={entradaMode}
            onChange={(id) => setEntradaMode(id as EntradaMode)}
          />

          <div className="flex flex-wrap gap-2">
            {proveedoresQuery.isLoading ? (
              <HexagonLoader size="sm" />
            ) : (
              proveedores.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setProveedorId(proveedorId === p.id ? "" : p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                    proveedorId === p.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-surface-sunken text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {p.nombre}
                </button>
              ))
            )}
          </div>

          {procesarResult ? (
            <ProcesarResultCard result={procesarResult} onReset={resetEntrada} />
          ) : showRevision ? (
            <div className="grid gap-6">
              {uploadMeta && (
                <div className="text-xs text-muted-foreground font-mono bg-surface-sunken border border-border rounded-lg px-3 py-2">
                  Documento: {uploadMeta.mime_type} · {uploadMeta.sha256.slice(0, 12)}…
                  {uploadMeta.already_exists ? " (ya existía)" : ""}
                </div>
              )}
              {parseConfidence && <ConfidenceBadge confidence={parseConfidence} />}
              <GastoPreviewCard gasto={gastoParseado} />
              {parseConfidence?.requiresReview && (
                <label className="flex items-start gap-3 text-sm text-muted-foreground border border-amber-500/20 bg-amber-500/5 rounded-lg p-3">
                  <input
                    type="checkbox"
                    checked={forceConfirm}
                    onChange={(e) => setForceConfirm(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    Confirmo que revisé montos, fecha y proveedor. Autorizo emitir la Factura de Compra
                    aunque la confianza automática sea inferior al 85%.
                  </span>
                </label>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-xs uppercase text-muted-foreground">
                  Nº documento
                  <input
                    value={gastoParseado.numeroDocumento}
                    onChange={(e) =>
                      setGastoParseado({ ...gastoParseado, numeroDocumento: e.target.value })
                    }
                    className="mt-1 w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground"
                  />
                </label>
                <label className="text-xs uppercase text-muted-foreground">
                  Fecha emisión
                  <input
                    type="date"
                    value={gastoParseado.fechaEmision}
                    onChange={(e) =>
                      setGastoParseado({ ...gastoParseado, fechaEmision: e.target.value })
                    }
                    className="mt-1 w-full bg-surface-sunken border border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  data-testid="bandeja-procesar-btn"
                  onClick={() => procesarGasto.mutate()}
                  disabled={
                    procesarGasto.isPending ||
                    (parseConfidence?.requiresReview === true && !forceConfirm)
                  }
                >
                  {procesarGasto.isPending ? (
                    <HexagonLoader size="sm" className="mr-2" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Procesar y enviar al SII
                </Button>
                <Button variant="outline" onClick={resetEntrada}>
                  Cancelar
                </Button>
              </div>
              {procesarGasto.isError && (
                <p className="text-sm text-destructive">{procesarGasto.error.message}</p>
              )}
            </div>
          ) : entradaMode === "pdf" ? (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border bg-surface-sunken hover:border-primary/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FILE_TYPES}
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                {uploadDocument.isPending ? (
                  <div className="flex flex-col items-center gap-3">
                    <ViewLoading variant="inline" label="Extrayendo documento" hideLabel />
                    <p className="text-sm text-muted-foreground">Extrayendo texto del documento…</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload size={32} className="text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      Arrastra un PDF o imagen aquí
                    </p>
                    <p className="text-xs text-muted-foreground">Máx. 10 MB · PDF, PNG, JPG, WebP</p>
                  </div>
                )}
              </div>
              {uploadDocument.isError && (
                <p className="text-sm text-destructive">{uploadDocument.error.message}</p>
              )}
              {uploadMeta && !gastoParseado && (
                <div className="space-y-3">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    No se pudo parsear automáticamente. Pega o edita el texto extraído y analiza de
                    nuevo.
                  </p>
                  <textarea
                    value={receiptText}
                    onChange={(e) => setReceiptText(e.target.value)}
                    rows={6}
                    className="w-full bg-surface-sunken border border-border rounded-lg px-4 py-3 text-sm font-mono resize-y text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <Button
                    onClick={() => parseGasto.mutate()}
                    disabled={parseGasto.isPending || receiptText.length < 10}
                  >
                    {parseGasto.isPending ? <HexagonLoader size="sm" className="mr-2" /> : null}
                    Analizar texto extraído
                  </Button>
                </div>
              )}
            </div>
          ) : entradaMode === "csv" ? (
            <div className="grid gap-4" data-testid="bandeja-csv-form">
              <p className="text-sm text-muted-foreground">
                Una línea por recibo. Opcional: <code className="font-mono">proveedor_id,</code> al inicio
                (ej. <code className="font-mono">meta-ads,Meta Ads Invoice…</code>).
              </p>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={10}
                placeholder={"meta-ads,Meta Ads Invoice #123 Total USD 45.00\nuber,Uber Business Trip X Total $8900"}
                className="w-full bg-surface-sunken border border-border rounded-lg px-4 py-3 text-sm font-mono resize-y text-foreground"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={forceConfirm}
                  onChange={(e) => setForceConfirm(e.target.checked)}
                />
                Forzar confirmación en líneas con baja confianza
              </label>
              <Button
                onClick={() => importCsv.mutate()}
                disabled={importCsv.isPending || csvText.trim().length < 10}
              >
                {importCsv.isPending ? <HexagonLoader size="sm" className="mr-2" /> : <Table2 className="w-4 h-4 mr-2" />}
                Importar y procesar
              </Button>
              {csvResult && (
                <p className="text-sm text-muted-foreground">
                  Importación: {csvResult.exitosos} exitosos · {csvResult.fallidos} fallidos
                </p>
              )}
              {importCsv.isError && (
                <p className="text-sm text-destructive">{importCsv.error.message}</p>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmitParse} className="grid gap-4" data-testid="bandeja-texto-form">
              <textarea
                data-testid="bandeja-receipt-text"
                value={receiptText}
                onChange={(e) => setReceiptText(e.target.value)}
                placeholder="Pega aquí el texto del recibo, invoice o billing statement..."
                rows={8}
                required
                className="w-full bg-surface-sunken border border-border rounded-lg px-4 py-3 text-sm font-mono resize-y text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                type="submit"
                data-testid="bandeja-analizar-btn"
                disabled={parseGasto.isPending}
                className="w-full sm:w-auto"
              >
                {parseGasto.isPending ? <HexagonLoader size="sm" className="mr-2" /> : null}
                Analizar recibo
              </Button>
              {parseGasto.isError && (
                <p className="text-sm text-destructive">{parseGasto.error.message}</p>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      <Card data-testid="bandeja-cola">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt size={18} /> Cola de documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative">
          {bandejaQuery.isFetching && bandeja.length > 0 ? <LoadingOverlay label="Actualizando cola" /> : null}
          <div className="flex flex-wrap gap-2">
            {ESTADO_FILTERS.map((f) => (
              <button
                key={f.value || "all"}
                type="button"
                onClick={() => setEstadoFilter(f.value)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                  estadoFilter === f.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {bandejaQuery.isLoading ? (
            <ViewLoading variant="view" label="Cola fiscal" hideLabel />
          ) : bandeja.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">
              No hay documentos en esta cola.
            </p>
          ) : (
            <ul className="divide-y divide-border max-h-[520px] overflow-y-auto">
              {bandeja.map((row) => (
                <li key={row.id} className="py-3 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground text-sm truncate">
                          {row.proveedor_nombre}
                        </span>
                        {sourceBadge(row.proveedor_id)}
                        {row.fiscal_documents?.mime_type === "application/pdf" && (
                          <FileText size={14} className="text-muted-foreground shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {row.concepto}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {row.fecha_emision}
                        {row.numero_documento ? ` · ${row.numero_documento}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-semibold text-foreground">
                        {formatCurrency(row.monto_total)}
                      </div>
                      <div className="mt-1">{gastoEstadoBadge(row.estado)}</div>
                      {row.parse_confidence != null && (
                        <div className="text-[0.65rem] text-muted-foreground mt-1">
                          {Math.round(row.parse_confidence * 100)}% · {row.parser_id ?? "—"}
                        </div>
                      )}
                    </div>
                  </div>
                  {["rechazado_sii", "facturado", "enviado_sii"].includes(row.estado) && row.factura_compra_id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      disabled={reintentarGasto.isPending}
                      onClick={() => reintentarGasto.mutate(row.id)}
                    >
                      <RotateCcw size={14} className="mr-2" />
                      Reintentar emisión SII
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}