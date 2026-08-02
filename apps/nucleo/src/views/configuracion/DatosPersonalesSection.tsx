'use client';

import { User, Mail, Shield, Edit3, X, Save } from 'lucide-react';
import { HexagonLoader } from '@enjambre/ui';
import { ROLE_LABELS, type PerfilFragmentProps } from './constants';

export function DatosPersonalesSection({ profile, editMode, setEditMode, cancelEdit, editName, setEditName, saving, handleSaveProfile }: PerfilFragmentProps) {
  if (!profile) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-in">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-accent">
          <User size={18} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Datos Personales</h3>
        </div>
        <button
          type="button"
          className="btn btn-ghost btn-sm flex items-center gap-1.5 px-3 rounded-lg text-xs"
          onClick={() => (editMode ? cancelEdit() : setEditMode(true))}
        >
          {editMode ? (<><X size={14} /> Cancelar</>) : (<><Edit3 size={14} /> Editar</>)}
        </button>
      </div>

      <div className="space-y-6 max-w-lg">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Nombre Completo</label>
          {editMode ? (
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full min-h-11 bg-secondary border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          ) : (
            <p className="text-sm font-semibold text-foreground">{profile.full_name || '—'}</p>
          )}
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Email</label>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail size={16} className="text-muted-foreground" />
            <span>{profile.email}</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Rol Principal</label>
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-accent" />
            <span className="badge badge-gold px-2.5 py-0.5 rounded-md text-xs font-semibold">
              {ROLE_LABELS[profile.role] || profile.role}
            </span>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Miembro desde</label>
          <p className="text-sm text-muted-foreground">
            {new Date(profile.created_at).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {editMode && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="btn btn-gold min-h-12 flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold disabled:opacity-50"
            onClick={handleSaveProfile}
            disabled={saving}
          >
            {saving ? <HexagonLoader size="sm" /> : <Save size={16} />}
            Guardar Cambios
          </button>
        </div>
      )}
    </div>
  );
}
