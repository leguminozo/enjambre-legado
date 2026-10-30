'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useApiFetch } from '@/hooks/use-api-fetch';
import { Button, Card, CardContent, Input, toast, friendlyError } from '@enjambre/ui';
import { CHILE_COMUNAS_POR_REGION } from '@enjambre/logistica';
import {
  PARES_SEMANTICOS, PUNTO_VENTA_TIPO_LABEL,
  type ChipCatalogoRow, type RegistroClienteValues,
} from '@/lib/microcanales-types';

interface PortalPublico {
  punto: { id: string; nombre: string; tipo: string; ciudad: string | null; codigo_acceso: string }
  sets: { id: string; nombre: string; descripcion: string | null; precio_clp: number; items?: { id: string; cantidad: number; es_degustacion: boolean; productos?: { nombre: string } | null }[] }[]
  programa: { id: string; tipo: string; nombre: string; regla: string; umbral: number; recompensa: string } | null
}

type Paso = 1 | 2 | 3

const BLOQUE_LABEL: Record<string, string> = { sabor: 'Sabor', aroma: 'Aroma', textura: 'Textura', color: 'Color' }

export default function PuntoDeVentaLanding() {
  const params = useParams<{ codigo: string }>();
  const codigo = params.codigo?.toUpperCase() ?? '';
  const apiFetch = useApiFetch();

  const { data: portal, isLoading } = useQuery<{ data: PortalPublico }>({
    queryKey: ['microcanal', 'publico', codigo],
    queryFn: async () => {
      const res = await apiFetch(`/api/b2b-publico/portal/${codigo}`);
      if (!res.ok) throw new Error('Local no encontrado');
      return res.json();
    },
    enabled: Boolean(codigo),
  });

  const [paso, setPaso] = useState<Paso>(1);
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [cliente, setCliente] = useState<{ codigo_cliente: string; nuevo: boolean } | null>(null);
  const [pares, setPares] = useState<Record<string, number>>({});
  const [chips, setChips] = useState<Record<string, boolean>>({});
  const [agrado, setAgrado] = useState(4);
  const [recompra, setRecompra] = useState(true);
  const [palabra, setPalabra] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ puntos: number } | null>(null);

  const chipsActivos = useMemo(() => (portal?.data?.sets ?? []), [portal]);

  // El catálogo de chips lo trae la propia landing de la API pública
  const { data: catalogo } = useQuery<{ data: ChipCatalogoRow[] }>({
    queryKey: ['microcanal', 'chips'],
    queryFn: async () => {
      const res = await apiFetch('/api/b2b-publico/portal/chips');
      if (!res.ok) return { data: [] };
      return res.json();
    },
  });

  const registroCliente = async () => {
    if (!consentimiento) {
      toast('Necesitamos tu consentimiento para registrar tu percepción', { type: 'error' });
      return;
    }
    if (!email && !whatsapp) {
      toast('Deja tu email o tu WhatsApp para acumular puntos', { type: 'error' });
      return;
    }
    setEnviando(true);
    try {
      const body: RegistroClienteValues = {
        codigo_punto: codigo,
        email: email || undefined,
        whatsapp: whatsapp || undefined,
        consentimiento,
      };
      const res = await apiFetch('/api/b2b-publico/clientes', { method: 'POST', body: JSON.stringify(body) });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al registrarte');
      }
      const data = await res.json();
      setCliente({ codigo_cliente: data.data.cliente.codigo_cliente, nuevo: data.data.nuevo });
      setPaso(2);
    } catch (e) {
      toast(friendlyError(e, 'No se pudo completar el registro'), { type: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  const enviarPulso = async () => {
    if (Object.keys(pares).length < PARES_SEMANTICOS.length) {
      toast('Completa los 3 pares de sensación', { type: 'error' });
      return;
    }
    const chipsSel = Object.entries(chips).filter(([, v]) => v).map(([k]) => {
      const [bloque, chip] = k.split(':');
      return { bloque, chip };
    });
    if (chipsSel.filter((c) => c.bloque === 'aroma').length === 0 || chipsSel.filter((c) => c.bloque === 'sabor').length === 0) {
      toast('Marca al menos un aroma y un sabor', { type: 'error' });
      return;
    }
    setEnviando(true);
    try {
      const res = await apiFetch('/api/percepcion/sesiones', {
        method: 'POST',
        body: JSON.stringify({
          codigo_punto: codigo,
          email: email || undefined,
          whatsapp: whatsapp || undefined,
          codigo_cliente: cliente?.codigo_cliente,
          consentimiento: true,
          pares: Object.entries(pares).map(([par, valor]) => ({ par, valor })),
          chips: chipsSel,
          abierta: palabra || undefined,
          agrado,
          intencion_recompra: recompra,
          tipo_evaluador: 'consumidor',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Error al enviar tu pulso');
      }
      const data = await res.json();
      setResultado({ puntos: data.data.puntos_ganados });
      setPaso(3);
    } catch (e) {
      toast(friendlyError(e, 'No se pudo registrar la experiencia'), { type: 'error' });
    } finally {
      setEnviando(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-[var(--svh-full)] flex items-center justify-center text-muted-foreground">Cargando…</div>;
  }
  if (!portal?.data) {
    return <div className="min-h-[var(--svh-full)] flex items-center justify-center text-muted-foreground">Local no encontrado.</div>;
  }
  const p = portal.data;

  return (
    <main className="min-h-[var(--svh-full)] bg-background text-foreground flex flex-col">
      <div className="flex-1 w-full max-w-lg mx-auto px-4 py-10 space-y-6">
        <header className="text-center space-y-2">
          <p className="text-editorial-xs uppercase tracking-[0.3em] text-primary">{PUNTO_VENTA_TIPO_LABEL[p.punto.tipo] ?? p.punto.tipo}{p.punto.ciudad ? ` · ${p.punto.ciudad}` : ''}</p>
          <h1 className="font-display text-3xl text-foreground">{p.punto.nombre}</h1>
          <p className="text-sm text-muted-foreground">Miel de un territorio defendido. Cada compra alimenta puntos y historias compartidas.</p>
        </header>

        {paso === 1 && (
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="font-medium text-foreground">Suma puntos con tu compra</h2>
                <p className="text-sm text-muted-foreground">{p.programa ? `${p.programa.regla} · ${p.programa.recompensa}.` : 'Este local está sumando puntos por cada compra.'}</p>
              </div>
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.cl" />
              <Input label="O WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+56 9 …" />
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} className="mt-0.5 accent-primary" />
                Autorizo registrar mi percepción y contacto para el programa de fidelización de la marca.
              </label>
              <Button variant="primary" className="w-full" disabled={enviando} onClick={registroCliente}>
                {enviando ? 'Registrando…' : 'Continuar'}
              </Button>
              {cliente?.nuevo && (
                <p className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2 break-all">
                  Tu tarjeta QR: <span className="font-mono font-medium">{cliente.codigo_cliente}</span> — guárdala o muéstrala en tu próxima compra.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {paso === 2 && (
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1">
                <h2 className="font-medium text-foreground">Pulso de 20 segundos</h2>
                <p className="text-sm text-muted-foreground">¿Cómo describirías esta miel? Desliza los 3 pares y marca lo que sentiste.</p>
              </div>
              {PARES_SEMANTICOS.map(({ par, izq, der }) => (
                <div key={par} className="space-y-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">{izq} — {der}</p>
                  <input type="range" min={-3} max={3} step={1} value={pares[par] ?? 0}
                    onChange={(e) => setPares((prev) => ({ ...prev, [par]: Number(e.target.value) }))}
                    className="w-full accent-primary" />
                  <p className="text-center text-sm font-medium text-foreground">{pares[par] ?? 0}</p>
                </div>
              ))}
              <div className="space-y-3">
                {(catalogo?.data ?? []).filter((c) => c.activo).map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="w-16 text-xs uppercase text-muted-foreground">{BLOQUE_LABEL[c.bloque]}</span>
                    <button type="button"
                      onClick={() => setChips((prev) => ({ ...prev, [`${c.bloque}:${c.chip}`]: !prev[`${c.bloque}:${c.chip}`] }))}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${chips[`${c.bloque}:${c.chip}`] ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground/80'}`}>
                      {c.chip}
                    </button>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">¿Cuánto te gustó? (1–5)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setAgrado(n)}
                      className={`flex-1 rounded-lg border py-2 text-sm ${agrado === n ? 'bg-primary text-primary-foreground border-primary' : 'border-border'}`}>{n}</button>
                  ))}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={recompra} onChange={(e) => setRecompra(e.target.checked)} className="accent-primary" />
                Volvería a comprar esta miel
              </label>
              <Button variant="primary" className="w-full" disabled={enviando} onClick={enviarPulso}>
                {enviando ? 'Enviando…' : 'Enviar mi pulso'}
              </Button>
            </CardContent>
          </Card>
        )}

        {paso === 3 && (
          <Card>
            <CardContent className="p-8 text-center space-y-3">
              <p className="text-4xl">🍯</p>
              <h2 className="font-display text-2xl text-foreground">Puntos acreditados</h2>
              <p className="text-sm text-muted-foreground">
                {resultado && resultado.puntos > 0
                  ? `Tu pulso sumó ${resultado.puntos} puntos a tu tarjeta. Gracias por nombrar esta miel.`
                  : 'Tu pulso quedó registrado. Gracias por nombrar esta miel.'}
              </p>
              {cliente && (
                <p className="text-xs text-muted-foreground break-all">
                  Tu tarjeta: <span className="font-mono text-primary">{cliente.codigo_cliente}</span>
                </p>
              )}
              <Button variant="outline" className="w-full" onClick={() => { setPaso(1); setResultado(null); }}>Hacer otro pulso</Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3 pt-4 border-t border-border/60">
          <RegistroLocal codigo={codigo} />
          <RegistroRevendedor />
          <p className="text-center text-xs text-muted-foreground">
            ¿Ya tienes este local? <a href="/login?mode=signup" className="text-primary underline">Crea tu cuenta y reclámalo</a> · <a href="/punto-de-venta/portal" className="text-primary underline">Portal</a>
          </p>
        </div>
      </div>
    </main>
  );
}

function RegistroLocal({ codigo }: { codigo: string }) {
  const apiFetch = useApiFetch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', tipo: 'cafeteria', ciudad: '', contacto_nombre: '', contacto_email: '' });
  const [codigoEntregado, setCodigoEntregado] = useState<string | null>(null);

  const registrar = async () => {
    if (!form.nombre) { toast('El nombre del local es obligatorio', { type: 'error' }); return; }
    const res = await apiFetch('/api/b2b-publico/registro-punto-venta', { method: 'POST', body: JSON.stringify(form) });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast(err?.message ?? 'Error', { type: 'error' });
      return;
    }
    const data = await res.json();
    setCodigoEntregado(data.data.codigo_acceso);
    toast('Local registrado', { type: 'success' });
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
      <button type="button" onClick={() => setOpen(!open)} className="text-sm font-medium text-foreground w-full text-left">
        ¿Tienes un local? Regístrate para revender nuestra miel {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="space-y-3">
          {codigoEntregado ? (
            <p className="text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2 break-all">
              ¡Listo! Tu código de acceso: <span className="font-mono font-medium">{codigoEntregado}</span> — guárdalo para reclamar tu local con tu cuenta.
            </p>
          ) : (
            <>
              <Input label="Nombre del local *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input label="Ciudad" list="ciudades-local-list" value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} placeholder="Ej. Santiago, Castro..." />
                  <datalist id="ciudades-local-list">
                    {Object.values(CHILE_COMUNAS_POR_REGION).flat().map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                <Input label="Email" type="email" value={form.contacto_email} onChange={(e) => setForm({ ...form, contacto_email: e.target.value })} />
              </div>
              <Button variant="primary" className="w-full" onClick={registrar}>Registrar mi local</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RegistroRevendedor() {
  const apiFetch = useApiFetch();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ nombre: '', whatsapp: '', tipo_espacio: 'tienda' });
  const [codigoEntregado, setCodigoEntregado] = useState<string | null>(null);

  const registrar = async () => {
    if (!form.nombre) { toast('Tu nombre es obligatorio', { type: 'error' }); return; }
    const res = await apiFetch('/api/b2b-publico/registro-revendedor', { method: 'POST', body: JSON.stringify(form) });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      toast(err?.message ?? 'Error', { type: 'error' });
      return;
    }
    const data = await res.json();
    setCodigoEntregado(data.data.codigo_revendedor);
    toast('Revendedor registrado', { type: 'success' });
  };

  return (
    <div className="rounded-xl border border-border bg-card/40 p-4 space-y-3">
      <button type="button" onClick={() => setOpen(!open)} className="text-sm font-medium text-foreground w-full text-left">
        ¿Quieres revender nuestra miel desde tu espacio? {open ? '▾' : '▸'}
      </button>
      {open && (
        <div className="space-y-3">
          {codigoEntregado ? (
            <p className="text-sm text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2 break-all">
              ¡Listo! Tu código de revendedor: <span className="font-mono font-medium">{codigoEntregado}</span> — al crear tu cuenta podrás comprar al por mayor y recibir retribución.
            </p>
          ) : (
            <>
              <Input label="Tu nombre *" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
                <SelectEntorno value={form.tipo_espacio} onChange={(v) => setForm({ ...form, tipo_espacio: v })} />
              </div>
              <Button variant="primary" className="w-full" onClick={registrar}>Quiero revender</Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function SelectEntorno({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const options = [
    { value: 'tienda', label: 'Tienda' },
    { value: 'fruteria', label: 'Fruteria' },
    { value: 'feria', label: 'Feria' },
    { value: 'espacio_propio', label: 'Espacio propio' },
    { value: 'otro', label: 'Otro' },
  ];
  return (
    <div className="space-y-2">
      <span className="block text-editorial-xs font-medium uppercase tracking-widest text-muted-foreground">Tu espacio</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
