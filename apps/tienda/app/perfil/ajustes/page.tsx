import React from 'react';
import { Settings, User } from 'lucide-react';
import { getNotificationPreferences } from '@/app/actions/notification-preferences';
import { NotificationPreferencesForm } from '@/components/perfil/notification-preferences-form';
import { AjustesThemeSection } from './ajustes-theme-section';

export default async function AjustesPage() {
  const notificationPreferences = await getNotificationPreferences();

  return (
    <div className="space-y-16 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
            <Settings size={20} />
          </div>
          <h1 className="font-display text-4xl font-light text-foreground">Ajustes Guardián</h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          Gestiona tu identidad y coordenadas en el ecosistema
        </p>
      </div>

      <AjustesThemeSection />

      <div className="max-w-2xl space-y-12">
        <section className="space-y-8">
          <div className="flex items-center gap-3 text-accent">
            <User size={18} />
            <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">Identidad Pública</h3>
          </div>

          <div className="grid gap-6">
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Nombre Completo
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Ej: Gabriel Miranda"
                className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                id="email"
                name="email"
                disabled
                className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-muted-foreground cursor-not-allowed"
                placeholder="guardian@bosque.cl"
              />
            </div>
          </div>
        </section>

        <NotificationPreferencesForm initialPreferences={notificationPreferences} />
      </div>
    </div>
  );
}