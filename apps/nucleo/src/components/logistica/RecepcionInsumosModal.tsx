'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import {
  PackageCheck,
  Loader2,
  FileText,
  AlertCircle,
  Plus,
  Trash2,
  UploadCloud,
  Receipt,
  CheckCircle2,
  Calculator,
  Layers,
} from 'lucide-react';
import { ImmersiveModal, toast, formatCLP } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { useProductTaxonomies } from '@/hooks/use-product-taxonomies';
import type { Proveedor } from '@/components/logistica/types';

interface RecepcionInsumosModalProps {
  open: boolean;
  onClose: () => void;
  proveedor: Proveedor | null;
  onSuccess: () => Promise<void> | void;
}

export type LineaDraftRecepcion = {
  id: string;
  item_id: string;
  nombre: string;
  unidad: string;
  stock_actual: number;
  cantidad: number;
  costo_unitario: number;
  formato_asignado: string; // valor de product_formats (ej. '500g', '150g', '1kg', 'Panal')
};

type ModoEntrada = 'manual' | 'sii' | 'upload';

type FacturaCompraLocal = {
  id: string;
  folio: string;
  fecha_emision: string;
  receptor_rut?: string | null;
  receptor_razon_social?: string | null;
  monto_neto?: number | null;
  monto_total?: number | null;
  descripcion?: string | null;
};

