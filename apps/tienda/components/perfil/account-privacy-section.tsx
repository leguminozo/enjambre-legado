'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2, AlertTriangle, X } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { exportAccountData, deleteAccountInstantly } from '@/app/actions/account-privacy';

export interface AccountPrivacySectionProps {
  className?: string;
}

export function AccountPrivacySection(_props: AccountPrivacySectionProps = {}) {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const [exporting, startExport] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (!isModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen]);

  const handleExport = () => {
    startExport(async () => {
      try {
        const data = await exportAccountData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oyz-mis-datos-${data.exported_at.slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Descargamos una copia de tus datos', { type: 'success' });
      } catch (err) {
        console.error('[AccountPrivacy] Error al exportar datos:', err);
        toast('No se pudo exportar. Intenta de nuevo.', { type: 'error' });
      }
    });
  };

  const handleInstantDelete = () => {
    if (confirmText.trim() !== 'ELIMINAR') {
      toast('Escribe exactamente ELIMINAR en mayúsculas para confirmar', { type: 'error' });
      return;
    }

    startDelete(async () => {
      try {
        await deleteAccountInstantly();
        await signOut();
        toast('Tu cuenta ha sido eliminada. Tus datos personales fueron borrados.', { type: 'success' });
        window.location.href = '/';
      } catch (err) {
        console.error('[AccountPrivacy] Error al eliminar cuenta:', err);
        toast('No se pudo completar la eliminación. Intenta nuevamente.', { type: 'error' });
      }
    });
  };

  return (
    <section className="space-y-6 border-t border-border pt-12">
      <div>
        <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-accent-text">
          Tus datos (Ley 21.719 — Privacidad y Derechos ARCO)
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes descargar una copia de toda tu información o solicitar el borrado instantáneo de tu cuenta.
          Por mandato del Código Tributario chileno, los comprobantes de ventas y boletas electrónicas emitidas se conservan disociados y anonimizados.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:border-accent/40 disabled:opacity-50 transition-colors"
        >
          <Download size={16} />
          {exporting ? 'Preparando archivo…' : 'Descargar mis datos'}
        </button>

        <button
          type="button"
          onClick={() => {
            setConfirmText('');
            setIsModalOpen(true);
          }}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-5 text-sm font-semibold text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
        >
          <Trash2 size={16} />
          Eliminar perfil
        </button>
      </div>

      {/* Módulo emergente central en pantalla para confirmación instantánea */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-delete-title"
        >
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-destructive/15 text-destructive shrink-0 mt-0.5">
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 id="modal-delete-title" className="text-base font-bold text-foreground">¿Eliminar perfil de forma permanente?</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Esta acción es <strong>instantánea e irreversible</strong>. Se revocarán tus accesos,
                  se borrarán tus datos de contacto y perderás tus beneficios acumulados.
                </p>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Las compras y boletas electrónicas previas se mantendrán anonimizadas para dar cumplimiento
                  al deber legal tributario del SII.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label htmlFor="modal-confirm-input" className="block text-xs font-semibold text-foreground">
                Para confirmar la eliminación, escribe <span className="font-mono text-destructive">ELIMINAR</span>:
              </label>
              <input
                id="modal-confirm-input"
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="ELIMINAR"
                autoFocus
                autoComplete="off"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base md:text-sm font-mono text-foreground focus:border-destructive focus:ring-1 focus:ring-destructive focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleInstantDelete}
                disabled={confirmText.trim() !== 'ELIMINAR' || deleting}
                className="px-5 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {deleting ? 'Borrando…' : 'Eliminar permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
