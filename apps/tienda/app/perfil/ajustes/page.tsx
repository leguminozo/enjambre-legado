import React from 'react';
import { SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { getNotificationPreferences } from '@/app/actions/notification-preferences';
import { getProfileCompleteData } from '@/app/actions/profile';
import { NotificationPreferencesForm } from '@/components/perfil/notification-preferences-form';
import { ProfileIdentityForm } from '@/components/perfil/profile-identity-form';
import { AccountPrivacySection } from '@/components/perfil/account-privacy-section';
import { AjustesThemeSection } from './ajustes-theme-section';

export default async function AjustesPage() {
  const [notificationPreferences, profileData] = await Promise.all([
    getNotificationPreferences(),
    getProfileCompleteData(),
  ]);

  return (
    <div className="space-y-14 animate-in">
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent-text">
            <SlidersHorizontal size={19} />
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-light text-foreground">
            Preferencias del Perfil
          </h1>
        </div>
        <p className="text-muted-foreground text-sm tracking-wide">
          Gestiona tu identidad, preferencias de despacho y datos para compras oficiales
        </p>
      </div>

      <AjustesThemeSection initialTheme={profileData?.theme_preference} />

      <div className="max-w-5xl space-y-14">
        <section className="space-y-6">
          <div className="flex items-center gap-2.5 text-accent-text">
            <ShieldCheck size={18} />
            <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold">
              Identidad & Datos de Compra Segura
            </h3>
          </div>

          {profileData ? (
            <ProfileIdentityForm initialData={profileData} />
          ) : null}
        </section>

        <NotificationPreferencesForm initialPreferences={notificationPreferences} />
        <AccountPrivacySection />
      </div>
    </div>
  );
}
