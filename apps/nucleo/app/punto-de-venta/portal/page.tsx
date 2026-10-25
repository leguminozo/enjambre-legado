'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Printer, QrCode, Sliders, Copy } from 'lucide-react';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button, Card, CardContent, Input, toast, friendlyError, formatCLP, Badge } from '@enjambre/ui';
import { WHOLESALE_PRODUCTS_2025_2026, wholesaleProductsFromRaw, WHOLESALE_INVESTMENT_TIERS } from '@enjambre/pricing';
import type { PortalData, PedidoRow, FidMembresiaRow, RetribucionRow, SetEntradaRow } from '@/lib/microcanales-types';
import { TabletopPrintModal } from '@/components/marketing/TabletopPrintModal';

/**
 * Portal del dueño del local y del revendedor (página standalone, sin shell de
 * dashboard — el middleware la deja pública y esta página exige sesión).
 */
export default function PortalPage() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [codigoClaim, setCodigoClaim] = useState('');
  const [identidad, setIdentidad] = useState('');
  const [monto, setMonto] = useState('');
  const [resenaTexto, setResenaTexto] = useState('');
  const [resenaRating, setResenaRating] = useState(5);
  const [errorAuth, setErrorAuth] = useState(false);
  const [mostrarFichaImprimible, setMostrarFichaImprimible] = useState(false);
  const [expandirGuia, setExpandirGuia] = useState(false);

  const portalQuery = useQuery<{ data: PortalData }>({
    queryKey: ['microcanal', 'portal'],
    queryFn: async () => {
      const res = await apiFetch('/api/b2b/portal');
      if (res.status === 401) {
        setErrorAuth(true);
        throw new Error('unauthorized');
      }
      if (!res.ok) throw new Error('Error al cargar el portal');
      return res.json();
    },
    retry: false,
  });

  // Condiciones oficiales (catálogo y tramos editados en Núcleo); si falla la
  // consulta el portal muestra los valores base del sistema.
  const condicionesQuery = useQuery<{ data: { rules: { productos?: unknown; umbral_despacho_gratis_rm_neto_clp?: number | null } | null; tiers: Array<{ desde_clp: number; hasta_clp: number | null; descuento_pct: number }> } }>({
    queryKey: ['microcanal', 'condiciones'],
    queryFn: async () => {
      const res = await apiFetch('/api/b2b-publico/condiciones-comerciales');
      if (!res.ok) throw new Error('Error al cargar condiciones');
      return res.json();
    },
    retry: false,
  });

  const productos = wholesaleProductsFromRaw(
    condicionesQuery.data?.data?.rules?.productos,
    WHOLESALE_PRODUCTS_2025_2026,
  );
  const umbralDespachoClp =
    condicionesQuery.data?.data?.rules?.umbral_despacho_gratis_rm_neto_clp ?? 900000;
  const tramosInversion = condicionesQuery.data?.data?.tiers?.length
    ? condicionesQuery.data.data.tiers
    : WHOLESALE_INVESTMENT_TIERS.map((t) => ({ desde_clp: t.desdeClp, hasta_clp: t.hastaClp, descuento_pct: t.descuentoPct }));

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['microcanal', 'portal'] });

  const claim = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/b2b/claim', { method: 'POST', body: JSON.stringify({ codigo: codigoClaim }) });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al reclamar');
      }
      return res.json();
    },
    onSuccess: () => { toast('Local vinculado a tu cuenta', { type: 'success' }); invalidate(); },
    onError: (e) => toast(friendlyError(e, 'No se pudo vincular el local'), { type: 'error' }),
  });

  const pedirSet = useMutation({
    mutationFn: async ({ set_id }: { set_id: string }) => {
      const p = portalQuery.data?.data;
      const body = p?.punto ? { punto_venta_id: p.punto.id, set_id } : { revendedor_id: p?.revendedor?.id, set_id };
      const res = await apiFetch('/api/b2b/pedidos', { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al pedir');
      }
      return res.json();
    },
    onSuccess: () => { toast('Pedido creado', { type: 'success' }); invalidate(); },
    onError: (e) => toast(friendlyError(e, 'No se pudo crear el pedido'), { type: 'error' }),
  });

  const registrarCompra = useMutation({
    mutationFn: async () => {
      const p = portalQuery.data?.data;
      const res = await apiFetch('/api/b2b/fidelizacion/eventos', {
        method: 'POST',
        body: JSON.stringify({ punto_venta_id: p?.punto?.id, identidad, monto_clp: Number(monto) }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al registrar la compra');
      }
      return res.json();
    },
    onSuccess: () => { toast('Compra registrada — puntos acreditados', { type: 'success' }); setIdentidad(''); setMonto(''); invalidate(); },
    onError: (e) => toast(friendlyError(e, 'No se pudo registrar la compra'), { type: 'error' }),
  });

  const enviarResena = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/b2b/resenas-revendedor', {
        method: 'POST',
        body: JSON.stringify({ rating: resenaRating, texto: resenaTexto }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al enviar la reseña');
      }
      return res.json();
    },
    onSuccess: () => { toast('Reseña enviada a moderación', { type: 'success' }); setResenaTexto(''); invalidate(); },
    onError: (e) => toast(friendlyError(e, 'No se pudo enviar la reseña'), { type: 'error' }),
  });

  if (errorAuth) {
    return (
      <main className="min-h-[var(--svh-full)] bg-background text-foreground flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="font-display text-2xl">Portal del punto de venta</h1>
          <p className="text-sm text-muted-foreground">Inicia sesión para entrar a tu portal.</p>
          <Button variant="primary" onClick={() => window.location.assign('/login')}>Iniciar sesión</Button>
        </div>
      </main>
    );
  }

  const d = portalQuery.data?.data;

  return (
    <main className="min-h-[var(--svh-full)] bg-background text-foreground">
      <div className="w-full max-w-2xl mx-auto px-4 py-10 space-y-6">
        <header className="space-y-1">
          <p className="text-editorial-xs uppercase tracking-[0.3em] text-primary">Portal</p>
          <h1 className="font-display text-3xl">{d?.punto?.nombre ?? d?.revendedor?.nombre ?? 'Mi espacio'}</h1>
          {d?.punto && <p className="text-sm text-muted-foreground">Código QR del pendón: <span className="font-mono text-primary">{d.punto.codigo_acceso}</span> · {d.punto.estado}</p>}
          {d?.revendedor && <p className="text-sm text-muted-foreground">Código de revendedor: <span className="font-mono text-primary">{d.revendedor.codigo_revendedor}</span> · {d.revendedor.estado}</p>}
        </header>

        {!d?.punto && !d?.revendedor && (
          <Card>
            <CardContent className="p-6 space-y-3">
              <h2 className="font-medium">Reclama tu local o tu perfil de revendedor</h2>
              <p className="text-sm text-muted-foreground">
                Ingresa el código que recibiste al registrarte (o el que te entregó la marca). El código es una vía más — también puedes registrarte desde la landing de cualquier local.
              </p>
              <Input label="Código de acceso" value={codigoClaim} onChange={(e) => setCodigoClaim(e.target.value)} placeholder="EJ: ABC123" />
              <Button variant="primary" disabled={!codigoClaim || claim.isPending} onClick={() => claim.mutate()}>
                {claim.isPending ? 'Vinculando…' : 'Reclamar'}
              </Button>
            </CardContent>
          </Card>
        )}

        {d?.punto && (
          <>
            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-medium">Catálogo de Sets de Activación</h2>
                <div className="space-y-4">
                  {d.sets.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay sets para tu tipo de local.</p>}
                  {d.sets.map((s) => (
                    <SetCard key={s.id} s={s as SetEntradaRow} onPedir={() => pedirSet.mutate({ set_id: s.id })} isPending={pedirSet.isPending} />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-base text-foreground">Herramientas de Sala, Mesa & Material Físico</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Recursos de activación para tus mesas, vitrinas y servicio al comensal.
                    </p>
                  </div>
                  <Badge variant="default">Material Oficial</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="rounded-xl border border-border/70 bg-surface-raised p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-primary font-medium text-sm">
                        <Printer size={16} />
                        <span>Lámina Imprimible A6</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Ficha maquetada para soporte de mesa o acrílico (105 × 148 mm) con el código QR exclusivo de {d?.punto?.nombre ?? 'tu local'}.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setMostrarFichaImprimible(true)}
                      className="w-full text-xs flex items-center justify-center gap-1.5"
                    >
                      <Printer size={13} />
                      Ver e Imprimir Lámina A6
                    </Button>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-surface-raised p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-primary font-medium text-sm">
                        <QrCode size={16} />
                        <span>Enlace Directo de Mesa</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Dirección para calificar la cata y acreditar sellos de bienvenida a los clientes de tu local.
                      </p>
                      <p className="text-[11px] font-mono text-primary truncate pt-1">
                        tienda.obrerayzangano.cl/cata/{d?.punto?.codigo_acceso ?? ''}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (d?.punto?.codigo_acceso) {
                          void navigator.clipboard.writeText(`https://tienda.obrerayzangano.cl/cata/${d.punto.codigo_acceso}`);
                          toast('Enlace de cata copiado al portapapeles', { type: 'success' });
                        }
                      }}
                      className="w-full text-xs flex items-center justify-center gap-1.5"
                    >
                      <Copy size={13} />
                      Copiar Enlace de Mesa
                    </Button>
                  </div>
                </div>

                {/* Guía Operativa de Sala y Estándar Térmico */}
                <div className="rounded-xl border border-border/60 bg-surface-sunken/40 p-3 text-xs space-y-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between text-left cursor-pointer"
                    onClick={() => setExpandirGuia(!expandirGuia)}
                  >
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <Sliders size={14} className="text-primary" />
                      Estándar de Servicio en Sala & Cuidado Térmico
                    </span>
                    <span className="text-xs text-primary font-mono">{expandirGuia ? '− Ocultar' : '+ Ver pautas'}</span>
                  </button>

                  {expandirGuia && (
                    <div className="pt-2 border-t border-border/40 space-y-2 text-muted-foreground leading-relaxed animate-in fade-in">
                      <p>
                        <strong className="text-foreground">1. Vertido bajo 40°C en barra:</strong> La miel cruda contiene la enzima invertasa viva. Al maridar con café de especialidad o infusiones, incorpórala siempre cuando la bebida esté tibia o al servir, nunca en hervor.
                      </p>
                      <p>
                        <strong className="text-foreground">2. Almacenamiento idóneo:</strong> Conservar los frascos cerrados entre 15°C y 25°C en un lugar seco. Mantener alejado del molino de café y especias para preservar intactas las notas florales del bosque.
                      </p>
                      <p>
                        <strong className="text-foreground">3. Fidelización del comensal:</strong> Cada comensal que escanea el QR de tu mesa o vitrina recibe automáticamente 1 sello de bienvenida y +25 puntos en el Club Legado de tu local.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-medium">Registrar compra de un cliente</h2>
                <p className="text-sm text-muted-foreground">Email, WhatsApp o código de la tarjeta QR del cliente.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input label="Identidad del cliente" value={identidad} onChange={(e) => setIdentidad(e.target.value)} placeholder="email, +56 9… o tarjeta" />
                  <Input label="Monto (CLP)" type="number" min="0" value={monto} onChange={(e) => setMonto(e.target.value)} placeholder="3000" />
                </div>
                <Button variant="primary" disabled={!identidad || !monto || registrarCompra.isPending} onClick={() => registrarCompra.mutate()}>
                  {registrarCompra.isPending ? 'Registrando…' : 'Registrar compra'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-medium">Clientes de mi local ({d.membresias.length})</h2>
                <div className="space-y-2">
                  {d.membresias.slice(0, 15).map((m: FidMembresiaRow) => (
                    <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate text-foreground">{m.cliente?.nombre ?? 'Cliente'}</p>
                        <p className="text-xs text-muted-foreground font-mono">{m.cliente?.codigo_cliente ?? ''}</p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Badge variant="default">{m.saldo_sellos} sellos</Badge>
                        <Badge variant="warning">{m.saldo_puntos} pts</Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <PedidosList pedidos={d.pedidos} />
              </CardContent>
            </Card>
          </>
        )}

        {d?.revendedor && (
          <>
            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-medium">Mi retribución</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-surface-sunken/50 border border-border/60 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Crédito acumulado</p>
                    <p className="text-2xl font-semibold text-foreground">{d.credito_disponible.toLocaleString('es-CL')} pts</p>
                    <p className="text-xs text-muted-foreground">Se descuenta automáticamente en tu próximo pedido.</p>
                  </div>
                  <div className="rounded-xl bg-surface-sunken/50 border border-border/60 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Compras 12 meses (móvil)</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCLP(d.tiers.find((t) => t.progreso_clp >= t.umbral_anual_clp)?.compras_12m_clp ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      Nivel: {d.tiers.filter((t) => t.progreso_clp >= t.umbral_anual_clp).at(-1)?.nombre ?? 'Bronce'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  {d.tiers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <span className={t.progreso_clp >= t.umbral_anual_clp ? 'text-success font-medium' : 'text-muted-foreground'}>{t.nombre}</span>
                      <span className="text-xs text-muted-foreground">
                        {t.progreso_clp >= t.umbral_anual_clp ? 'Logrado' : `faltan ${formatCLP(t.umbral_anual_clp - t.progreso_clp)}`} — {t.beneficio}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-medium">Catálogo de Sets de Activación</h2>
                <div className="space-y-4">
                  {d.sets.map((s) => (
                    <SetCard key={s.id} s={s as SetEntradaRow} onPedir={() => pedirSet.mutate({ set_id: s.id })} isPending={pedirSet.isPending} />
                  ))}
                </div>
                <PedidosList pedidos={d.pedidos} />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-medium text-base text-foreground">Herramientas de Venta & Difusión</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Enlace personalizado de catálogo para compartir con clientes y negocios.
                    </p>
                  </div>
                  <Badge variant="default">Embajador</Badge>
                </div>
                <div className="rounded-xl border border-border/70 bg-surface-raised p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Tu enlace de recomendación con código integrado:</p>
                    <p className="font-mono text-sm text-primary font-bold truncate pt-0.5">
                      tienda.obrerayzangano.cl?ref={d?.revendedor?.codigo_revendedor ?? ''}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (d?.revendedor?.codigo_revendedor) {
                        void navigator.clipboard.writeText(`https://tienda.obrerayzangano.cl?ref=${d.revendedor.codigo_revendedor}`);
                        toast('Enlace copiado al portapapeles', { type: 'success' });
                      }
                    }}
                    className="text-xs shrink-0 flex items-center gap-1.5"
                  >
                    <Copy size={13} />
                    Copiar enlace
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-medium text-base">Tarifario y Condiciones B2B 2025-2026</h2>
                  <Badge variant="default">Revendedor Autorizado</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Precios netos vigentes para tu canal, escala de descuentos por inversión y compromisos de conservación.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="py-2 pr-2 font-medium">Producto</th>
                        <th className="py-2 px-2 font-medium">PVP Sugerido</th>
                        <th className="py-2 px-2 font-medium text-primary">Precio Neto</th>
                        <th className="py-2 pl-2 font-medium text-right">Mínimo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {productos.map((p) => (
                        <tr key={p.id}>
                          <td className="py-2 pr-2 font-medium text-foreground">{p.nombre} ({p.formato})</td>
                          <td className="py-2 px-2 font-mono text-muted-foreground">{formatCLP(p.pvpRecomendadoClp)}</td>
                          <td className="py-2 px-2 font-mono text-primary font-bold">{formatCLP(p.precioNetoBaseClp)}</td>
                          <td className="py-2 pl-2 font-mono text-right text-muted-foreground">{p.minimoCompraUnidades} uds</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="rounded-xl bg-surface-sunken/60 p-3 text-xs space-y-1 border border-border/50">
                  <p className="font-medium text-foreground">Escala de Descuentos por Inversión:</p>
                  <p className="text-muted-foreground">
                    • {tramosInversion.map((t) => {
                      const pct = Math.round(t.descuento_pct * 100);
                      if (t.desde_clp === 0) return `< $${(t.hasta_clp ?? 0).toLocaleString('es-CL')} netos: ${pct}%`;
                      if (t.hasta_clp == null) return `≥ $${t.desde_clp.toLocaleString('es-CL')} netos: ${pct}%`;
                      return `$${t.desde_clp.toLocaleString('es-CL')}–$${t.hasta_clp.toLocaleString('es-CL')} netos: ${pct}%`;
                    }).join(' · ')}
                  </p>
                  <p className="text-muted-foreground">
                    • Despacho gratuito en Región Metropolitana desde {formatCLP(umbralDespachoClp)} netos.
                  </p>
                  <p className="text-muted-foreground">
                    • Almacenamiento: 15–25 °C, lugar seco, sin sol directo ni olores.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-3">
                <h2 className="font-medium">Tu experiencia vendiendo la marca</h2>
                <p className="text-sm text-muted-foreground">Tu reseña se muestra a otros revendedores (moderada).</p>
                <Input label="Nota (1–5)" type="number" min={1} max={5} value={resenaRating} onChange={(e) => setResenaRating(Number(e.target.value))} />
                <textarea value={resenaTexto} onChange={(e) => setResenaTexto(e.target.value)} rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  placeholder="Cómo ha sido vender nuestra miel…" />
                <Button variant="primary" disabled={!resenaTexto || enviarResena.isPending} onClick={() => enviarResena.mutate()}>
                  {enviarResena.isPending ? 'Enviando…' : 'Compartir experiencia'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-2">
                <h2 className="font-medium">Experiencias de otros revendedores</h2>
                {d.resenas_revendedor.filter((r) => r.estado === 'aprobada').map((r) => (
                  <div key={r.id} className="rounded-xl border border-border/50 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">{r.revendedor?.nombre ?? 'Revendedor'} · {'★'.repeat(r.rating)}</p>
                    <p className="text-foreground/90 mt-1">{r.texto}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        )}

        {portalQuery.isLoading && <p className="text-center text-muted-foreground py-10">Cargando…</p>}

        {d?.punto && (
          <TabletopPrintModal
            isOpen={mostrarFichaImprimible}
            onClose={() => setMostrarFichaImprimible(false)}
            partnerName={d.punto.nombre}
            partnerCode={d.punto.codigo_acceso}
            defaultSegment={
              d.punto.tipo === 'hotel'
                ? 'hoteles'
                : d.punto.tipo === 'tienda_gourmet'
                  ? 'tiendas-gourmet'
                  : 'cafeterias'
            }
          />
        )}
      </div>
    </main>
  );
}

function PedidosList({ pedidos }: { pedidos: PedidoRow[] }) {
  if (pedidos.length === 0) return <p className="text-sm text-muted-foreground pt-2">Aún no hay pedidos.</p>;
  return (
    <div className="space-y-2 pt-2">
      <h3 className="text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Mis pedidos</h3>
      {pedidos.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 px-3 py-2 text-sm">
          <div className="min-w-0">
            <p className="truncate text-foreground">{p.set?.nombre ?? 'Set'}</p>
            <p className="text-xs text-muted-foreground">{p.fecha}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{formatCLP(p.monto_clp)}</span>
            <Badge variant={p.estado === 'entregado' ? 'success' : p.estado === 'cancelado' ? 'danger' : 'default'}>{p.estado}</Badge>
          </div>
        </div>
      ))}
    </div>
  );
}

function SetCard({ s, onPedir, isPending }: { s: SetEntradaRow, onPedir: () => void, isPending: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface-raised overflow-hidden">
      <div className="p-4 border-b border-border/50">
        <h3 className="text-base font-medium text-foreground">{s.nombre}</h3>
        {s.descripcion && <p className="text-xs text-muted-foreground mt-1">{s.descripcion}</p>}
      </div>
      
      <div className="p-4 bg-background/50 space-y-2">
        {s.items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-xs">
            <span className="text-foreground">
              {item.cantidad}x {item.productos?.nombre ?? 'Producto'} 
              {item.es_degustacion && <Badge variant="warning" className="ml-2 scale-75 origin-left">Degustación</Badge>}
            </span>
            <span className={item.es_degustacion ? 'text-success font-medium' : 'text-muted-foreground'}>
              {item.es_degustacion ? 'GRATIS' : 'Incluido'}
            </span>
          </div>
        ))}
        
        {s.incluye_materiales && (
          <div className="flex items-center justify-between text-xs pt-2 border-t border-border/30">
            <span className="text-foreground">Materiales: {s.materiales_descripcion || 'Display QR y palitos compostables'}</span>
            <span className="text-success font-medium">GRATIS</span>
          </div>
        )}
        
        {s.pack_digital && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground">Pack Digital RRSS</span>
            <span className="text-success font-medium">GRATIS</span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground">Envío nacional</span>
          <span className="text-success font-medium">INCLUIDO</span>
        </div>
      </div>
      
      <div className="p-4 bg-surface-sunken flex items-center justify-between">
        <div className="font-mono text-lg font-bold text-primary">{formatCLP(s.precio_clp)}</div>
        <Button variant="primary" size="sm" onClick={onPedir} disabled={isPending}>Añadir al local</Button>
      </div>
    </div>
  )
}
