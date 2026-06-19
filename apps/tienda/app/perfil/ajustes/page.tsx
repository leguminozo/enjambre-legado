import React from 'react';
import { Settings, User } from 'lucide-react';
import { getNotificationPreferences } from '@/app/actions/notification-preferences';
import { getProfileIdentity } from '@/app/actions/profile';
import { NotificationPreferencesForm } from '@/components/perfil/notification-preferences-form';
import { ProfileIdentityForm } from '@/components/perfil/profile-identity-form';
import { AjustesThemeSection } from './ajustes-theme-section';

export default async function AjustesPage() {
  const [notificationPreferences, profileIdentity] = await Promise.all([
    getNotificationPreferences(),
    getProfileIdentity(),
  ]);

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

          {profileIdentity ? (
            <ProfileIdentityForm
              initialFullName={profileIdentity.full_name}
              email={profileIdentity.email}
            />
          ) : null}
        </section>

        <NotificationPreferencesForm initialPreferences={notificationPreferences} />
      </div>
    </div>
  );
}