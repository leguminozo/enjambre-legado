'use client';

import { useState, useEffect } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  Database,
  Palette,
  Eye,
  EyeOff,
  Loader2,
  LayoutTemplate,
} from 'lucide-react';
import { useTheme, type Theme } from '@enjambre/ui';
import { toast } from '@enjambre/ui';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  parseNotificationPreferences,
  serializeNotificationPreferences,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationPreferences,
} from '@enjambre/auth/notification-preferences';
import { StoreEditorModal } from '@/components/cms/StoreEditorModal';
import { supabase } from '@/lib/supabase';
import { ViewShell } from '@/components/layout/ViewShell';

const NOTIF_LABELS: Record<NotificationCategory, { title: string; desc: string }> = {
  pedidos: { title: 'Pedidos y envíos', desc: 'Confirmaciones de compra y despacho' },
  floracion: { title: 'Alertas de floración', desc: 'Ventanas de vuelo y cosecha' },
  sistema: { title: 'Sistema', desc: 'Bienvenida, mantenimiento y avisos generales' },
};

interface DataStats {
  productos: number;
  ventas: number;
  clientes: number;
  colmenas: number;
  lastUpdated: string | null;
}

export function ConfiguracionView() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  // Modal state for Store Editor
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);
  
  const [dataStats, setDataStats] = useState<DataStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function loadPrefs() {
      setNotifLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotifLoading(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', user.id)
        .maybeSingle();
      setNotifPrefs(parseNotificationPreferences(data?.notification_preferences));
      setNotifLoading(false);
    }
    loadPrefs();
  }, []);

  useEffect(() => {
    async function loadStats() {
      setDataLoading(true);
      const tables = ['productos', 'ventas', 'clientes', 'colmenas'] as const;
      const counts = await Promise.all(
        tables.map(async (table) => {
          const { count } = await supabase.from(table).select('id', { count: 'exact', head: true });
          return count ?? 0;
        }),
      );
      const { data: latest } = await supabase
        .from('ventas')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setDataStats({
        productos: counts[0],
        ventas: counts[1],
        clientes: counts[2],
        colmenas: counts[3],
        lastUpdated: latest?.created_at ?? null,
      });
      setDataLoading(false);
    }
    loadStats();
  }, []);

  const handleNotifToggle = async (category: NotificationCategory, channel: NotificationChannel) => {
    const next = mergeNotificationPreferences(notifPrefs, {
      [category]: { [channel]: !notifPrefs[category][channel] },
    });
    setNotifPrefs(next);
    setNotifSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotifSaving(false);
      return;
    }
    const serialized = serializeNotificationPreferences(next);
    const { error } = await supabase
      .from('profiles')
      .update({ notification_preferences: serialized })
      .eq('id', user.id);
    setNotifSaving(false);
    if (error) {
      toast('No se pudieron guardar las preferencias', { type: 'error' });
      setNotifPrefs(notifPrefs);
    } else {
      toast('Preferencias guardadas', { type: 'success' });
    }
  };

  const themes: { value: Theme; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={18} />, label: 'Claro' },
    { value: 'dark', icon: <Moon size={18} />, label: 'Oscuro' },
    { value: 'system', icon: <Monitor size={18} />, label: 'Sistema' },
  ];

  return (
    <div className="space-y-8 animate-in">
      <ViewShell
        variant="compact"
        eyebrow="Sistema"
        title="Configuración"
        subtitle="Personaliza tu experiencia y el contenido de la tienda"
        icon={<Settings size={20} />}
      />

      <div className="max-w-4xl space-y-8">
        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            {resolvedTheme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
            <h3 className="text-sm font-bold uppercase tracking-widest">Apariencia</h3>
          </div>

          <div className="theme-picker-grid">
            {themes.map((t) => (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                  theme === t.value
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-secondary hover:border-accent/50'
                }`}
              >
                {t.icon}
                <span className="text-xs uppercase tracking-widest">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-accent">
            <LayoutTemplate size={120} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 text-accent mb-4">
              <Palette size={18} />
              <h3 className="text-sm font-bold uppercase tracking-widest">Contenido de la Tienda</h3>
            </div>

            <p className="text-sm text-muted-foreground mb-6 max-w-lg leading-relaxed">
              Edita los textos e imágenes que se muestran en la tienda pública (Hero, Servicios, Nosotros, Galerías). 
              Abre el editor visual inmersivo para previsualizar los cambios en tiempo real.
            </p>

            <button
              onClick={() => setIsEditorOpen(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-accent text-accent-foreground hover:bg-accent/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              <LayoutTemplate size={18} />
              Abrir Editor Visual de Tienda
            </button>
          </div>
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            <Bell size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Notificaciones</h3>
            {notifSaving && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
          </div>

          {notifLoading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Cargando preferencias...
            </div>
          ) : (
            <div className="space-y-3">
              {(Object.keys(NOTIF_LABELS) as NotificationCategory[]).map((category) => (
                <div key={category} className="p-4 bg-secondary/50 rounded-xl space-y-3">
                  <div>
                    <p className="text-sm font-medium">{NOTIF_LABELS[category].title}</p>
                    <p className="text-xs text-muted-foreground">{NOTIF_LABELS[category].desc}</p>
                  </div>
                  <div className="flex gap-4">
                    {(['in_app', 'email'] as NotificationChannel[]).map((channel) => (
                      <button
                        key={channel}
                        onClick={() => handleNotifToggle(category, channel)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          notifPrefs[category][channel]
                            ? 'bg-accent/20 text-accent border border-accent'
                            : 'bg-surface-sunken border border-border text-muted-foreground'
                        }`}
                      >
                        {notifPrefs[category][channel] ? <Eye size={14} /> : <EyeOff size={14} />}
                        {channel === 'in_app' ? 'En app' : 'Email'}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6 bg-surface p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 text-accent">
            <Database size={18} />
            <h3 className="text-sm font-bold uppercase tracking-widest">Datos</h3>
          </div>

          {dataLoading ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Consultando tablas...
            </div>
          ) : dataStats ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Productos', val: dataStats.productos },
                  { label: 'Ventas', val: dataStats.ventas },
                  { label: 'Clientes CRM', val: dataStats.clientes },
                  { label: 'Colmenas', val: dataStats.colmenas },
                ].map((s) => (
                  <div key={s.label} className="p-3 bg-secondary/50 rounded-xl text-center">
                    <div className="text-lg font-semibold">{s.val}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-xl">
                <div>
                  <p className="text-sm font-medium">Sincronización Supabase Realtime</p>
                  <p className="text-xs text-muted-foreground">
                    {dataStats.lastUpdated
                      ? `Última venta registrada: ${new Date(dataStats.lastUpdated).toLocaleString('es-CL')}`
                      : 'Sin actividad reciente en ventas'}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-accent/15 text-accent">Activo</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No se pudieron cargar las estadísticas.</p>
          )}
        </section>
      </div>

      <StoreEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)} 
      />
    </div>
  );
}
