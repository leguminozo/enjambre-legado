'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Trash2 } from 'lucide-react';
import { toast } from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { exportAccountData, requestAccountDeletion } from '@/app/actions/account-privacy';

export function AccountPrivacySection() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const [exporting, startExport] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [confirm, setConfirm] = useState('');

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
      } catch {
        toast('No se pudo exportar. Intenta de nuevo.', { type: 'error' });
      }
    });
  };

  const handleDelete = () => {
    if (confirm.trim().toUpperCase() !== 'ELIMINAR') {
      toast('Escribe ELIMINAR para confirmar', { type: 'error' });
      return;
    }
    startDelete(async () => {
      try {
        await requestAccountDeletion();
        await signOut();
        toast('Solicitud registrada. Pedidos y boletas se conservan por ley.', { type: 'success' });
        router.push('/');
      } catch {
        toast('No se pudo registrar la solicitud.', { type: 'error' });
      }
    });
  };

  return (
    <section className="space-y-6 border-t border-border pt-12">
      <div>
        <h3 className="text-[0.65rem] uppercase tracking-[0.2em] font-bold text-accent-text">
          Tus datos (Ley 21.719)
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Puedes llevarte una copia o pedir que cerremos la cuenta. Las ventas y documentos
          tributarios se conservan el plazo legal.
        </p>
      </div>

      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium text-foreground hover:border-accent/40 disabled:opacity-50"
      >
        <Download size={16} />
        {exporting ? 'Preparando…' : 'Descargar mis datos'}
      </button>

      <div className="space-y-3">
        <label htmlFor="arco-delete" className="text-xs text-muted-foreground">
          Para eliminar, escribe ELIMINAR
        </label>
        <input
          id="arco-delete"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-destructive/40 px-5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 size={16} />
          {deleting ? 'Registrando…' : 'Solicitar eliminación'}
        </button>
      </div>
    </section>
  );
}
