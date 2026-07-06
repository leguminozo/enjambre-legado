'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePwaStandalone } from '@/lib/hooks/use-pwa-standalone';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'oyz_pwa_install_dismissed';

export function InstallPrompt() {
  const isPwa = usePwaStandalone();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1');
  }, []);

  useEffect(() => {
    if (isPwa) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isPwa]);

  if (isPwa || dismissed || !deferred) return null;

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  };

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    dismiss();
  };

  return (
    <div className="tienda-install-prompt md:hidden">
      <div className="tienda-install-prompt-inner">
        <Download size={18} className="text-accent shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">Instala la tienda</p>
          <p className="text-xs text-muted-foreground">Acceso rápido desde tu pantalla de inicio.</p>
        </div>
        <button
          type="button"
          onClick={() => void install()}
          className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground"
        >
          Instalar
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 p-2 text-muted-foreground"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}