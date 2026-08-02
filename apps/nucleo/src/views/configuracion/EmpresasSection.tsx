'use client';

import { Building2 } from 'lucide-react';
import type { PerfilFragmentProps } from './constants';

export function EmpresasSection({ empresas }: PerfilFragmentProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 animate-in">
      <div className="flex items-center gap-2 text-accent mb-6">
        <Building2 size={18} />
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Empresas Asociadas</h3>
      </div>

      {empresas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Building2 size={32} className="mx-auto opacity-30 mb-3 text-muted-foreground" />
          No perteneces a ninguna empresa aún.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {empresas.map((emp) => (
            <div
              key={emp.empresa_id}
              className="flex items-center justify-between p-4 bg-secondary/40 border border-border/50 rounded-xl"
            >
              <div>
                <p className="font-semibold text-foreground text-sm">{emp.razon_social}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">RUT: {emp.rut}</p>
              </div>
              <span className="badge badge-gold px-2.5 py-0.5 rounded-md text-xs font-semibold border border-accent/20">
                {emp.rol === 'owner'
                  ? 'Propietario'
                  : emp.rol === 'contador'
                    ? 'Contador'
                    : emp.rol === 'operador'
                      ? 'Operador'
                      : 'Lectura'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
