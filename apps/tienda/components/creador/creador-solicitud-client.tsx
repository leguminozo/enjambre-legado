'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { EmptyState, friendlyError, toast, Skeleton } from '@enjambre/ui';

const PLATAFORMAS = ['instagram', 'tiktok', 'youtube', 'blog', 'podcast', 'otro'] as const;

interface Solicitud {
  id: string;
  nombre_publico: string;
  plataforma: string;
  plataforma_url: string | null;
  nicho: string | null;
  seguidores_aprox: number;
  bio: string | null;
  estado: string;
  notas: string | null;
}

interface CreadorSolicitudClientProps {
  initialName: string | null;
}

const inputClassName =
  'mt-1 w-full min-h-11 rounded-xl border border-border bg-background px-4 py-3 text-base md:text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent/30';

const labelClassName = 'block text-sm font-medium text-foreground';

export function CreadorSolicitudClient({ initialName }: CreadorSolicitudClientProps) {
  const t = useTranslations('perfil.creadorSolicitud');
  const [loading, setLoading] = useState(true);
  const [isCreator, setIsCreator] = useState(false);
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nombre, setNombre] = useState(initialName ?? '');
  const [plataforma, setPlataforma] = useState<string>('instagram');
  const [plataformaUrl, setPlataformaUrl] = useState('');
  const [nicho, setNicho] = useState('');
  const [seguidores, setSeguidores] = useState('');
  const [bio, setBio] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data: creador } = await supabase
          .from('creadores')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (creador) {
          setIsCreator(true);
          return;
        }

        const { data, error } = await supabase
          .from('creador_solicitudes')
          .select('id,nombre_publico,plataforma,plataforma_url,nicho,seguidores_aprox,bio,estado,notas')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setSolicitud(data as Solicitud);
          if (data.estado === 'rechazado') {
            setNombre(data.nombre_publico ?? '');
            setPlataforma(data.plataforma ?? 'instagram');
            setPlataformaUrl(data.plataforma_url ?? '');
            setNicho(data.nicho ?? '');
            setSeguidores(String(data.seguidores_aprox ?? ''));
            setBio(data.bio ?? '');
          }
        }
      } catch (err) {
        toast.error(friendlyError(err, t('loadError')));
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (nombre.trim().length < 2) {
      toast.error(t('nameRequired'));
      return;
    }

    const seguidoresNum = seguidores.trim() === '' ? 0 : Number(seguidores);
    if (!Number.isInteger(seguidoresNum) || seguidoresNum < 0) {
      toast.error(t('followersInvalid'));
      return;
    }

    const url = plataformaUrl.trim();
    if (url !== '' && !/^https?:\/\/.+\..+/.test(url)) {
      toast.error(t('urlInvalid'));
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error(t('loginRequired'));
        return;
      }

      const payload = {
        user_id: user.id,
        nombre_publico: nombre.trim(),
        plataforma,
        plataforma_url: url === '' ? null : url,
        nicho: nicho.trim() === '' ? null : nicho.trim(),
        seguidores_aprox: seguidoresNum,
        bio: bio.trim() === '' ? null : bio.trim(),
        estado: 'pendiente',
      };

      if (solicitud) {
        const { data, error } = await supabase
          .from('creador_solicitudes')
          .update(payload)
          .eq('id', solicitud.id)
          .select('id,nombre_publico,plataforma,plataforma_url,nicho,seguidores_aprox,bio,estado,notas')
          .single();
        if (error) throw error;
        setSolicitud(data as Solicitud);
      } else {
        const { data, error } = await supabase
          .from('creador_solicitudes')
          .insert(payload)
          .select('id,nombre_publico,plataforma,plataforma_url,nicho,seguidores_aprox,bio,estado,notas')
          .single();
        if (error) throw error;
        setSolicitud(data as Solicitud);
      }

      toast.success(t('sent'));
    } catch (err) {
      toast.error(friendlyError(err, t('submitError')));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in" aria-busy="true" aria-label="Cargando postulación">
        <div className="p-6 rounded-2xl border border-border bg-card space-y-2">
          <Skeleton variant="text" className="w-24 h-3" />
          <Skeleton variant="text" className="w-48 h-7" />
          <Skeleton variant="text" className="w-72 max-w-full h-3.5" />
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card space-y-4">
          <Skeleton variant="rectangular" className="h-10 rounded-lg" />
          <Skeleton variant="rectangular" className="h-10 rounded-lg" />
          <Skeleton variant="rectangular" className="h-24 rounded-lg" />
        </div>
      </div>
    );
  }

  if (isCreator) {
    return (
      <EmptyState
        variant="composed"
        title={t('alreadyTitle')}
        description={t('alreadyDesc')}
        action={
          <Link
            href="/perfil/creador"
            className="inline-flex min-h-11 items-center gap-1 text-sm text-accent hover:text-accent/80"
          >
            {t('alreadyCta')} <ArrowUpRight size={14} />
          </Link>
        }
      />
    );
  }

  if (solicitud && (solicitud.estado === 'pendiente' || solicitud.estado === 'aprobado')) {
    return (
      <EmptyState
        variant="composed"
        title={solicitud.estado === 'pendiente' ? t('pendingTitle') : t('approvedTitle')}
        description={solicitud.estado === 'pendiente' ? t('pendingDesc') : t('approvedDesc')}
        action={
          solicitud.estado === 'aprobado' ? (
            <Link
              href="/perfil/creador"
              className="inline-flex min-h-11 items-center gap-1 text-sm text-accent hover:text-accent/80"
            >
              {t('approvedCta')} <ArrowUpRight size={14} />
            </Link>
          ) : (
            <Link
              href="/perfil"
              className="inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              {t('backToLegado')} <ArrowUpRight size={14} />
            </Link>
          )
        }
      />
    );
  }

  return (
    <div className="max-w-xl">
      {solicitud?.estado === 'rechazado' && (
        <div className="mb-6 rounded-xl border border-border bg-card p-4 text-sm">
          <p className="font-medium text-foreground">{t('rejectedTitle')}</p>
          <p className="mt-1 text-muted-foreground">
            {solicitud.notas || t('rejectedDesc')}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="creador-nombre" className={labelClassName}>
            {t('name')}
          </label>
          <input
            id="creador-nombre"
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={t('namePh')}
            maxLength={60}
            required
            minLength={2}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="creador-plataforma" className={labelClassName}>
            {t('platform')}
          </label>
          <select
            id="creador-plataforma"
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            className={inputClassName}
          >
            {PLATAFORMAS.map((p) => (
              <option key={p} value={p}>
                {t(`platforms.${p}`)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="creador-url" className={labelClassName}>
            {t('url')}
          </label>
          <input
            id="creador-url"
            type="url"
            inputMode="url"
            value={plataformaUrl}
            onChange={(e) => setPlataformaUrl(e.target.value)}
            placeholder={t('urlPh')}
            className={inputClassName}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="creador-nicho" className={labelClassName}>
              {t('niche')}
            </label>
            <input
              id="creador-nicho"
              type="text"
              value={nicho}
              onChange={(e) => setNicho(e.target.value)}
              placeholder={t('nichePh')}
              maxLength={100}
              className={inputClassName}
            />
          </div>
          <div>
            <label htmlFor="creador-seguidores" className={labelClassName}>
              {t('followers')}
            </label>
            <input
              id="creador-seguidores"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={seguidores}
              onChange={(e) => setSeguidores(e.target.value)}
              placeholder="0"
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="creador-bio" className={labelClassName}>
            {t('bio')}
          </label>
          <textarea
            id="creador-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('bioPh')}
            maxLength={500}
            rows={4}
            className={`${inputClassName} resize-y`}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? t('sending') : t('submit')}
        </button>

        <p className="text-xs text-muted-foreground leading-relaxed">{t('referNote')}</p>
      </form>
    </div>
  );
}
