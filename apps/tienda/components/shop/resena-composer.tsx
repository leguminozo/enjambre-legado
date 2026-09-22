'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CRISTALIZACION_OPCIONES,
  FAMILIAS_AROMATICAS,
  RESENA_COPY,
  type CreateResenaInput,
} from '@enjambre/resenas';
import { friendlyError, toast } from '@enjambre/ui';
import { Star, ShieldCheck, Compass, Sparkles, UserCheck } from 'lucide-react';
import { RESENA_CLAIM_TOKEN_KEY } from '@/lib/shop/commerce-storage';
import { checkEligible, createResena, getAuthToken } from '@/lib/shop/resenas-api';
import { useAuth } from '@/components/providers/auth-context';
import { TiendaModal } from '@/components/shop/tienda-modal';

type Modo = 'anonima' | 'guardian';

// Selector de 7 estrellas (escala cultural chilena de 1 a 7)
function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1 sm:gap-1.5">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1 sm:p-1.5 min-h-[44px] min-w-[36px] flex flex-col items-center justify-center transition-all hover:scale-110 active:scale-95"
          aria-label={`${n} de 7 estrellas`}
        >
          <Star
            size={22}
            className={n <= value ? 'fill-accent text-accent-text' : 'text-muted-foreground/30'}
          />
          <span className="text-[9px] text-muted-foreground/70 mt-0.5 font-mono">{n}</span>
        </button>
      ))}
      <span className="text-xs font-semibold text-foreground ml-2 tabular-nums">
        {value} / 7
      </span>
    </div>
  );
}

const modalFieldClass =
  'w-full rounded-lg border border-border bg-secondary/40 px-3 py-3 text-base sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30';

/** Disocia nombres completos a iniciales (conforme a Ley 19.628 de Protección de la Vida Privada) */
function formatInitials(raw: string | undefined): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  const trimmed = raw.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return parts.map((p) => `${p[0].toUpperCase()}.`).join(' ');
  }
  if (parts.length === 1 && parts[0].length > 3) {
    return `${parts[0][0].toUpperCase()}.`;
  }
  return trimmed;
}

