import { useState, useEffect } from 'react';
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Eye,
  EyeOff,
  Loader2,
  Settings
} from 'lucide-react';
import { useTheme, type Theme, toast } from '@enjambre/ui';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  mergeNotificationPreferences,
  parseNotificationPreferences,
  serializeNotificationPreferences,
  type NotificationCategory,
  type NotificationChannel,
  type NotificationPreferences,
} from '@enjambre/auth/notification-preferences';
import { supabase } from '@/lib/supabase';

const NOTIF_LABELS: Record<NotificationCategory, { title: string; desc: string }> = {
  pedidos: { title: 'Pedidos y envíos', desc: 'Confirmaciones de compra y despacho' },
  floracion: { title: 'Alertas de floración', desc: 'Ventanas de vuelo y recolección' },
  sistema: { title: 'Sistema', desc: 'Bienvenida, mantenimiento y avisos generales' },
};

export function PreferenciasTab() {
  const { theme, setTheme } = useTheme();
  
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [notifLoading, setNotifLoading] = useState(true);
  const [notifSaving, setNotifSaving] = useState(false);

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
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6 animate-in">
        <div className="flex items-center gap-2 text-accent mb-6">
          <Settings size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Apariencia
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 animate-in">
        <div className="flex items-center gap-3 text-accent mb-6">
          <Bell size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Notificaciones</h3>
          {notifSaving && <Loader2 size={14} className="animate-spin text-muted-foreground" />}
        </div>

        {notifLoading ? (
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Cargando preferencias...
          </div>
        ) : (
          <div className="space-y-3">
            {(Object.keys(NOTIF_LABELS) as NotificationCategory[]).map((category) => (
              <div key={category} className="p-4 bg-secondary/50 rounded-xl space-y-3 border border-border/50">
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
      </div>
    </div>
  );
}
