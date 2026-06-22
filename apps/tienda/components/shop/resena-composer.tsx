'use client';

import { useState } from 'react';
import {
  CRISTALIZACION_OPCIONES,
  FAMILIAS_AROMATICAS,
  RESENA_COPY,
  type CreateResenaInput,
} from '@enjambre/resenas';
import { friendlyError, toast } from '@enjambre/ui';
import { Star, Sparkles, MessageCircle, X } from 'lucide-react';
import { createResena, getAuthToken } from '@/lib/shop/resenas-api';

type Modo = 'anonima' | 'guardian';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-1 transition hover:scale-110"
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

export function ResenaComposer({
  productoId,
  productName,
  onClose,
  onSubmitted,
}: {
  productoId: string;
  productName: string;
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
        localStorage.setItem('oyz_resena_claim_token', result.claimToken);
      }

      toast(result.message ?? RESENA_COPY.pendingModeration, { type: 'success' });
      onSubmitted?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
      <div
        className={`w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden ${
          modo === 'guardian' ? 'ring-1 ring-accent/30' : ''
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Reseña</p>
            <h3 className="font-display text-lg">{productName}</h3>
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-2 p-4 border-b border-border bg-background/40">
          <button
            type="button"
            onClick={() => setModo('anonima')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              modo === 'anonima' ? 'bg-muted text-foreground' : 'text-muted-foreground'
            }`}
          >
            <MessageCircle size={16} />
            {RESENA_COPY.anonTitle}
          </button>
          <button
            type="button"
            onClick={() => setModo('guardian')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
              modo === 'guardian' ? 'bg-accent/15 text-accent' : 'text-muted-foreground'
            }`}
          >
            <Sparkles size={16} />
            {RESENA_COPY.guardianTitle}
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
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
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Tu apodo (opcional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </>
          ) : (
            <>
              <p className="text-xs text-accent/80">{RESENA_COPY.guardianSubtitle}</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs space-y-1">
                  Cuerpo
                  <select
                    value={cristalizacion}
                    onChange={(e) => setCristalizacion(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm"
                  >
                    {CRISTALIZACION_OPCIONES.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
                <label className="text-xs space-y-1">
                  Aroma
                  <select
                    value={familia}
                    onChange={(e) => setFamilia(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-2 py-2 text-sm"
                  >
                    {FAMILIAS_AROMATICAS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-xs block space-y-1">
                Intensidad en boca ({intensidad}/10)
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={intensidad}
                  onChange={(e) => setIntensidad(Number(e.target.value))}
                  className="w-full"
                />
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={4}
                placeholder="Describe la huella sensorial completa..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none"
              />
              <input
                value={momento}
                onChange={(e) => setMomento(e.target.value)}
                placeholder="Momento de consumo (opcional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={maridaje}
                onChange={(e) => setMaridaje(e.target.value)}
                placeholder="Maridaje sugerido (opcional)"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </>
          )}
        </div>

        <div className="p-4 border-t border-border">
          <button
            type="button"
            disabled={loading}
            onClick={() => void handleSubmit()}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {loading ? 'Enviando...' : modo === 'guardian' ? RESENA_COPY.guardianCta : RESENA_COPY.anonCta}
          </button>
        </div>
      </div>
    </div>
  );
}