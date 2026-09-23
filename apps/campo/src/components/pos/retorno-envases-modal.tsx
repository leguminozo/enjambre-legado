'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@enjambre/auth';
import { ImmersiveModal, Button, Input, toast, friendlyError } from '@enjambre/ui';
import { getNucleoApiUrl } from '@/lib/public-urls';
import { RotateCcw, Package, Award, CheckCircle2, User } from 'lucide-react';

interface EnvaseItem {
  id: string;
  nombre: string;
  unidad: string;
  stock: number;
}

interface RetornoEnvasesModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const VALOR_CANJE_POR_DEFECTO = 500; // $500 CLP / frasco devuelto

export function RetornoEnvasesModal({ open, onClose, onSuccess }: RetornoEnvasesModalProps) {
  const token = useAuthStore((s) => s.session?.access_token);
  const API_BASE = getNucleoApiUrl();

  const [envases, setEnvases] = useState<EnvaseItem[]>([]);
  const [selectedEnvaseId, setSelectedEnvaseId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [clienteEmail, setClienteEmail] = useState<string>('');
  const [notas, setNotas] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successData, setSuccessData] = useState<{
    cantidad: number;
    nombre: string;
    puntos: number;
    cliente: boolean;
  } | null>(null);

  // Cargar catálogo de envases retornables desde Núcleo
  useEffect(() => {
    if (!open) {
      setSuccessData(null);
      return;
    }

    async function loadEnvases() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/inventario/envases-retornables`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('No se pudo cargar el catálogo de envases');
        const json = (await res.json()) as { data?: EnvaseItem[] };
        const items = json.data ?? [];
        setEnvases(items);
        if (items.length > 0 && !selectedEnvaseId) {
          setSelectedEnvaseId(items[0].id);
        }
      } catch (err) {
        toast.error(friendlyError(err, 'Error cargando envases'));
      } finally {
        setLoading(false);
      }
    }

    void loadEnvases();
  }, [open, API_BASE, token, selectedEnvaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnvaseId || cantidad <= 0) {
      toast.error('Selecciona un tipo de frasco y una cantidad válida');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/inventario/retorno-envase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          envase_item_id: selectedEnvaseId,
          cantidad,
          cliente_email: clienteEmail.trim() || undefined,
          valor_puntos_unitario: VALOR_CANJE_POR_DEFECTO,
          notas: notas.trim() || undefined,
        }),
      });

      const json = (await res.json()) as {
        data?: {
          cantidad: number;
          nombre: string;
          puntos_acreditados: number;
          cliente_id: string | null;
        };
        message?: string;
      };

      if (!res.ok) {
        throw new Error(json.message || 'Error al procesar el retorno');
      }

      setSuccessData({
        cantidad: json.data?.cantidad ?? cantidad,
        nombre: json.data?.nombre ?? 'Envase',
        puntos: json.data?.puntos_acreditados ?? 0,
        cliente: Boolean(json.data?.cliente_id),
      });

      toast.success('Retorno de vidrio registrado correctamente');
      onSuccess?.();
    } catch (err) {
      toast.error(friendlyError(err, 'No fue posible registrar el retorno'));
    } finally {
      setSubmitting(false);
    }
  };

  const valorTotalRecompensa = cantidad * VALOR_CANJE_POR_DEFECTO;
  const envaseSeleccionado = envases.find((e) => e.id === selectedEnvaseId);

  return (
    <ImmersiveModal
      open={open}
      onClose={onClose}
      eyebrow="Economía Circular · Chiloé"
      title="Retorno de Envases de Vidrio"
      size="md"
    >
      {successData ? (
        <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success mx-auto">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-xl text-foreground">
              ¡{successData.cantidad} {successData.cantidad === 1 ? 'frasco recibido' : 'frascos recibidos'}!
            </h3>
            <p className="text-sm text-muted-foreground">
              El vidrio ha reingresado a la bodega central para higienización y nuevo ciclo de envasado.
            </p>
          </div>

          {successData.cliente && successData.puntos > 0 && (
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 text-xs text-accent-text flex items-center justify-center gap-2">
              <Award size={16} />
              <span>
                Se acreditaron <strong>${successData.puntos.toLocaleString('es-CL')}</strong> a la Bóveda del cliente.
              </span>
            </div>
          )}

          <div className="pt-4">
            <Button
              className="w-full"
              onClick={() => {
                setSuccessData(null);
                setCantidad(1);
                setClienteEmail('');
                onClose();
              }}
            >
              Cerrar y Volver a Feria
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Recepción de frascos limpios en feria. Reingresa el insumo al inventario operativo y acredita saldo en la cuenta del cliente para futuras compras.
          </p>

          {/* Selector de Envase */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de envase
            </label>
            {loading ? (
              <div className="h-10 rounded-lg bg-surface-sunken animate-pulse" />
            ) : envases.length === 0 ? (
              <p className="text-xs text-warning p-2.5 rounded border border-warning/20 bg-warning/5">
                No hay envases configurados en la bodega central.
              </p>
            ) : (
              <select
                value={selectedEnvaseId}
                onChange={(e) => setSelectedEnvaseId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
                required
              >
                {envases.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.nombre} (Stock en bodega: {it.stock})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Contador de unidades */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cantidad devuelta
            </label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-10 text-lg font-bold"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
              >
                -
              </Button>
              <Input
                type="number"
                min="1"
                max="500"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="text-center font-display text-lg font-semibold h-10 w-24"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 w-10 text-lg font-bold"
                onClick={() => setCantidad((c) => c + 1)}
              >
                +
              </Button>
              <div className="text-xs text-muted-foreground ml-2">
                {envaseSeleccionado?.unidad ?? 'unidades'}
              </div>
            </div>
          </div>

          {/* Recompensa estimada */}
          <div className="p-3 rounded-lg bg-surface-sunken border border-border text-xs flex items-center justify-between">
            <span className="text-muted-foreground">Valor de canje ecológico:</span>
            <span className="font-display font-medium text-foreground text-sm">
              ${valorTotalRecompensa.toLocaleString('es-CL')}{' '}
              <span className="text-[10px] text-muted-foreground">(${VALOR_CANJE_POR_DEFECTO} c/u)</span>
            </span>
          </div>

          {/* Identificación opcional del cliente */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User size={13} className="text-accent" />
              Correo del cliente (opcional para abonar saldo)
            </label>
            <Input
              type="email"
              placeholder="cliente@ejemplo.com"
              value={clienteEmail}
              onChange={(e) => setClienteEmail(e.target.value)}
              className="text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Si se ingresa, los ${valorTotalRecompensa.toLocaleString('es-CL')} se acreditarán de inmediato a su Bóveda de Tienda.
            </p>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Detalle u observación (opcional)
            </label>
            <Input
              type="text"
              placeholder="ej. Feria Dalcahue, frascos con tapa original"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || envases.length === 0} className="gap-1.5">
              <RotateCcw size={16} />
              {submitting ? 'Registrando...' : 'Confirmar Retorno'}
            </Button>
          </div>
        </form>
      )}
    </ImmersiveModal>
  );
}
