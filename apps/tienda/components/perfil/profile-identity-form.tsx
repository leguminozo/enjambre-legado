'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@enjambre/ui';
import { useAuthStore } from '@enjambre/auth';
import { updateProfileFullName } from '@/app/actions/profile';

type ProfileIdentityFormProps = {
  initialFullName: string;
  email: string;
};

export function ProfileIdentityForm({ initialFullName, email }: ProfileIdentityFormProps) {
  const router = useRouter();
  const refreshSession = useAuthStore((state) => state.refreshSession);
  const [fullName, setFullName] = useState(initialFullName);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    startTransition(async () => {
      try {
        await updateProfileFullName(fullName);
        await refreshSession();
        router.refresh();
        toast('Identidad actualizada', { type: 'success' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo guardar';
        toast(message, { type: 'error' });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <div className="space-y-2">
        <label
          htmlFor="fullName"
          className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1"
        >
          Nombre Completo
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Ej: Gabriel Miranda"
          disabled={isPending}
          className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-foreground focus:outline-none focus:border-accent transition-all disabled:opacity-60"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground ml-1"
        >
          Correo Electrónico
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          readOnly
          disabled
          className="w-full bg-secondary border border-border rounded-xl px-5 py-4 text-sm text-muted-foreground cursor-not-allowed"
        />
        <p className="text-[0.65rem] text-muted-foreground ml-1">
          El correo no se puede cambiar desde aquí. Contacta soporte si necesitas actualizarlo.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending || fullName.trim() === initialFullName.trim()}
        className="self-start px-6 py-3 rounded-xl bg-accent text-accent-foreground text-xs uppercase tracking-[0.15em] font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? 'Guardando…' : 'Guardar identidad'}
      </button>
    </form>
  );
}