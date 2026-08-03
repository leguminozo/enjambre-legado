import { useState, useEffect } from 'react';
import { useApiFetch } from '@/hooks/use-api-fetch';

interface ReflexionData {
  date: string;
  content: string;
  date_display?: string;
}

/** Widget "Última Reflexión": reflexión generada tras la última visita (API produccion). */
export function WidgetReflexion() {
  const apiFetch = useApiFetch();
  const [reflexion, setReflexion] = useState<ReflexionData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function cargar() {
      try {
        const res = await apiFetch('/api/produccion/reflexiones');
        if (!res.ok) {
          if (!cancelled) setReflexion(null);
          return;
        }
        const j = await res.json();
        const row = (j.data ?? [])[0] as
          | { fecha?: string; texto?: string; colmena?: string }
          | undefined;
        if (!cancelled) {
          setReflexion(
            row
              ? { date: row.fecha ?? '', content: row.texto ?? '', date_display: row.colmena }
              : null,
          );
        }
      } catch {
        if (!cancelled) setReflexion(null);
      }
    }

    void cargar();
    return () => {
      cancelled = true;
    };
  }, [apiFetch]);

  if (!reflexion) return null;

  return (
    <div
      className="card animate-in delay-4"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.85))',
        color: 'hsl(var(--primary-foreground))',
        border: 'none',
      }}
    >
      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', color: 'hsl(var(--accent))', marginBottom: 'var(--space-sm)' }}>
        Última Reflexión · {reflexion.date || new Date().toLocaleDateString()}
      </div>
      <p style={{ fontFamily: 'var(--font-existencial)', fontSize: '1rem', fontStyle: 'italic', lineHeight: 1.6, color: 'hsl(var(--primary-foreground) / 0.85)' }}>
        "{reflexion.content}"
      </p>
      <div style={{ marginTop: 'var(--space-md)', fontSize: '0.75rem', color: 'hsl(var(--primary-foreground) / 0.45)' }}>
        — Generado automático posvisita
      </div>
    </div>
  );
}