export function ResenaComposer({
  productoId,
  productName,
  open,
  onClose,
  onSubmitted,
}: {
  productoId: string;
  productName: string;
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const [modo, setModo] = useState<Modo>('anonima');
  const [rating, setRating] = useState(7);
  const [comentario, setComentario] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [cristalizacion, setCristalizacion] = useState<string>(CRISTALIZACION_OPCIONES[0]);
  const [familia, setFamilia] = useState<string>(FAMILIAS_AROMATICAS[0]);
  const [intensidad, setIntensidad] = useState(7);
  const [notas, setNotas] = useState('');
  const [momento, setMomento] = useState('');
  const [maridaje, setMaridaje] = useState('');
  const [loading, setLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    compraVerificada?: boolean;
    venta_id?: string | null;
    reason?: string;
  } | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleOpenWithDetail = (e: Event) => {
      const custom = e as CustomEvent<{ intensidad?: number }>;
      if (custom.detail?.intensidad) {
        setIntensidad(custom.detail.intensidad);
      }
    };
    window.addEventListener('enjambre:open-resena-composer', handleOpenWithDetail);
    return () => window.removeEventListener('enjambre:open-resena-composer', handleOpenWithDetail);
  }, []);

  useEffect(() => {
    if (!open || modo !== 'guardian' || !isAuthenticated) {
      setEligibility(null);
      return;
    }

    let cancelled = false;
    setEligibilityLoading(true);

    void (async () => {
      const token = await getAuthToken();
      if (!token || cancelled) {
        setEligibilityLoading(false);
        return;
      }
      const result = await checkEligible(productoId, token);
      if (!cancelled) {
        setEligibility(result);
        setEligibilityLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, modo, isAuthenticated, productoId]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = modo === 'guardian' ? await getAuthToken() : undefined;
      let payload: CreateResenaInput;

      if (modo === 'anonima') {
        if (comentario.trim().length < 3) {
          toast('Por favor comparte al menos unas palabras sobre tu experiencia', { type: 'error' });
          return;
        }
        payload = {
          modo: 'anonima',
          producto_id: productoId,
          rating,
          comentario_corto: comentario.trim(),
          display_name: formatInitials(displayName) || undefined,
        };
      } else {
        if (!token) {
          toast('Inicia sesión para registrar tu huella en el Legado Sensorial', { type: 'error' });
          return;
        }
        if (notas.trim().length < 10) {
          toast('La cata sensorial requiere al menos 10 caracteres', { type: 'error' });
          return;
        }
        payload = {
          modo: 'guardian',
          producto_id: productoId,
          rating,
          venta_id: eligibility?.venta_id ?? undefined,
          cristalizacion_percibida: cristalizacion as (typeof CRISTALIZACION_OPCIONES)[number],
          familia_aromatica: familia as (typeof FAMILIAS_AROMATICAS)[number],
          intensidad_fondo: intensidad,
          notas_personales: notas.trim(),
          momento_consumo: momento.trim() || undefined,
          maridaje: maridaje.trim() || undefined,
          comentario_corto: comentario.trim() || undefined,
        };
      }

      const result = await createResena(payload, token);
      if (!result.ok) {
        toast(friendlyError(result.error, result.error ?? 'No se pudo guardar la reseña'), { type: 'error' });
        return;
      }

      if (result.claimToken) {
        localStorage.setItem(RESENA_CLAIM_TOKEN_KEY, result.claimToken);
      }

      toast(result.message ?? RESENA_COPY.pendingModeration, { type: 'success' });
      onSubmitted?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const modeTabs = (
    <div className="flex gap-2 -mt-1 p-1 bg-surface-sunken/60 rounded-xl border border-border/50">
      <button
        type="button"
        onClick={() => setModo('anonima')}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 min-h-[44px] text-xs font-semibold uppercase tracking-wider transition ${
          modo === 'anonima'
            ? 'bg-card text-foreground shadow-sm border border-border/80'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <Compass size={14} className={modo === 'anonima' ? 'text-primary' : ''} />
        <span>Visitantes (Rápido)</span>
      </button>
      <button
        type="button"
        onClick={() => setModo('guardian')}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 min-h-[44px] text-xs font-semibold uppercase tracking-wider transition ${
          modo === 'guardian'
            ? 'bg-primary/15 text-primary shadow-sm border border-primary/30'
            : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <ShieldCheck size={14} />
        <span>Legado Sensorial</span>
      </button>
    </div>
  );

  return (
    <TiendaModal
      open={open}
      onClose={onClose}
      kicker="Expresión Botánica de Origen"
      title={`Cata de ${productName}`}
      ariaLabel={`Crear reseña sensorial de ${productName}`}
      size="lg"
      headerExtra={modeTabs}
      footer={
        <div className="w-full space-y-2">
          {modo === 'guardian' && !isAuthenticated ? (
            <Link
              href="/login"
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              <UserCheck size={16} />
              <span>Acceder con mi Cuenta Legado</span>
            </Link>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => void handleSubmit()}
              className="w-full min-h-[48px] rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading
                ? 'Registrando...'
                : modo === 'guardian'
                  ? 'Confirmar Huella en el Legado Sensorial'
                  : 'Publicar Testimonio de Paso'}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-5">
        {/* Selector de Valoración en Escala 1 a 7 */}
        <div className="p-4 rounded-xl bg-surface-sunken/40 border border-border/40 space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Calificación de Excelencia (Escala 1 a 7)
          </p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {modo === 'anonima' ? (
          /* Modo Visitantes (Rápido) */
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Comparte tu percepción en 30 segundos. Ideal para quienes degustaron en una cafetería aliada, hotel,
              feria o acaban de probar el frasco en casa.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Tu testimonio sensorial
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={280}
                rows={4}
                placeholder="Describe qué sensaciones, texturas o recuerdos te evocó esta miel..."
                className={`${modalFieldClass} resize-none`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                Tus iniciales o alias voluntario
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="ej. G. C. o Guardián del Sur"
                className={modalFieldClass}
              />
              <p className="text-[11px] text-muted-foreground/80">
                Por resguardo de privacidad (Ley N° 19.628), solo se publicarán iniciales o tu alias.
              </p>
            </div>
          </div>
        ) : (
          /* Modo Legado Sensorial (Experiencia Completa para Miembros) */
          <div className="space-y-4">
            {!isAuthenticated ? (
              <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <Sparkles size={16} />
                  <span>Cata Completa del Enjambre Legado</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El protocolo de cata profunda te permite calibrar cuerpo, aroma, notas organolépticas y sugerir
                  maridajes. Además, acumula puntos de fidelidad en tu cuenta del Club Legado y otorga el sello dorado
                  de <strong>Legado</strong> a tu testimonio.
                </p>
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity min-h-10"
                  >
                    Iniciar Sesión / Registrarse
                  </Link>
                  <button
                    type="button"
                    onClick={() => setModo('anonima')}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-colors min-h-10"
                  >
                    Continuar como Visitante
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-primary/90 leading-relaxed font-medium">
                  {RESENA_COPY.guardianSubtitle}
                </p>

                {eligibilityLoading ? (
                  <p className="text-xs text-muted-foreground italic">Verificando compras asociadas…</p>
                ) : eligibility?.compraVerificada ? (
                  <p className="text-xs text-success-text/90 font-medium">
                    ✓ Compra verificada: tu reseña recibirá la insignia de Compra Verificada y Sello Legado.
                  </p>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs space-y-1.5 block">
                    <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                      Textura / Cristalización
                    </span>
                    <select
                      value={cristalizacion}
                      onChange={(e) => setCristalizacion(e.target.value)}
                      className={modalFieldClass}
                    >
                      {CRISTALIZACION_OPCIONES.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs space-y-1.5 block">
                    <span className="uppercase tracking-wider text-muted-foreground font-medium block">
                      Familia Aromática Dominante
                    </span>
                    <select
                      value={familia}
                      onChange={(e) => setFamilia(e.target.value)}
                      className={modalFieldClass}
                    >
                      {FAMILIAS_AROMATICAS.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="uppercase tracking-wider text-muted-foreground font-medium">
                      Intensidad en Paladar
                    </span>
                    <span className="font-semibold text-primary">{intensidad} / 10</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={intensidad}
                    onChange={(e) => setIntensidad(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-border rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                    Firma Sensorial Completa & Notas de Origen
                  </label>
                  <textarea
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={3}
                    placeholder="Describe los matices, la apertura aromática y la persistencia en boca..."
                    className={`${modalFieldClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                      Momento de Consumo
                    </label>
                    <input
                      value={momento}
                      onChange={(e) => setMomento(e.target.value)}
                      placeholder="ej. Sobremesa, desayuno pausado"
                      className={modalFieldClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-wider text-muted-foreground font-medium block">
                      Maridaje Sugerido
                    </label>
                    <input
                      value={maridaje}
                      onChange={(e) => setMaridaje(e.target.value)}
                      placeholder="ej. Queso azul, café filtrado"
                      className={modalFieldClass}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </TiendaModal>
  );
}