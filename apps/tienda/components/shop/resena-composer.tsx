'use client';

import { useEffect, useState } from 'react';
import {
  CRISTALIZACION_OPCIONES,
  FAMILIAS_AROMATICAS,
  RESENA_COPY,
  type CreateResenaInput,
} from '@enjambre/resenas';
import { friendlyError, toast } from '@enjambre/ui';
import { Star, Sparkles, MessageCircle } from 'lucide-react';
import { RESENA_CLAIM_TOKEN_KEY } from '@/lib/shop/commerce-storage';
import { checkEligible, createResena, getAuthToken } from '@/lib/shop/resenas-api';
import { useAuth } from '@/components/providers/auth-context';
import { TiendaModal } from '@/components/shop/tienda-modal';

type Modo = 'anonima' | 'guardian';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center transition hover:scale-110"
          aria-label={`${n} estrellas`}
        >
          <Star
            size={22}
            className={n <= value ? 'fill-accent text-accent' : 'text-muted-foreground/40'}
          />
        </button>
      ))}
    </div>
  );
}

const modalFieldClass =
  'w-full rounded-lg border border-border bg-secondary/40 px-3 py-3 text-base sm:text-sm text-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30';

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
  const [rating, setRating] = useState(5);
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
          toast('Escribe al menos 3 caracteres', { type: 'error' });
          return;
        }
        payload = {
          modo: 'anonima',
          producto_id: productoId,
          rating,
          comentario_corto: comentario.trim(),
          display_name: displayName.trim() || undefined,
        };
      } else {
        if (!token) {
          toast('Inicia sesión para la huella guardian', { type: 'error' });
          return;
        }
        if (notas.trim().length < 10) {
          toast('La huella necesita al menos 10 caracteres', { type: 'error' });
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
        toast(friendlyError(result.error, result.error ?? 'Error'), { type: 'error' });
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
    <div className="flex gap-2 -mt-1">
      <button
        type="button"
        onClick={() => setModo('anonima')}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 min-h-[44px] text-sm transition ${
          modo === 'anonima' ? 'bg-muted text-foreground' : 'text-muted-foreground'
        }`}
      >
        <MessageCircle size={16} />
        {RESENA_COPY.anonTitle}
      </button>
      <button
        type="button"
        onClick={() => setModo('guardian')}
        className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 min-h-[44px] text-sm transition ${
          modo === 'guardian' ? 'bg-accent/15 text-accent' : 'text-muted-foreground'
        }`}
      >
        <Sparkles size={16} />
        {RESENA_COPY.guardianTitle}
      </button>
    </div>
  );

  return (
    <TiendaModal
      open={open}
      onClose={onClose}
      kicker="Reseña"
      title={productName}
      ariaLabel={`Escribir reseña de ${productName}`}
      size="lg"
      headerExtra={modeTabs}
      footer={
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleSubmit()}
          className="w-full min-h-[48px] rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {loading ? 'Enviando...' : modo === 'guardian' ? RESENA_COPY.guardianCta : RESENA_COPY.anonCta}
        </button>
      }
    >
      <div className={`space-y-4 ${modo === 'guardian' ? 'ring-0' : ''}`}>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Tu valoración</p>
          <StarPicker value={rating} onChange={setRating} />
        </div>

        {modo === 'anonima' ? (
          <>
            <p className="text-xs text-muted-foreground">{RESENA_COPY.anonSubtitle}</p>
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              maxLength={280}
              rows={4}
              placeholder="¿Qué te transmitió esta miel?"
              className={`${modalFieldClass} resize-none`}
            />
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Tu apodo (opcional)"
              className={modalFieldClass}
            />
          </>
        ) : (
          <>
            <p className="text-xs text-accent/80">{RESENA_COPY.guardianSubtitle}</p>
            {eligibilityLoading ? (
              <p className="text-xs text-muted-foreground italic">Verificando compra…</p>
            ) : eligibility?.compraVerificada ? (
              <p className="text-xs text-success/90">Compra verificada — tu huella quedará marcada como Guardian.</p>
            ) : eligibility?.reason ? (
              <p className="text-xs text-muted-foreground">{eligibility.reason}</p>
            ) : !isAuthenticated ? (
              <p className="text-xs text-muted-foreground">Inicia sesión para dejar huella guardian.</p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs space-y-1.5">
                Cuerpo
                <select
                  value={cristalizacion}
                  onChange={(e) => setCristalizacion(e.target.value)}
                  className={modalFieldClass}
                >
                  {CRISTALIZACION_OPCIONES.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs space-y-1.5">
                Aroma
                <select
                  value={familia}
                  onChange={(e) => setFamilia(e.target.value)}
                  className={modalFieldClass}
                >
                  {FAMILIAS_AROMATICAS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="text-xs block space-y-1.5">
              Intensidad en boca ({intensidad}/10)
              <input
                type="range"
                min={1}
                max={10}
                value={intensidad}
                onChange={(e) => setIntensidad(Number(e.target.value))}
                className="w-full min-h-[44px]"
              />
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={4}
              placeholder="Describe la huella sensorial completa..."
              className={`${modalFieldClass} resize-none`}
            />
            <input
              value={momento}
              onChange={(e) => setMomento(e.target.value)}
              placeholder="Momento de consumo (opcional)"
              className={modalFieldClass}
            />
            <input
              value={maridaje}
              onChange={(e) => setMaridaje(e.target.value)}
              placeholder="Maridaje sugerido (opcional)"
              className={modalFieldClass}
            />
          </>
        )}
      </div>
    </TiendaModal>
  );
}