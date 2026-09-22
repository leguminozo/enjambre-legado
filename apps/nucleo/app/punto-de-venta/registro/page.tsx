'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Store, UploadCloud, CheckCircle2, Loader2 } from 'lucide-react';

const TIPOS = [
  { value: 'cafeteria', label: 'Café / Restaurante' },
  { value: 'hotel', label: 'Hotel / Alojamiento' },
  { value: 'tienda_gourmet', label: 'Tienda especializada' },
  { value: 'feria_evento', label: 'Feria / Evento' },
  { value: 'otro', label: 'Otro' },
] as const;

export default function RegistroPuntoVentaPage() {
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'cafeteria',
    ciudad: '',
    contacto_nombre: '',
    contacto_email: '',
    volumen_mensual_clp: '',
    rut_empresa: '',
    acepta_contrato: false,
  });
  const [patente, setPatente] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ codigo: string; tier: string | null } | null>(null);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const res = await fetch('/api/b2b-publico/registro-punto-venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          volumen_mensual_clp: form.volumen_mensual_clp === '' ? null : Number(form.volumen_mensual_clp),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || 'No se pudo registrar');

      if (patente && json.data?.id) {
        const fd = new FormData();
        fd.append('punto_venta_id', json.data.id);
        fd.append('archivo', patente);
        await fetch('/api/b2b-publico/solicitud-patente', { method: 'POST', body: fd }).catch(() => undefined);
      }

      setResultado({ codigo: json.data.codigo_acceso, tier: json.data.tier_sugerido ?? null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar');
    } finally {
      setEnviando(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none';

  if (resultado) {
    return (
      <main className="min-h-[var(--vh-full)] bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 text-center space-y-4">
          <CheckCircle2 size={40} className="mx-auto text-success" />
          <h1 className="font-display text-2xl text-foreground">Solicitud recibida</h1>
          <p className="text-sm text-muted-foreground">
            Tu código de seguimiento es <span className="font-mono font-bold text-foreground">{resultado.codigo}</span>.
            {resultado.tier ? (
              <> Tu tramo sugerido: <strong className="text-foreground">{resultado.tier}</strong>.</>
            ) : null}{' '}
            Te avisaremos por correo al aprobar.
          </p>
          <Link href="/punto-de-venta/portal" className="inline-block text-sm text-primary hover:underline">
            Ir al portal mayorista
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[var(--vh-full)] bg-background px-4 py-12">
      <form onSubmit={(e) => void enviar(e)} className="max-w-xl mx-auto space-y-5 rounded-3xl border border-border bg-card p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Store size={22} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Canal mayorista</p>
            <h1 className="font-display text-2xl text-foreground">Registra tu local</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-xs sm:col-span-2">
            <span className="text-muted-foreground block mb-1">Nombre del local *</span>
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Café Puerto Varas" className={inputClass} />
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground block mb-1">Tipo *</span>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className={inputClass}>
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground block mb-1">Comuna / Ciudad</span>
            <input value={form.ciudad} onChange={(e) => setForm({ ...form, ciudad: e.target.value })} placeholder="Castro" className={inputClass} />
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground block mb-1">Nombre de contacto</span>
            <input value={form.contacto_nombre} onChange={(e) => setForm({ ...form, contacto_nombre: e.target.value })} className={inputClass} />
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground block mb-1">Email de contacto</span>
            <input type="email" value={form.contacto_email} onChange={(e) => setForm({ ...form, contacto_email: e.target.value })} className={inputClass} />
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground block mb-1">Volumen mensual estimado (CLP)</span>
            <input
              type="number" min={0} value={form.volumen_mensual_clp}
              onChange={(e) => setForm({ ...form, volumen_mensual_clp: e.target.value })}
              placeholder="Ej. 800000" className={inputClass}
            />
          </label>
          <label className="block text-xs">
            <span className="text-muted-foreground block mb-1">RUT empresa</span>
            <input value={form.rut_empresa} onChange={(e) => setForm({ ...form, rut_empresa: e.target.value })} placeholder="76.123.456-7" className={inputClass} />
          </label>
        </div>

        <label className="block text-xs">
          <span className="text-muted-foreground mb-1 flex items-center gap-1.5">
            <UploadCloud size={14} /> Patente comercial o RUT (PDF o imagen, máx. 5 MB)
          </span>
          <input
            type="file" accept="application/pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setPatente(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs"
          />
        </label>

        <label className="flex items-start gap-2.5 text-xs text-muted-foreground">
          <input
            type="checkbox" checked={form.acepta_contrato}
            onChange={(e) => setForm({ ...form, acepta_contrato: e.target.checked })}
            className="mt-0.5 h-4 w-4 accent-primary"
          />
          <span>
            Acepto el contrato marco de consignación mercantil (versión 2026-09): stock en consignación,
            devolución de remanentes y conciliación por evento ferial. *
          </span>
        </label>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <button
          type="submit" disabled={enviando}
          className="w-full min-h-12 rounded-full bg-primary px-6 text-xs font-bold uppercase tracking-wider text-primary-foreground disabled:opacity-50 inline-flex items-center justify-center gap-2"
        >
          {enviando && <Loader2 size={14} className="animate-spin" />} Enviar solicitud
        </button>
      </form>
    </main>
  );
}
