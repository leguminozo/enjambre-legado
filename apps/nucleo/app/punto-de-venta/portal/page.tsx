'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button, Card, CardContent, Input, toast, formatCLP, Badge } from '@enjambre/ui';
import type { PortalData, PedidoRow, FidMembresiaRow, RetribucionRow } from '@/lib/microcanales-types';

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
    onError: (e) => toast(e.message, { type: 'error' }),
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
    onError: (e) => toast(e.message, { type: 'error' }),
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
    onError: (e) => toast(e.message, { type: 'error' }),
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
    onError: (e) => toast(e.message, { type: 'error' }),
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
                <h2 className="font-medium">Catálogo de sets</h2>
                <div className="space-y-2">
                  {d.sets.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay sets para tu tipo de local.</p>}
                  {d.sets.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.nombre}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.descripcion ?? ''} · {formatCLP(s.precio_clp)}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => pedirSet.mutate({ set_id: s.id })} disabled={pedirSet.isPending}>Pedir</Button>
                    </div>
                  ))}
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
                    <p className="text-xs uppercase text-muted-foreground">Crédito lock-in</p>
                    <p className="text-2xl font-semibold text-foreground">{d.credito_disponible.toLocaleString('es-CL')} pts</p>
                    <p className="text-xs text-muted-foreground">Se descuenta solo en tu próximo pedido.</p>
                  </div>
                  <div className="rounded-xl bg-surface-sunken/50 border border-border/60 p-4">
                    <p className="text-xs uppercase text-muted-foreground">Compras 12 meses (móvil)</p>
                    <p className="text-2xl font-semibold text-foreground">{formatCLP(d.tiers.find((t) => t.progreso_clp >= t.umbral_anual_clp)?.compras_12m_clp ?? 0)}</p>
                    <p className="text-xs text-muted-foreground">
                      Tier: {d.tiers.filter((t) => t.progreso_clp >= t.umbral_anual_clp).at(-1)?.nombre ?? 'Bronce'}
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
                <h2 className="font-medium">Pedir al por mayor</h2>
                <div className="space-y-2">
                  {d.sets.map((s) => (
                    <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.nombre}</p>
                        <p className="text-xs text-muted-foreground">{formatCLP(s.precio_clp)}</p>
                      </div>
                      <Button variant="outline" size="sm" disabled={pedirSet.isPending}
                        onClick={() => pedirSet.mutate({ set_id: s.id })}>Pedir</Button>
                    </div>
                  ))}
                </div>
                <PedidosList pedidos={d.pedidos} />
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