export function RecepcionInsumosModal({
  open,
  onClose,
  proveedor,
  onSuccess,
}: RecepcionInsumosModalProps) {
  const apiFetch = useApiFetch();
  const { data: taxonomies } = useProductTaxonomies();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modo, setModo] = useState<ModoEntrada>('manual');
  const [lineas, setLineas] = useState<LineaDraftRecepcion[]>([]);
  const [docTipo, setDocTipo] = useState<'guia' | 'factura' | 'boleta' | 'comprobante' | 'otro'>('guia');
  const [docNumero, setDocNumero] = useState('');
  const [docFecha, setDocFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState('');
  const [actualizarCostoEmpaque, setActualizarCostoEmpaque] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [extraccionBanner, setExtraccionBanner] = useState<{
    metodo: string;
    proveedor?: string;
    total?: number;
  } | null>(null);

  // Catálogo de bodega de inventario
  const [catalogo, setCatalogo] = useState<Array<{ id: string; nombre: string; unidad: string; stock: number }>>([]);
  const [selectedNuevoId, setSelectedNuevoId] = useState('');

  // Facturas de compra locales (SII RCV Local)
  const [facturasLocales, setFacturasLocales] = useState<FacturaCompraLocal[]>([]);
  const [loadingFacturasLocales, setLoadingFacturasLocales] = useState(false);
  const [selectedFacturaLocalId, setSelectedFacturaLocalId] = useState('');

  // Formatos disponibles
  const availableFormats = taxonomies?.formats ?? [];

  // Al abrir el modal, inicializar estado
  useEffect(() => {
    if (!open || !proveedor) return;

    setModo('manual');
    setDocNumero('');
    setDocTipo('guia');
    setDocFecha(new Date().toISOString().slice(0, 10));
    setNotas('');
    setActualizarCostoEmpaque(true);
    setExtraccionBanner(null);

    // Precargar líneas desde insumos enlazados al proveedor si existen
    if (proveedor.insumos_detalle && proveedor.insumos_detalle.length > 0) {
      setLineas(
        proveedor.insumos_detalle.map((it) => {
          const matchedFormat = availableFormats.find((f) =>
            it.nombre.toLowerCase().includes(f.value.toLowerCase()) ||
            it.nombre.toLowerCase().includes(f.label.toLowerCase())
          );

          return {
            id: `line-${it.id}-${Math.random().toString(36).substring(2, 6)}`,
            item_id: it.id,
            nombre: it.nombre,
            unidad: it.unidad,
            stock_actual: it.stock,
            cantidad: 0,
            costo_unitario: 0,
            formato_asignado: matchedFormat ? matchedFormat.value : '',
          };
        })
      );
    } else {
      setLineas([]);
    }

    // Cargar catálogo de bodega
    async function loadCatalogo() {
      try {
        const res = await apiFetch('/api/inventario/items');
        if (res.ok) {
          const json = await res.json();
          const items = (json.data ?? []) as Array<{ id: string; nombre: string; unidad: string; stock: number }>;
          setCatalogo(items);
        }
      } catch {
        /* fallback silencioso */
      }
    }
    void loadCatalogo();
  }, [open, proveedor, apiFetch, availableFormats]);

  // Cargar facturas de compra locales al entrar en modo 'sii'
  useEffect(() => {
    if (modo !== 'sii' || !open) return;

    async function loadFacturas() {
      setLoadingFacturasLocales(true);
      try {
        const res = await apiFetch('/api/sii/facturas-compra');
        if (res.ok) {
          const json = await res.json();
          setFacturasLocales((json.data ?? []) as FacturaCompraLocal[]);
        }
      } catch {
        toast.error('No fue posible cargar las facturas de compra registradas');
      } finally {
        setLoadingFacturasLocales(false);
      }
    }
    void loadFacturas();
  }, [modo, open, apiFetch]);

  // Selección de factura local
  const handleSelectFacturaLocal = (facturaId: string) => {
    setSelectedFacturaLocalId(facturaId);
    const fact = facturasLocales.find((f) => f.id === facturaId);
    if (!fact) return;

    setDocTipo('factura');
    if (fact.folio) setDocNumero(String(fact.folio));
    if (fact.fecha_emision) setDocFecha(fact.fecha_emision.slice(0, 10));
    if (fact.descripcion) {
      setNotas((prev) => (prev ? `${prev} - ${fact.descripcion}` : fact.descripcion || ''));
    }

    toast.success(`Datos de factura folio #${fact.folio} cargados. Define las líneas a ingresar.`);
  };

  // Subir y desmenuzar factura mediante XML DTE o IA
  const handleUploadFactura = async (file: File) => {
    setUploading(true);
    setExtraccionBanner(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/api/logistica/desmenuzar-factura', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Error procesando archivo' }));
        throw new Error(err.message || 'No fue posible desmenuzar la factura');
      }

      const json = await res.json();
      const extracted = json.data as {
        proveedor_nombre: string;
        proveedor_rut?: string | null;
        folio?: string | null;
        fecha?: string | null;
        monto_neto?: number | null;
        monto_total?: number | null;
        lineas: Array<{
          nombre: string;
          cantidad: number;
          precio_unitario: number;
          total: number;
        }>;
        metodo_extraccion: 'xml_dte' | 'ia_groq' | 'heuristica';
      };

      setDocTipo('factura');
      if (extracted.folio) setDocNumero(extracted.folio);
      if (extracted.fecha) setDocFecha(extracted.fecha.slice(0, 10));

      const metodoLabels: Record<string, string> = {
        xml_dte: 'DTE XML Oficial SII (100% exacto)',
        ia_groq: 'Extracción Inteligente con IA',
        heuristica: 'Lectura de Documento',
      };

      setExtraccionBanner({
        metodo: metodoLabels[extracted.metodo_extraccion] || extracted.metodo_extraccion,
        proveedor: extracted.proveedor_nombre,
        total: extracted.monto_total ?? undefined,
      });

      // Transformar líneas extraídas a LineaDraftRecepcion
      if (extracted.lineas && extracted.lineas.length > 0) {
        const nuevasLineas: LineaDraftRecepcion[] = extracted.lineas.map((l, idx) => {
          const cleanName = l.nombre.toLowerCase();

          // 1. Intentar match con bodega
          const matchedItem = catalogo.find((c) =>
            cleanName.includes(c.nombre.toLowerCase()) ||
            c.nombre.toLowerCase().includes(cleanName)
          );

          // 2. Intentar match con formato
          const matchedFormat = availableFormats.find((f) =>
            cleanName.includes(f.value.toLowerCase()) ||
            cleanName.includes(f.label.toLowerCase())
          );

          return {
            id: `extracted-${idx}-${Date.now()}`,
            item_id: matchedItem ? matchedItem.id : '',
            nombre: l.nombre,
            unidad: matchedItem ? matchedItem.unidad : 'unidad',
            stock_actual: matchedItem ? matchedItem.stock : 0,
            cantidad: l.cantidad || 1,
            costo_unitario: l.precio_unitario || 0,
            formato_asignado: matchedFormat ? matchedFormat.value : '',
          };
        });

        setLineas(nuevasLineas);
      }

      toast.success('Factura desmenuzada con éxito. Revisa y confirma el borrador.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al desmenuzar la factura';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Manejo de cambios en líneas
  const handleUpdateLinea = (id: string, updates: Partial<LineaDraftRecepcion>) => {
    setLineas((prev) =>
      prev.map((linea) => {
        if (linea.id !== id) return linea;

        // Si se cambia item_id de bodega, actualizar unidad y stock_actual
        if (updates.item_id !== undefined && updates.item_id !== linea.item_id) {
          const matched = catalogo.find((c) => c.id === updates.item_id);
          return {
            ...linea,
            ...updates,
            unidad: matched ? matched.unidad : linea.unidad,
            stock_actual: matched ? matched.stock : 0,
          };
        }

        return { ...linea, ...updates };
      })
    );
  };

  const handleRemoveLinea = (id: string) => {
    setLineas((prev) => prev.filter((l) => l.id !== id));
  };

  const handleAddLineaManual = () => {
    const defaultItem = catalogo[0];
    const newLinea: LineaDraftRecepcion = {
      id: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      item_id: defaultItem ? defaultItem.id : '',
      nombre: defaultItem ? defaultItem.nombre : 'Nuevo insumo o empaque',
      unidad: defaultItem ? defaultItem.unidad : 'unidad',
      stock_actual: defaultItem ? defaultItem.stock : 0,
      cantidad: 1,
      costo_unitario: 0,
      formato_asignado: '',
    };
    setLineas((prev) => [...prev, newLinea]);
  };

  const handleAddFromCatalogo = () => {
    if (!selectedNuevoId) return;
    const item = catalogo.find((c) => c.id === selectedNuevoId);
    if (!item) return;

    // Detectar formato probable
    const clean = item.nombre.toLowerCase();
    const matchedFormat = availableFormats.find((f) =>
      clean.includes(f.value.toLowerCase()) || clean.includes(f.label.toLowerCase())
    );

    setLineas((prev) => [
      ...prev,
      {
        id: `cat-${item.id}-${Date.now()}`,
        item_id: item.id,
        nombre: item.nombre,
        unidad: item.unidad,
        stock_actual: item.stock,
        cantidad: 1,
        costo_unitario: 0,
        formato_asignado: matchedFormat ? matchedFormat.value : '',
      },
    ]);
    setSelectedNuevoId('');
  };

  // Cálculo dinámico de empaque por formato
  const resumenPorFormato = useMemo(() => {
    const mapa = new Map<string, { totalCosto: number; componentes: Array<{ nombre: string; costo: number }> }>();

    for (const l of lineas) {
      if (l.formato_asignado && l.costo_unitario > 0) {
        const fmt = l.formato_asignado;
        const current = mapa.get(fmt) || { totalCosto: 0, componentes: [] };
        current.totalCosto += l.costo_unitario;
        current.componentes.push({ nombre: l.nombre, costo: l.costo_unitario });
        mapa.set(fmt, current);
      }
    }

    return Array.from(mapa.entries()).map(([formato, info]) => ({
      formato,
      totalCosto: info.totalCosto,
      componentes: info.componentes,
    }));
  }, [lineas]);

  // Métricas totales
  const totalUnidades = lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0), 0);
  const totalValorNeto = lineas.reduce((acc, l) => acc + (Number(l.cantidad) || 0) * (Number(l.costo_unitario) || 0), 0);

  // Envío final
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedor) return;

    // Validar que haya al menos una línea con cantidad > 0
    const lineasConCantidad = lineas.filter((l) => Number(l.cantidad) > 0);
    if (lineasConCantidad.length === 0) {
      toast.error('Ingresa una cantidad mayor a 0 en al menos un insumo');
      return;
    }

    // Validar que las líneas que tienen cantidad tengan item_id asignado a bodega
    const lineasSinItem = lineasConCantidad.filter((l) => !l.item_id);
    if (lineasSinItem.length > 0) {
      toast.error(
        `Vincula el ítem de bodega para: "${lineasSinItem[0].nombre}". El stock debe asignarse a un registro de bodega.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: lineasConCantidad.map((l) => ({
          item_id: l.item_id,
          cantidad: Number(l.cantidad),
          costo_unitario: Number(l.costo_unitario) || 0,
          formato_asignado: l.formato_asignado || undefined,
        })),
        doc_tipo: docTipo,
        doc_numero: docNumero.trim() || undefined,
        doc_fecha: docFecha,
        notas: notas.trim() || undefined,
        actualizar_costo_empaque: actualizarCostoEmpaque && resumenPorFormato.length > 0,
      };

      const res = await apiFetch(`/api/logistica/proveedores/${proveedor.id}/recepcion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({ message: 'Error en la recepción' }));
        throw new Error(errJson.message || 'Error al procesar la recepción');
      }

      const resJson = await res.json();
      const recetasUpdated = resJson?.data?.recetas_actualizadas?.length ?? 0;

      if (recetasUpdated > 0) {
        toast.success(`Insumos ingresados a bodega. Se actualizaron ${recetasUpdated} formato(s) en Costeo.`);
      } else {
        toast.success('Insumos recepcionados e ingresados al inventario de bodega');
      }

      await onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo registrar la recepción';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!proveedor) return null;

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      size="xl"
      eyebrow="Abastecimiento Centralizado"
      title={`Recepción de Insumos: ${proveedor.name}`}
      titleId="recepcion-modal-title"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted-foreground">
            {totalUnidades > 0 && (
              <span>
                Total: <strong className="text-foreground">{totalUnidades} u.</strong>
                {totalValorNeto > 0 && (
                  <> · Valor Neto: <strong className="text-foreground">{formatCLP(totalValorNeto)}</strong></>
                )}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-border hover:border-accent/50 text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || totalUnidades <= 0}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Registrando Ingreso...
                </>
              ) : (
                <>
                  <PackageCheck size={14} /> Confirmar Ingreso a Bodega
                </>
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5 py-1">
        {/* Selector de Modos de Entrada */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 rounded-xl bg-surface-sunken border border-border">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setModo('manual')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                modo === 'manual'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <PackageCheck size={13} /> Entrada Manual
            </button>
            <button
              type="button"
              onClick={() => setModo('sii')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                modo === 'sii'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Receipt size={13} /> Desde Factura SII (Local)
            </button>
            <button
              type="button"
              onClick={() => setModo('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                modo === 'upload'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UploadCloud size={13} /> Subir y Procesar Factura
            </button>
          </div>

          <span className="text-[0.7rem] text-muted-foreground pr-2 hidden sm:inline">
            100% editable · Cero fricción
          </span>
        </div>

        {/* Panel Modo 2: Factura SII Local */}
        {modo === 'sii' && (
          <div className="p-3.5 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Receipt size={14} className="text-primary" /> Facturas de Compra Registradas
              </label>
              <span className="text-[0.7rem] text-muted-foreground">
                Origen local (RCV) sin llamados externos
              </span>
            </div>

            {loadingFacturasLocales ? (
              <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Cargando facturas locales...
              </div>
            ) : facturasLocales.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {facturasLocales.map((f) => {
                  const isSelected = selectedFacturaLocalId === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => handleSelectFacturaLocal(f.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-surface-sunken hover:border-accent/50 text-muted-foreground'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          <span>Folio #{f.folio}</span>
                          <span className="text-[0.7rem] font-normal text-muted-foreground">
                            ({f.fecha_emision ? f.fecha_emision.slice(0, 10) : 'Sin fecha'})
                          </span>
                        </div>
                        <div className="text-[0.7rem] truncate text-muted-foreground">
                          {f.receptor_razon_social || f.descripcion || 'Sin descripción'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-foreground">
                          {f.monto_total ? formatCLP(f.monto_total) : '—'}
                        </div>
                        <span className="text-[0.65rem] text-muted-foreground">
                          {isSelected ? '✓ Seleccionada' : 'Seleccionar'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                No hay facturas de compra registradas en el sistema local aún.
              </div>
            )}
          </div>
        )}

        {/* Panel Modo 3: Subir Factura (PDF, XML DTE, Imagen) */}
        {modo === 'upload' && (
          <div className="p-4 rounded-xl border border-dashed border-border bg-card space-y-3 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.pdf,.png,.jpg,.jpeg,.webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUploadFactura(file);
              }}
            />

            <div className="max-w-md mx-auto space-y-2">
              <UploadCloud size={28} className="mx-auto text-primary opacity-80" />
              <div className="text-xs font-semibold text-foreground">
                Carga tu Factura en PDF, XML DTE oficial o Imagen
              </div>
              <p className="text-[0.75rem] text-muted-foreground">
                El sistema desmenuzará automáticamente el emisor, folio, fecha, insumos, cantidades y
                precios unitarios, dejando el borrador pre-llenado para tu confirmación.
              </p>

              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold bg-surface-sunken border border-border hover:border-primary text-foreground inline-flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Desmenuzando documento...
                  </>
                ) : (
                  <>
                    <UploadCloud size={13} /> Seleccionar archivo
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Banner de Extracción Exitosa */}
        {extraccionBanner && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3">
            <CheckCircle2 size={16} className="text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-foreground space-y-0.5">
              <div className="font-semibold">
                Factura desmenuzada vía {extraccionBanner.metodo}
              </div>
              <div className="text-[0.75rem] text-muted-foreground">
                {extraccionBanner.proveedor && <span>Emisor: {extraccionBanner.proveedor}. </span>}
                {extraccionBanner.total && <span>Total: {formatCLP(extraccionBanner.total)}. </span>}
                Revisa cada línea, confirma las cantidades e ítems de bodega antes de autorizar el ingreso.
              </div>
            </div>
          </div>
        )}

        {/* Tabla / Lista de Líneas Borrador (100% editable) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={13} /> Líneas de Insumos y Empaques ({lineas.length})
            </label>
            <button
              type="button"
              onClick={handleAddLineaManual}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <Plus size={12} /> Añadir fila vacía
            </button>
          </div>

          {lineas.length > 0 ? (
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {lineas.map((linea) => {
                const subtotal = (linea.cantidad || 0) * (linea.costo_unitario || 0);

                return (
                  <div
                    key={linea.id}
                    className="p-3 rounded-xl bg-card border border-border space-y-3 shadow-2xs hover:border-accent/50 transition-colors"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      {/* Nombre / Descripción */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="text-[0.65rem] text-muted-foreground block font-medium">
                          Descripción de Insumo / Factura
                        </label>
                        <input
                          type="text"
                          value={linea.nombre}
                          onChange={(e) => handleUpdateLinea(linea.id, { nombre: e.target.value })}
                          placeholder="Ej: Frasco Vidrio 500g, Tapa Dorada..."
                          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Ítem de Bodega (inventario_items) */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="text-[0.65rem] text-muted-foreground block font-medium">
                          Registro en Bodega *
                        </label>
                        <select
                          value={linea.item_id}
                          onChange={(e) => handleUpdateLinea(linea.id, { item_id: e.target.value })}
                          className={`w-full px-2.5 py-1.5 text-xs rounded-md border text-foreground focus:outline-none focus:ring-1 focus:ring-primary ${
                            linea.item_id
                              ? 'bg-surface-sunken border-border'
                              : 'bg-destructive/10 border-destructive/40 text-destructive'
                          }`}
                        >
                          <option value="">-- Vincular a Bodega --</option>
                          {catalogo.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.stock} {c.unidad})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cantidad */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[0.65rem] text-muted-foreground block font-medium">
                          Cantidad
                        </label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={linea.cantidad || ''}
                            onChange={(e) =>
                              handleUpdateLinea(linea.id, { cantidad: Number(e.target.value) })
                            }
                            className="w-full px-2 py-1.5 text-xs text-right font-semibold rounded-md bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                          <span className="text-[0.65rem] text-muted-foreground shrink-0 w-5">
                            {linea.unidad ? linea.unidad.slice(0, 3) : 'u.'}
                          </span>
                        </div>
                      </div>

                      {/* Costo Unitario */}
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[0.65rem] text-muted-foreground block font-medium">
                          Costo Unit. CLP
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={linea.costo_unitario || ''}
                          placeholder="$0"
                          onChange={(e) =>
                            handleUpdateLinea(linea.id, { costo_unitario: Number(e.target.value) })
                          }
                          className="w-full px-2 py-1.5 text-xs text-right font-semibold rounded-md bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      {/* Botón Borrar */}
                      <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handleRemoveLinea(linea.id)}
                          title="Eliminar línea"
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Sub-fila: Vinculación con Formato para Costeo y Subtotal */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-[0.7rem] text-muted-foreground">Formato de tienda:</span>
                        <select
                          value={linea.formato_asignado}
                          onChange={(e) =>
                            handleUpdateLinea(linea.id, { formato_asignado: e.target.value })
                          }
                          className="px-2 py-1 text-[0.75rem] rounded-md bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Sin formato (Insumo general)</option>
                          {availableFormats.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label} ({f.value})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="text-[0.75rem] text-muted-foreground">
                        Subtotal línea: <strong className="text-foreground">{formatCLP(subtotal)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 rounded-xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-2">
              <AlertCircle size={24} className="mx-auto opacity-40 text-amber-500" />
              <p>No hay líneas de insumos preparadas para esta recepción.</p>
              <button
                type="button"
                onClick={handleAddLineaManual}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-card hover:border-primary text-foreground transition-colors inline-flex items-center gap-1"
              >
                <Plus size={12} /> Agregar primer insumo
              </button>
            </div>
          )}

          {/* Selector rápido desde catálogo de bodega */}
          {catalogo.length > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <select
                value={selectedNuevoId}
                onChange={(e) => setSelectedNuevoId(e.target.value)}
                className="min-w-0 flex-1 px-3 py-2 text-xs rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">+ Añadir otro insumo desde la bodega...</option>
                {catalogo.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} (Stock actual: {c.stock} {c.unidad})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddFromCatalogo}
                disabled={!selectedNuevoId}
                className="px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card text-foreground hover:border-primary disabled:opacity-40 transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus size={13} /> Añadir
              </button>
            </div>
          )}
        </div>

        {/* Sección de Costeo Dinámico de Empaque */}
        {resumenPorFormato.length > 0 && (
          <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator size={14} className="text-primary" />
                <span className="text-xs font-semibold text-foreground">
                  Costeo Dinámico de Empaque por Formato
                </span>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer font-medium">
                <input
                  type="checkbox"
                  checked={actualizarCostoEmpaque}
                  onChange={(e) => setActualizarCostoEmpaque(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Actualizar costo_empaque en recetas
              </label>
            </div>

            <p className="text-[0.72rem] text-muted-foreground">
              Los siguientes costos de empaque se recalcularán automáticamente en las recetas activas
              de Costeo, sincronizando los márgenes reales de la tienda y feria:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {resumenPorFormato.map((rf) => (
                <div
                  key={rf.formato}
                  className="p-2.5 rounded-lg bg-card border border-border text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-semibold text-foreground">Formato {rf.formato}</span>
                    <div className="text-[0.65rem] text-muted-foreground">
                      {rf.componentes.map((c) => `${c.nombre} (${formatCLP(c.costo)})`).join(' + ')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary">{formatCLP(rf.totalCosto)}</div>
                    <span className="text-[0.65rem] text-muted-foreground">por unidad</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sección de Documento de Recepción (Guía / Factura) */}
        <div className="space-y-3 pt-2 border-t border-border">
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={13} /> Documento Tributario o Guía de Respaldo
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label htmlFor="rec-doc-tipo" className="text-xs text-muted-foreground block">
                Tipo de Documento
              </label>
              <select
                id="rec-doc-tipo"
                value={docTipo}
                onChange={(e) => setDocTipo(e.target.value as typeof docTipo)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="factura">Factura de Compra</option>
                <option value="guia">Guía de Despacho</option>
                <option value="boleta">Boleta</option>
                <option value="comprobante">Comprobante de Entrega</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="rec-doc-numero" className="text-xs text-muted-foreground block">
                Folio / Número Oficial
              </label>
              <input
                id="rec-doc-numero"
                type="text"
                placeholder="Ej: 48102, G-9021"
                value={docNumero}
                onChange={(e) => setDocNumero(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="rec-doc-fecha" className="text-xs text-muted-foreground block">
                Fecha del Documento
              </label>
              <input
                id="rec-doc-fecha"
                type="date"
                value={docFecha}
                onChange={(e) => setDocFecha(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label htmlFor="rec-notas" className="text-xs text-muted-foreground block">
              Observaciones de Recepción
            </label>
            <input
              id="rec-notas"
              type="text"
              placeholder="Ej: Recepción conforme en bodega de Ancud, empaque en excelente estado..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-surface-sunken border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </ImmersiveModal>
  );
}
