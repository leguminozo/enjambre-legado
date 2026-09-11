'use client'

import { useState } from 'react'
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url'

const TIPO_OPTIONS = [
  { value: 'cafeteria', label: 'Cafetería' },
  { value: 'tienda_gourmet', label: 'Tienda gourmet' },
  { value: 'hotel', label: 'Hotel' },
  { value: 'feria_evento', label: 'Feria / evento' },
  { value: 'otro', label: 'Otro' },
] as const

const ESPACIO_OPTIONS = [
  { value: 'tienda', label: 'Tienda' },
  { value: 'fruteria', label: 'Fruteria' },
  { value: 'feria', label: 'Feria' },
  { value: 'espacio_propio', label: 'Espacio propio' },
  { value: 'otro', label: 'Otro' },
] as const

type TipoValue = (typeof TIPO_OPTIONS)[number]['value']
type EspacioValue = (typeof ESPACIO_OPTIONS)[number]['value']

interface B2BRegisterFormProps {
  segmentType: TipoValue
  segmentLabel: string
  /** 'punto_venta' registra en b2b_puntos_venta; 'revendedor' en b2b_revendedores (embudos separados). */
  kind?: 'punto_venta' | 'revendedor'
}

interface FormState {
  nombre: string
  tipo: TipoValue
  ciudad: string
  contacto_nombre: string
  contacto_email: string
  whatsapp: string
  tipo_espacio: EspacioValue
}

interface SuccessResult {
  codigo_acceso?: string
  codigo_revendedor?: string
}

function isSuccessResult(value: unknown): value is SuccessResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('codigo_acceso' in value || 'codigo_revendedor' in value)
  )
}

const inputClassName =
  'w-full bg-surface-raised border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors'

export function B2BRegisterForm({
  segmentType,
  segmentLabel,
  kind = 'punto_venta',
}: B2BRegisterFormProps) {
  const isRevendedor = kind === 'revendedor'
  const [form, setForm] = useState<FormState>({
    nombre: '',
    tipo: segmentType,
    ciudad: '',
    contacto_nombre: '',
    contacto_email: '',
    whatsapp: '',
    tipo_espacio: 'tienda',
  })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<SuccessResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError(null)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const nucleoUrl = getNucleoApiUrl()
    if (!nucleoUrl) {
      setError('Servicio de registro no disponible. Intenta de nuevo más tarde.')
      setSubmitting(false)
      return
    }

    const endpoint = isRevendedor
      ? `${nucleoUrl}/api/b2b-publico/registro-revendedor`
      : `${nucleoUrl}/api/b2b-publico/registro-punto-venta`

    const body: Record<string, string> = isRevendedor
      ? { nombre: form.nombre, tipo_espacio: form.tipo_espacio }
      : { nombre: form.nombre, tipo: form.tipo }

    if (isRevendedor) {
      if (form.whatsapp.trim()) body.whatsapp = form.whatsapp.trim()
    } else {
      if (form.ciudad.trim()) body.ciudad = form.ciudad.trim()
      if (form.contacto_nombre.trim())
        body.contacto_nombre = form.contacto_nombre.trim()
      if (form.contacto_email.trim())
        body.contacto_email = form.contacto_email.trim()
    }

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `Error ${res.status}`)
      }

      const data: unknown = await res.json()

      if (isSuccessResult(data)) {
        setSuccess(data)
      } else {
        throw new Error('Respuesta inesperada del servidor.')
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Error al registrar. Intenta de nuevo.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    const codigo = success.codigo_acceso ?? success.codigo_revendedor
    return (
      <div className="glass-panel p-8 text-center space-y-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
          <svg
            className="h-7 w-7 text-accent-text"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <div className="space-y-2">
          <h3 className="font-display text-2xl font-light text-foreground">
            Registro recibido
          </h3>
          <p className="text-sm text-muted-foreground">
            Guarda este código: lo usarás cuando tu acceso quede activo. Nuestro
            equipo te contactará para coordinar la activación.
          </p>
        </div>

        <div className="rounded-xl border border-accent/30 bg-accent/10 px-6 py-5">
          <p className="text-[0.65rem] uppercase tracking-[0.3em] text-accent-text mb-2">
            {isRevendedor ? 'Código de revendedor' : 'Código de acceso'}
          </p>
          <p className="font-mono text-3xl font-semibold tracking-widest text-foreground">
            {codigo}
          </p>
        </div>

        <p className="text-xs text-muted-foreground">
          Si proporcionaste un correo, también recibirás la confirmación por
          escrito.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <label
          htmlFor="b2b-nombre"
          className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
        >
          {isRevendedor ? 'Tu nombre' : 'Nombre del establecimiento'}{' '}
          <span className="text-destructive">*</span>
        </label>
        <input
          id="b2b-nombre"
          name="nombre"
          type="text"
          required
          value={form.nombre}
          onChange={handleChange}
          placeholder={`Ej. ${segmentLabel} La Colmena`}
          className={inputClassName}
        />
      </div>

      {isRevendedor ? (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="b2b-tipo-espacio"
              className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              Dónde vendes
            </label>
            <select
              id="b2b-tipo-espacio"
              name="tipo_espacio"
              value={form.tipo_espacio}
              onChange={handleChange}
              className={inputClassName}
            >
              {ESPACIO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="b2b-whatsapp"
              className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              WhatsApp
            </label>
            <input
              id="b2b-whatsapp"
              name="whatsapp"
              type="tel"
              value={form.whatsapp}
              onChange={handleChange}
              placeholder="Ej. +56 9 9123 4567"
              className={inputClassName}
            />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="b2b-tipo"
              className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              Tipo de establecimiento
            </label>
            <select
              id="b2b-tipo"
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              className={inputClassName}
            >
              {TIPO_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="b2b-ciudad"
              className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
            >
              Ciudad
            </label>
            <input
              id="b2b-ciudad"
              name="ciudad"
              type="text"
              value={form.ciudad}
              onChange={handleChange}
              placeholder="Ej. Mérida"
              className={inputClassName}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor="b2b-contacto-nombre"
                className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                Nombre de contacto
              </label>
              <input
                id="b2b-contacto-nombre"
                name="contacto_nombre"
                type="text"
                value={form.contacto_nombre}
                onChange={handleChange}
                placeholder="Tu nombre"
                className={inputClassName}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="b2b-contacto-email"
                className="block text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                Correo electrónico
              </label>
              <input
                id="b2b-contacto-email"
                name="contacto_email"
                type="email"
                value={form.contacto_email}
                onChange={handleChange}
                placeholder="correo@ejemplo.com"
                className={inputClassName}
              />
            </div>
          </div>
        </>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !form.nombre.trim()}
        className="w-full min-h-12 bg-accent text-accent-foreground rounded-lg uppercase tracking-[0.2em] text-xs font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Registrando…
          </>
        ) : isRevendedor ? (
          'Registrar como revendedor'
        ) : (
          'Registrar punto de venta'
        )}
      </button>
    </form>
  )
}
