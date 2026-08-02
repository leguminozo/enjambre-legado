'use client';

import { Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { HexagonLoader } from '@enjambre/ui';
import type { PerfilFragmentProps } from './constants';

export function SeguridadSection({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  showCurrent,
  setShowCurrent,
  showNew,
  setShowNew,
  passwordSaving,
  handleChangePassword,
}: PerfilFragmentProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-in">
      <div className="flex items-center gap-2 text-accent mb-6">
        <Lock size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Cambiar Contraseña</h3>
      </div>

      <div className="space-y-6 max-w-md">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Nueva Contraseña</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className="w-full min-h-11 bg-secondary border border-border rounded-lg pl-10 pr-12 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showNew ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Confirmar Contraseña</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showCurrent ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repetir contraseña"
              className="w-full min-h-11 bg-secondary border border-border rounded-lg pl-10 pr-12 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-1 top-1/2 -translate-y-1/2 inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showCurrent ? 'Ocultar confirmación' : 'Mostrar confirmación'}
            >
              {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword && newPassword !== confirmPassword && (
            <p className="text-xs text-destructive mt-1.5">Las contraseñas no coinciden</p>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="btn btn-gold min-h-12 flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold disabled:opacity-50"
            onClick={handleChangePassword}
            disabled={passwordSaving || !newPassword || newPassword !== confirmPassword}
          >
            {passwordSaving ? <HexagonLoader size="sm" /> : <Check size={16} />}
            Actualizar Contraseña
          </button>
        </div>
      </div>

      <div className="mt-8 p-4 bg-info/10 border border-info/20 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-info">
          <AlertCircle size={16} />
          <span className="text-xs font-bold text-foreground">Recomendaciones</span>
        </div>
        <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
          <li>Usa al menos 8 caracteres con números y símbolos</li>
          <li>No reutilices contraseñas de otros servicios</li>
          <li>Cambia tu contraseña periódicamente</li>
        </ul>
      </div>
    </div>
  );
}
