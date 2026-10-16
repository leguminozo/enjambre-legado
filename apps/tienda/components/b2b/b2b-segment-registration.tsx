'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Lock,
  Mail,
  Store,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Download,
  Sparkles,
} from 'lucide-react';
import { toast, friendlyError } from '@enjambre/ui';
import type {
  B2BSegmentSlug,
  SegmentKit,
  SegmentQuestion,
} from '@/lib/b2b/segment-content';

export interface B2BSegmentRegistrationProps {
  segmentSlug: B2BSegmentSlug;
  segmentLabel: string;
  segmentTipo: string;
  kind?: 'punto_venta' | 'revendedor';
  kits: SegmentKit[];
  questions: SegmentQuestion[];
  selectedKitId?: string;
  onSelectKit?: (kitId: string) => void;
}

const inputClassName =
  'w-full bg-surface-raised border border-border/70 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors';

const labelClassName =
  'block text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5 font-medium';

export function B2BSegmentRegistration({
  segmentSlug,
  segmentLabel,
  segmentTipo,
  kind = 'punto_venta',
  kits,
  questions,
  selectedKitId,
  onSelectKit,
}: B2BSegmentRegistrationProps) {
  const router = useRouter();
  const isRevendedor = kind === 'revendedor';

  // Modo: 'cuenta' (cierre fuerte con contraseña y acceso a catálogo) | 'dossier' (solo catálogo a su correo)
  const [mode, setMode] = useState<'cuenta' | 'dossier'>('cuenta');

  // Estado del formulario de cuenta
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [contactoNombre, setContactoNombre] = useState('');
  const [contactoEmail, setContactoEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [chosenKitId, setChosenKitId] = useState(selectedKitId || kits[0]?.id || '');
  const [operationalAnswers, setOperationalAnswers] = useState<Record<string, string>>({});
  const [aceptaTerminos, setAceptaTerminos] = useState(true);

  // Estado del formulario de solo catálogo / dossier
  const [dossierNombre, setDossierNombre] = useState('');
  const [dossierEmail, setDossierEmail] = useState('');
  const [dossierWhatsapp, setDossierWhatsapp] = useState('');
  const [dossierCiudad, setDossierCiudad] = useState('');

  // Estados de carga y resultado
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cuentaCreada, setCuentaCreada] = useState(false);
  const [requiresEmailConfirmation, setRequiresEmailConfirmation] = useState(false);
  const [dossierEnviado, setDossierEnviado] = useState(false);

  // Sincronizar si cambia el prop selectedKitId externamente
  React.useEffect(() => {
    if (selectedKitId) {
      setChosenKitId(selectedKitId);
    }
  }, [selectedKitId]);

  const handleOperationalChange = (questionId: string, value: string) => {
    setOperationalAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleKitSelectInternal = (id: string) => {
    setChosenKitId(id);
    if (onSelectKit) {
      onSelectKit(id);
    }
  };

  // Envío del registro de cuenta (Cierre fuerte)
  const handleSubmitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !contactoEmail.trim() || !password.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (!aceptaTerminos) {
      setError('Debes aceptar las condiciones de la alianza comercial.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/b2b/register-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'account',
          segmentSlug,
          segmentTipo,
          nombre: nombre.trim(),
          ciudad: ciudad.trim(),
          contactoNombre: contactoNombre.trim(),
          contactoEmail: contactoEmail.trim(),
          whatsapp: whatsapp.trim(),
          password,
          kitId: chosenKitId,
          operationalAnswers,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `Error ${res.status}: No se pudo completar el registro`);
      }

      if (data.requiresEmailConfirmation) {
        setRequiresEmailConfirmation(true);
        setCuentaCreada(true);
      } else {
        toast('Cuenta de aliado creada exitosamente. Redirigiendo a tu configuración inicial...', {
          type: 'success',
        });
        const targetNext = `/alianzas/${segmentSlug}/onboarding?kit=${encodeURIComponent(chosenKitId)}`;
        router.push(targetNext);
      }
    } catch (err) {
      const msg = friendlyError(err, 'Ocurrió un error al procesar tu solicitud. Intenta nuevamente.');
      setError(msg);
      toast(msg, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Envío de solo dossier / catálogo a sus datos
  const handleSubmitDossier = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!dossierNombre.trim() || !dossierEmail.trim()) {
      setError('Por favor indica tu nombre y correo electrónico.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/b2b/register-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'dossier_only',
          segmentSlug,
          segmentTipo,
          nombre: dossierNombre.trim(),
          contactoEmail: dossierEmail.trim(),
          whatsapp: dossierWhatsapp.trim(),
          ciudad: dossierCiudad.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'No se pudo registrar la solicitud de catálogo.');
      }

      setDossierEnviado(true);
      toast('Catálogo técnico y propuesta comercial enviada a tu correo.', { type: 'success' });
    } catch (err) {
      const msg = friendlyError(err, 'No se pudo enviar el catálogo. Intenta nuevamente.');
      setError(msg);
      toast(msg, { type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Pantalla de confirmación de email pendiente
  if (cuentaCreada && requiresEmailConfirmation) {
    return (
      <div className="rounded-3xl border border-primary/40 bg-card p-8 sm:p-10 shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
          <Mail className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-primary">
            Confirmación de Acceso
          </span>
          <h3 className="font-display text-2xl sm:text-3xl text-foreground font-light">
            Revisa tu correo para activar tu cuenta
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Hemos enviado un enlace de acceso directo a{' '}
            <strong className="text-foreground">{contactoEmail}</strong>. Al confirmarlo ingresarás
            directamente al configurador de tu primer pedido con condiciones mayoristas activas.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-surface-raised/60 p-4 text-xs text-muted-foreground max-w-md mx-auto">
          <p className="flex items-center justify-center gap-2 text-foreground font-medium mb-1">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Acceso seguro al catálogo dedicado de {segmentLabel}
          </p>
          <p className="text-[11px]">
            Una vez verificado, tu establecimiento contará con tarifas oficiales, facturación formal y despacho prioritario.
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de confirmación de solo dossier
  if (dossierEnviado) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-8 sm:p-10 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-success/10 border border-success/20 flex items-center justify-center text-success mx-auto">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <span className="text-[10px] uppercase font-mono tracking-[0.25em] text-success">
            Dossier Enviado
          </span>
          <h3 className="font-display text-2xl text-foreground font-light">
            Catálogo y Ficha Técnica de {segmentLabel}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Hemos enviado el documento a <strong className="text-foreground">{dossierEmail}</strong>.
            También puedes descargarlo directamente en tu dispositivo:
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/catalogo"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-6 text-xs uppercase tracking-wider font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            Explorar Catálogo en Línea
          </a>
          <button
            type="button"
            onClick={() => {
              setDossierEnviado(false);
              setMode('cuenta');
            }}
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            Crear cuenta de aliado para hacer un pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Selector de modo: Cuenta (Cierre fuerte) vs Dossier (Ligero) */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-surface-sunken/80 border border-border/60 max-w-md mx-auto">
        <button
          type="button"
          onClick={() => {
            setMode('cuenta');
            setError(null);
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            mode === 'cuenta'
              ? 'bg-card text-foreground border border-border/80 shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span>Registrar y Acceder al Catálogo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('dossier');
            setError(null);
          }}
          className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            mode === 'dossier'
              ? 'bg-card text-foreground border border-border/80 shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Solo recibir catálogo</span>
        </button>
      </div>

      {/* Formulario Modo A: Cuenta de Aliado (Cierre Fuerte) */}
      {mode === 'cuenta' ? (
        <form onSubmit={handleSubmitAccount} className="space-y-5">
          {/* Kit preseleccionado */}
          {kits && kits.length > 0 && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-semibold block">
                  Kit de Entrada Planificado
                </span>
                <span className="text-sm font-medium text-foreground">
                  {chosenKitId === 'a-medida'
                    ? 'Propuesta a Medida / Pedido Específico'
                    : kits.find((k) => k.id === chosenKitId)?.nombre || 'Personalizar en Onboarding'}
                </span>
              </div>
              <select
                value={chosenKitId}
                onChange={(e) => handleKitSelectInternal(e.target.value)}
                className="bg-card border border-border/70 rounded-lg px-3 py-1.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              >
                {kits.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nombre} ({k.badge})
                  </option>
                ))}
                <option value="a-medida">
                  Propuesta a Medida / Pedido Específico
                </option>
              </select>
            </div>
          )}

          {/* Nombre del establecimiento */}
          <div>
            <label htmlFor="b2b-nombre-est" className={labelClassName}>
              {isRevendedor ? 'Tu Nombre o Razón Comercial' : `Nombre de tu ${segmentLabel}`}{' '}
              <span className="text-destructive">*</span>
            </label>
            <input
              id="b2b-nombre-est"
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={`Ej. ${segmentLabel} La Barra`}
              className={inputClassName}
            />
          </div>

          {/* Ciudad / Comuna */}
          <div>
            <label htmlFor="b2b-ciudad" className={labelClassName}>
              Ciudad o Comuna <span className="text-destructive">*</span>
            </label>
            <input
              id="b2b-ciudad"
              type="text"
              required
              value={ciudad}
              onChange={(e) => setCiudad(e.target.value)}
              placeholder="Ej. Puerto Varas / Santiago"
              className={inputClassName}
            />
          </div>

          {/* Preguntas Operativas del Segmento (Cero redundancia) */}
          {questions && questions.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-border/30">
              <span className="block text-[10px] uppercase font-mono tracking-widest text-primary">
                Criterios Operativos del Espacio
              </span>

              {questions.map((q) => (
                <div key={q.id}>
                  <label htmlFor={`op-${q.id}`} className={labelClassName}>
                    {q.label} {q.required && <span className="text-destructive">*</span>}
                  </label>

                  {q.type === 'select' && q.options ? (
                    <select
                      id={`op-${q.id}`}
                      required={q.required}
                      value={operationalAnswers[q.id] || ''}
                      onChange={(e) => handleOperationalChange(q.id, e.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Selecciona una opción…</option>
                      {q.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      id={`op-${q.id}`}
                      type="text"
                      required={q.required}
                      value={operationalAnswers[q.id] || ''}
                      onChange={(e) => handleOperationalChange(q.id, e.target.value)}
                      placeholder={q.placeholder || ''}
                      className={inputClassName}
                    />
                  )}

                  {q.helpText && (
                    <span className="block text-[11px] text-muted-foreground mt-1">
                      {q.helpText}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Datos de contacto y credenciales de acceso */}
          <div className="space-y-4 pt-2 border-t border-border/30">
            <span className="block text-[10px] uppercase font-mono tracking-widest text-primary">
              Cuenta de Acceso y Contacto
            </span>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="b2b-contacto-nombre" className={labelClassName}>
                  Nombre de Contacto <span className="text-destructive">*</span>
                </label>
                <input
                  id="b2b-contacto-nombre"
                  type="text"
                  required
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="b2b-whatsapp" className={labelClassName}>
                  WhatsApp de Coordinación
                </label>
                <input
                  id="b2b-whatsapp"
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+56 9 9123 4567"
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="b2b-email" className={labelClassName}>
                  Correo Electrónico <span className="text-destructive">*</span>
                </label>
                <input
                  id="b2b-email"
                  type="email"
                  required
                  value={contactoEmail}
                  onChange={(e) => setContactoEmail(e.target.value)}
                  placeholder="contacto@tunegocio.cl"
                  className={inputClassName}
                />
              </div>

              <div>
                <label htmlFor="b2b-password" className={labelClassName}>
                  Contraseña de Acceso <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    id="b2b-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={`${inputClassName} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Términos */}
          <div className="flex items-start gap-2.5 pt-2">
            <input
              id="terminos-alianza"
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
              className="mt-0.5 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="terminos-alianza" className="text-xs text-muted-foreground">
              Acepto las condiciones comerciales para aliados mayoristas de La Obrera y el Zángano.
            </label>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-12 rounded-xl bg-primary text-primary-foreground text-xs uppercase tracking-[0.2em] font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {submitting ? (
              <span>Creando cuenta de aliado…</span>
            ) : (
              <>
                <span>Crear Cuenta y Acceder al Catálogo de {segmentLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        /* Formulario Modo B: Solo Catálogo a sus Datos */
        <form onSubmit={handleSubmitDossier} className="space-y-4 max-w-lg mx-auto">
          <p className="text-xs text-muted-foreground text-center mb-6">
            Recibe en tu correo la lista de precios mayoristas, fichas técnicas y propuestas de exhibición
            para {segmentLabel} sin crear una contraseña hoy.
          </p>

          <div>
            <label htmlFor="dos-nombre" className={labelClassName}>
              Nombre del Establecimiento o Persona <span className="text-destructive">*</span>
            </label>
            <input
              id="dos-nombre"
              type="text"
              required
              value={dossierNombre}
              onChange={(e) => setDossierNombre(e.target.value)}
              placeholder="Ej. Cafetería Austral"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="dos-email" className={labelClassName}>
              Correo Electrónico <span className="text-destructive">*</span>
            </label>
            <input
              id="dos-email"
              type="email"
              required
              value={dossierEmail}
              onChange={(e) => setDossierEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className={inputClassName}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="dos-whatsapp" className={labelClassName}>
                WhatsApp (Opcional)
              </label>
              <input
                id="dos-whatsapp"
                type="tel"
                value={dossierWhatsapp}
                onChange={(e) => setDossierWhatsapp(e.target.value)}
                placeholder="+56 9 9123 4567"
                className={inputClassName}
              />
            </div>

            <div>
              <label htmlFor="dos-ciudad" className={labelClassName}>
                Ciudad
              </label>
              <input
                id="dos-ciudad"
                type="text"
                value={dossierCiudad}
                onChange={(e) => setDossierCiudad(e.target.value)}
                placeholder="Ej. Frutillar"
                className={inputClassName}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-12 rounded-xl border border-primary text-primary hover:bg-primary hover:text-primary-foreground text-xs uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? 'Enviando catálogo…' : 'Solicitar Únicamente el Catálogo a mis Datos'}
          </button>
        </form>
      )}
    </div>
  );
}
