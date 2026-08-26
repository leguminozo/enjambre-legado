'use client';

import { useState } from 'react';
import {
  CONTACTO_INSTITUCIONAL,
  mailtoPresentacionUrl,
  whatsappPresentacionUrl,
} from '@/lib/contacto-institucional';
import { COMUNAS_CHILOE } from '@/lib/chiloe-comunas';

const fieldClass =
  'w-full min-h-11 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none';

export function ContactoInstitucionalForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      nombre: String(data.get('nombre') ?? ''),
      cargo: String(data.get('cargo') ?? ''),
      institucion: String(data.get('institucion') ?? ''),
      comuna: String(data.get('comuna') ?? ''),
      email: String(data.get('email') ?? ''),
      telefono: String(data.get('telefono') ?? ''),
      mensaje: String(data.get('mensaje') ?? ''),
      sitio_web: String(data.get('sitio_web') ?? ''),
    };

    try {
      const res = await fetch('/api/censo-publico/contacto-institucional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(json?.message ?? 'No se pudo enviar. Usa WhatsApp o el correo.');
      }
      setStatus('ok');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Error de red');
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
      <div className="lg:col-span-5 space-y-4">
        <h2 className="font-serif text-2xl font-bold text-foreground">
          Solicitar presentación técnica
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          30 minutos con DIDECO: mapa, censo, trashumancia declarada y ficha para Compra Ágil.
          El mismo canal sirve si escribe SECPLAC, INDAP o SAG.
        </p>
        <ul className="text-sm text-foreground space-y-2">
          <li>
            Correo:{' '}
            <a className="underline underline-offset-4" href={mailtoPresentacionUrl()}>
              {CONTACTO_INSTITUCIONAL.email}
            </a>
          </li>
          <li>
            WhatsApp:{' '}
            <a
              className="underline underline-offset-4"
              href={whatsappPresentacionUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              {CONTACTO_INSTITUCIONAL.whatsappDisplay}
            </a>
          </li>
        </ul>
        <p className="text-xs text-muted-foreground">
          {CONTACTO_INSTITUCIONAL.proveedor} · proveedor tecnológico de la red. Si el formulario
          falla, el correo y el WhatsApp siguen abiertos.
        </p>
      </div>

      <form onSubmit={onSubmit} className="lg:col-span-7 space-y-3" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Nombre</span>
            <input name="nombre" required minLength={2} className={fieldClass} autoComplete="name" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Cargo</span>
            <input name="cargo" required minLength={2} className={fieldClass} placeholder="DIDECO, Fomento, SECPLAC…" />
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Municipalidad o servicio</span>
            <input
              name="institucion"
              required
              minLength={2}
              className={fieldClass}
              placeholder="Municipalidad de Quemchi"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Comuna (si aplica)</span>
            <select name="comuna" className={fieldClass} defaultValue="">
              <option value="">—</option>
              {COMUNAS_CHILOE.map((c) => (
                <option key={c.slug} value={c.nombre}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Email institucional</span>
            <input name="email" type="email" required className={fieldClass} autoComplete="email" />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted-foreground">Teléfono (opcional)</span>
            <input name="telefono" type="tel" className={fieldClass} autoComplete="tel" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted-foreground">Mensaje (opcional)</span>
          <textarea name="mensaje" rows={4} className={`${fieldClass} min-h-[6.5rem] py-3`} />
        </label>
        <div className="hidden" aria-hidden>
          <label>
            Sitio web
            <input name="sitio_web" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={status === 'sending'}
            className="inline-flex min-h-12 items-center justify-center px-6 bg-primary text-primary-foreground text-sm font-medium rounded-xl hover:opacity-95 disabled:opacity-60"
          >
            {status === 'sending' ? 'Enviando…' : 'Enviar solicitud'}
          </button>
          <a
            href={whatsappPresentacionUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center px-6 border border-border text-sm font-medium rounded-xl hover:bg-surface-sunken"
          >
            Abrir WhatsApp
          </a>
        </div>
        {status === 'ok' && (
          <p className="text-sm text-foreground" role="status">
            Llegó. Te respondemos a ese correo.
          </p>
        )}
        {status === 'error' && error && (
          <p className="text-sm text-destructive" role="alert">
            {error} También puedes escribir a {CONTACTO_INSTITUCIONAL.email}.
          </p>
        )}
      </form>
    </div>
  );
}
