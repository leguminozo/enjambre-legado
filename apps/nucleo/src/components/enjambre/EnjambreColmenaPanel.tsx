'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, Save } from 'lucide-react';
import { toast, ViewLoading } from '@enjambre/ui';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface SuscriptorRow {
  user_id: string;
  email: string;
  full_name: string | null;
  colmena_id: string | null;
}

interface ColmenaRow {
  id: string;
  name: string | null;
}

/**
 * Panel admin: vincula una colmena a un suscriptor activo. Escribe
 * suscriptor_config — la única forma de dar vida al Pasaporte Colmena de la
 * tienda (la tabla nunca se escribía; huérfano #1 del inventario).
 */
export function EnjambreColmenaPanel() {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState('');
  const [colmenaId, setColmenaId] = useState('');
  const [saving, setSaving] = useState(false);

  const query = useQuery<{ data: { suscriptores: SuscriptorRow[]; colmenas: ColmenaRow[] } }>({
    queryKey: ['enjambre', 'colmenas-vinculacion'],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    queryFn: async () => {
      const res = await apiFetch('/api/enjambre/colmenas-vinculacion');
      if (!res.ok) throw new Error('Error al cargar suscriptores y colmenas');
      return res.json();
    },
  });

  if (query.isLoading) {
    return <ViewLoading variant="inline" label="Pasaporte Colmena" />;
  }
  if (query.isError) return null; // silencioso: el resto de la configuración sigue

  const { suscriptores, colmenas } = query.data?.data ?? { suscriptores: [], colmenas: [] };

  async function handleSave() {
    if (!userId || !colmenaId) {
      toast('Selecciona suscriptor y colmena', { type: 'info' });
      return;
    }
    setSaving(true);
    try {
      const res = await apiFetch('/api/enjambre/colmena', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, colmena_id: colmenaId }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? 'Error al vincular');
      }
      toast('Colmena vinculada. El Pasaporte del suscriptor ya muestra su colmena.', {
        type: 'success',
      });
      await queryClient.invalidateQueries({ queryKey: ['enjambre', 'colmenas-vinculacion'] });
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Error al vincular', { type: 'error' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <MapPin size={16} className="text-accent-text" />
        <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-foreground">
          Pasaporte Colmena
        </h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground leading-relaxed">
        Vincula una colmena al suscriptor del Club Legado del Bosque. El pasaporte de la tienda la muestra
        (nombre, estado y peso).
      </p>
      <div className="space-y-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">Suscriptor activo</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="mt-1 w-full min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
          >
            <option value="">Selecciona…</option>
            {suscriptores.map((s) => (
              <option key={s.user_id} value={s.user_id}>
                {s.full_name || s.email} — {s.email}
                {s.colmena_id ? ' (ya vinculado)' : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">Colmena</span>
          <select
            value={colmenaId}
            onChange={(e) => setColmenaId(e.target.value)}
            className="mt-1 w-full min-h-10 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:border-accent"
          >
            <option value="">Selecciona…</option>
            {colmenas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.id}
              </option>
            ))}
          </select>
        </label>
      </div>
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent/10 px-6 text-[0.7rem] uppercase tracking-[0.2em] text-accent-text hover:bg-accent hover:text-accent-foreground transition-colors disabled:opacity-60"
      >
        <Save size={14} />
        {saving ? 'Vinculando…' : 'Vincular colmena'}
      </button>
    </section>
  );
}
